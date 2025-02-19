use napi::bindgen_prelude::*;
use phf::phf_map;
use std::collections::{HashMap, HashSet};
use syn::visit::Visit;

#[macro_use]
extern crate napi_derive;

static WELL_KNOWN_TYPES: phf::Map<&'static str, &'static str> = phf_map! {
    // https://doc.rust-lang.org/core/ffi/index.html#types
    // c_char Equivalent to C’s `char` type.
    "core__ffi__c_char" => "__typ.u8",
    // c_double Equivalent to C’s `double` type.
    "core__ffi__c_double" => "__typ.f64",
    // c_float Equivalent to C’s `float` type.
    "core__ffi__c_float" => "__typ.f32",
    // c_int Equivalent to C’s `signed int (int)` type.
    "core__ffi__c_int" => "__typ.i32",
    // c_long Equivalent to C’s `signed long (long)` type.
    "core__ffi__c_long" => "__typ.i64",
    // c_longlong Equivalent to C’s `signed long long (long long)` type.
    "core__ffi__c_longlong" => "__typ.i64",
    // c_schar Equivalent to C’s `signed char` type.
    "core__ffi__c_schar" => "__typ.i8",
    // c_short Equivalent to C’s `signed short (short)` type.
    "core__ffi__c_short" => "__typ.i16",
    // c_uchar Equivalent to C’s `unsigned char` type.
    "core__ffi__c_uchar" => "__typ.u8",
    // c_uint Equivalent to C’s `unsigned int` type.
    "core__ffi__c_uint" => "__typ.u32",
    // c_ulong Equivalent to C’s `unsigned long` type.
    "core__ffi__c_ulong" => "__typ.u64",
    // c_ulonglong Equivalent to C’s `unsigned long long` type.
    "core__ffi__c_ulonglong" => "__typ.u64",
    // c_ushort Equivalent to C’s `unsigned short` type.
    "core__ffi__c_ushort" => "__typ.u16",

    // Unknown
    // Equivalent to C’s void type when used as a pointer.
    "core__ffi__c_void" => "__typ.u32",
    "core__option__Option" => "__typ.u32",

    // https://doc.rust-lang.org/std/index.html#primitives
    "bool" => "__typ.bool",
    "char" => "__typ.u8",
    "f32" => "__typ.f32",
    "f64" => "__typ.f64",
    "i8" => "__typ.i8",
    "i16" => "__typ.i16",
    "i32" => "__typ.i32",
    "i64" => "__typ.i64",
    "i128" => "__typ.i128",
    "u8" => "__typ.u8",
    "u16" => "__typ.u16",
    "u32" => "__typ.u32",
    "u64" => "__typ.u64",
    "u128" => "__typ.u128",
    "isize" => "__typ.i32",
    "usize" => "__typ.u32",
};
macro_rules! sort_hashmap {
    ($h:expr, $k:ty, $v:ty) => {{
        let mut sorted = $h.iter().collect::<Vec<(&$k, &$v)>>();
        sorted.sort_by(|a, b| a.0.cmp(b.0));
        sorted
    }};
}
fn well_known_or(ty: &str) -> String {
    WELL_KNOWN_TYPES
        .get(ty)
        .map(|s| s.to_string())
        .unwrap_or(format!("{ty}()"))
}

#[napi]
pub fn generate(
    headers: Vec<&str>,
    dump_rust_code: Option<bool>,
    clang_args: Option<Vec<&str>>,
    entry_types: Option<Vec<&str>>,
) -> Result<String> {
    let bindings = bindgen::builder()
        .clang_args(clang_args.unwrap_or_default())
        .formatter(bindgen::Formatter::None)
        .disable_header_comment()
        .layout_tests(false)
        .derive_copy(false)
        .derive_debug(false)
        .use_core()
        .ignore_functions()
        .ignore_methods()
        .generate_comments(false)
        .headers(headers)
        .generate()
        .map_err(err)?;

    let mut buf = vec![];
    bindings.write(Box::new(&mut buf)).map_err(err)?;

    let rust = String::from_utf8(buf).map_err(err)?;

    if let Some(true) = dump_rust_code {
        println!("{}\n", rust);
    }

    // Ok(rust)
    rust_to_ts(&rust, entry_types.unwrap_or_default())
}

struct Entity {
    name: String,
    code: String,
    deps: Vec<String>,
}

pub fn rust_to_ts(rust: &str, entry_types: Vec<&str>) -> Result<String> {
    let ast: syn::File = syn::parse_str(rust).map_err(err)?;
    let mut visitor = DeclarationVisitor::new();
    visitor.visit_file(&ast);

    let mut code_parts = vec![];
    let mut entities: HashMap<String, Entity> = HashMap::new();
    for a in &visitor.types {
        let entity = print_item_type(a);
        entities.insert(entity.name.clone(), entity);
    }
    for s in &visitor.structs {
        let entity = print_struct(s);
        entities.insert(entity.name.clone(), entity);
    }
    let enums = find_enums(&visitor);
    for (enum_name, enum_def) in sort_hashmap!(&enums, String, Enum) {
        let entity = print_enum(enum_name, enum_def);
        entities.insert(entity.name.clone(), entity);
    }

    if entry_types.is_empty() {
        for (_, entity) in entities {
            code_parts.push(entity.code);
        }
    } else {
        let mut queue = entry_types
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();
        let mut visited = HashSet::new();
        while let Some(name) = queue.pop() {
            if visited.contains(&name) {
                continue;
            }
            visited.insert(name.clone());
            if let Some(entity) = entities.get(&name) {
                code_parts.push(entity.code.clone());
                queue.extend(entity.deps.iter().cloned());
            }
        }
    }
    code_parts.sort();
    code_parts.insert(0, "import * as __typ from 'typed-cstruct';".to_string());

    Ok(code_parts.join("\n"))
}

struct DeclarationVisitor<'ast> {
    structs: Vec<&'ast syn::ItemStruct>,
    types: Vec<&'ast syn::ItemType>,
    constants: Vec<&'ast syn::ItemConst>,
}
impl DeclarationVisitor<'_> {
    fn new() -> Self {
        DeclarationVisitor {
            structs: vec![],
            types: vec![],
            constants: vec![],
        }
    }
}
impl<'ast> syn::visit::Visit<'ast> for DeclarationVisitor<'ast> {
    fn visit_item_struct(&mut self, node: &'ast syn::ItemStruct) {
        self.structs.push(node);
        syn::visit::visit_item_struct(self, node);
    }
    fn visit_item_type(&mut self, node: &'ast syn::ItemType) {
        self.types.push(node);
        syn::visit::visit_item_type(self, node);
    }
    fn visit_item_const(&mut self, node: &'ast syn::ItemConst) {
        self.constants.push(node);
        syn::visit::visit_item_const(self, node);
    }
}

#[inline]
fn err<T: ToString>(e: T) -> Error {
    Error::from_reason(e.to_string())
}

fn print_expr(expr: &syn::Expr) -> String {
    match expr {
        syn::Expr::Lit(ref lit) => match &lit.lit {
            syn::Lit::Int(ref i) => i.base10_digits().to_string(),
            _ => unimplemented!("unsupported literal"),
        },
        syn::Expr::Unary(ref u) => {
            let op = match u.op {
                syn::UnOp::Neg(_) => "-",
                _ => unimplemented!("unsupported unary operator"),
            };
            format!("{}{}", op, print_expr(&u.expr))
        }
        _ => unimplemented!("unsupported expr"),
    }
}
fn print_type(ty: &syn::Type) -> (String, Vec<String>) {
    match ty {
        syn::Type::Path(ref p) => {
            let ty = p
                .path
                .segments
                .iter()
                .map(|s| s.ident.to_string())
                .collect::<Vec<String>>()
                .join("__");
            (well_known_or(&ty), vec![ty])
        }
        syn::Type::Array(ref a) => {
            let (ty, used) = print_type(&a.elem);
            (
                format!("__typ.sizedArray({},{})", &ty, &print_expr(&a.len)),
                used,
            )
        }
        syn::Type::Ptr(ref p) => {
            let (ty, used) = print_type(&p.elem);
            (format!("__typ.ptr({})", &ty), used)
        }
        _ => unimplemented!("unsupported type"),
    }
}
fn print_struct(s: &syn::ItemStruct) -> Entity {
    let mut code_parts: Vec<String> = vec![];
    let mut deps: Vec<String> = vec![];
    let name = s.ident.to_string();

    code_parts.push("export function ".to_string());
    code_parts.push(name.clone());
    code_parts.push("() {\n".to_string());
    code_parts.push("  return new __typ.Struct()\n".to_string());
    if let syn::Fields::Named(named_fields) = &s.fields {
        for f in &named_fields.named {
            let (ty, used) = print_type(&f.ty);
            code_parts.push("    .field('".to_string());
            code_parts.push(f.ident.as_ref().unwrap().to_string());
            code_parts.push("', ".to_string());
            code_parts.push(ty);
            code_parts.push(")\n".to_string());
            deps.extend(used);
        }
    }
    code_parts.push("}".to_string());

    Entity {
        name,
        code: code_parts.concat(),
        deps,
    }
}
fn print_enum(name: &str, enum_def: &Enum) -> Entity {
    let mut code_parts: Vec<String> = vec![];
    let mut deps: Vec<String> = vec![];

    let (ty, used) = print_type(&enum_def.ty);
    code_parts.push("export function ".to_string());
    code_parts.push(name.to_string());
    code_parts.push("() {\n".to_string());
    code_parts.push("  return __typ.enumLike(".to_string());
    code_parts.push(ty);
    code_parts.push(", {\n".to_string());
    let mut sorted = enum_def
        .variants
        .iter()
        .collect::<Vec<(&String, &String)>>();
    sorted.sort_by(|a, b| a.1.cmp(b.1));
    for (k, v) in sort_hashmap!(enum_def.variants, String, String) {
        code_parts.push(format!("    {k}: {v},\n"));
    }
    code_parts.push("  })\n".to_string());
    code_parts.push("}".to_string());
    deps.extend(used);

    Entity {
        name: name.to_string(),
        code: code_parts.concat(),
        deps,
    }
}
fn print_item_type(t: &syn::ItemType) -> Entity {
    let (ty, deps) = print_type(&t.ty);
    let name = t.ident.to_string();
    let code = format!(
        "export function {name}() {{\n  return {ty};\n}}",
        name = name,
        ty = ty
    );
    Entity { name, code, deps }
}

struct Enum {
    pub ty: Box<syn::Type>,
    pub variants: HashMap<String, String>,
}
fn find_enums(visitor: &DeclarationVisitor) -> HashMap<String, Enum> {
    let mut enums: HashMap<String, Enum> = HashMap::new();
    let mut ty_candidates: HashMap<String, Box<syn::Type>> = HashMap::new();
    for t in &visitor.types {
        ty_candidates.insert(t.ident.to_string(), t.ty.clone());
    }
    for c in &visitor.constants {
        if let syn::Type::Path(ref p) = *c.ty {
            if p.path.segments.len() != 1 {
                continue;
            }
            let ty = p.path.segments[0].ident.to_string();
            let ty_len = ty.len();
            let const_name = c.ident.to_string();
            if !const_name.starts_with(&ty) {
                continue;
            }
            if let Some(candidate) = ty_candidates.get(&ty) {
                let variant_name = const_name[ty_len + 1..].to_string();
                let variant_value = print_expr(&c.expr);
                if let Some(e) = enums.get_mut(&ty) {
                    e.variants.insert(variant_name, variant_value);
                } else {
                    let mut e = HashMap::new();
                    e.insert(variant_name, variant_value);
                    enums.insert(
                        ty.clone(),
                        Enum {
                            ty: candidate.clone(),
                            variants: e,
                        },
                    );
                }
            }
        }
    }
    enums
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic() {
        let rust = r#"
            struct A { a: i32, b: B }
            struct B { c: C }
            type C = i32;
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn array() {
        let rust = r#"
            struct A { a: [i32; 3] }
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn enum_like() {
        let rust = r#"
            pub const NOT_E: u32 = 0;
            pub const E_A: E = 0;
            pub const E_B: E = 1;
            pub type E = u32;

            pub const E2_A: E2 = -1;
            pub const E2_B: E2 = 0;
            pub const E2_C: E2 = 1;
            pub type E2 = i32;
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn pointer() {
        let rust = r#"
            struct A { a: *const i32 }
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn pointer_array() {
        let rust = r#"
            struct A { a: [*const i32; 3] }
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn array_pointer() {
        let rust = r#"
            struct A { a: *mut [i32; 3] }
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn nested_array() {
        let rust = r#"
            struct A { a: [[i32; 3]; 3] }
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn not_enum() {
        let rust = r#"
            pub const FP_NAN: _bindgen_ty_1 = 0;
            pub type _bindgen_ty_1 = ::core::ffi::c_uint;
        "#;
        let ts = rust_to_ts(rust, vec![]).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn ignore() {
        let rust = r#"
            struct A { a: i32, b: B }
            struct B { c: C }
            type C = i32;
        "#;
        let ts = rust_to_ts(rust, vec!["B"]).unwrap();
        insta::assert_snapshot!(ts);
    }
}
