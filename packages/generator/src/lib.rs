use std::collections::{HashMap, HashSet};

use napi::bindgen_prelude::*;
use phf::{phf_map, phf_set};
use syn::visit::Visit;

#[macro_use]
extern crate napi_derive;

static IGNORE_TYPES: phf::Set<&'static str> = phf_set! {
    "__BindgenBitfieldUnit",
    "__BindgenUnionField",
};
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
) -> Result<String> {
    let bindings = bindgen::builder()
        .clang_args(clang_args.unwrap_or(vec![]))
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
    rust_to_ts(&rust)
}

pub fn rust_to_ts(rust: &str) -> Result<String> {
    let ast: syn::File = syn::parse_str(rust).map_err(err)?;
    let mut visitor = DeclarationVisitor::new();
    visitor.visit_file(&ast);

    let mut result = "import * as __typ from 'typed-cstruct';\n".to_string();
    let mut created = HashSet::new();
    let mut used = HashSet::new();
    for s in &visitor.structs {
        let name = s.ident.to_string();
        if IGNORE_TYPES.contains(&name.as_str()) {
            continue;
        }
        result.push_str("export function ");
        result.push_str(&name);
        result.push_str("() {\n");
        result.push_str("  return new __typ.default()\n");
        if let syn::Fields::Named(named_fields) = &s.fields {
            for f in &named_fields.named {
                let (ty, used2) = print_type(&f.ty);
                result.push_str("    .field('");
                result.push_str(&f.ident.as_ref().unwrap().to_string());
                result.push_str("', ");
                result.push_str(&ty);
                result.push_str(")\n");
                for u in used2 {
                    if !WELL_KNOWN_TYPES.contains_key(&u) {
                        used.insert(u);
                    }
                }
            }
            created.insert(name);
        }
        result.push_str("}\n");
    }
    for (enum_name, enum_def) in find_enums(&visitor) {
        let (ty, used2) = print_type(&enum_def.ty);
        result.push_str("export function ");
        result.push_str(&enum_name);
        result.push_str("() {\n");
        result.push_str("  return __typ.enumLike(");
        result.push_str(&ty);
        result.push_str(", {\n");
        let mut sorted = enum_def
            .variants
            .iter()
            .collect::<Vec<(&String, &String)>>();
        sorted.sort_by(|a, b| a.1.cmp(b.1));
        for (k, v) in sorted {
            result.push_str(format!("    {k}: {v},\n").as_str());
        }
        result.push_str("  })\n");
        result.push_str("}\n");
        created.insert(enum_name);
        for u in used2 {
            if !WELL_KNOWN_TYPES.contains_key(&u) {
                used.insert(u);
            }
        }
    }
    let not_created_types = visitor
        .types
        .iter()
        .filter(|t| !created.contains(&t.ident.to_string()))
        .collect::<Vec<&&syn::ItemType>>();
    for a in not_created_types {
        let name = a.ident.to_string();
        let (ty, used2) = print_type(&a.ty);
        result.push_str("export function ");
        result.push_str(&name);
        result.push_str("() {\n");
        result.push_str("  return ");
        result.push_str(&ty);
        result.push_str(";\n");
        result.push_str("}\n");
        created.insert(name);
        for u in used2 {
            if !WELL_KNOWN_TYPES.contains_key(&u) {
                used.insert(u);
            }
        }
    }
    let used_but_not_created = used.difference(&created);
    let used_but_not_created = used_but_not_created
        .filter(|u| !IGNORE_TYPES.contains(&u.as_str()))
        .collect::<Vec<&String>>();
    if used_but_not_created.len() > 0 {
        return Err(err(format!(
            "used but not created: {:?}",
            used_but_not_created,
        )));
    }

    Ok(result)
}

struct DeclarationVisitor<'ast> {
    structs: Vec<&'ast syn::ItemStruct>,
    types: Vec<&'ast syn::ItemType>,
    constants: Vec<&'ast syn::ItemConst>,
}
impl<'ast> DeclarationVisitor<'ast> {
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
            if let Some(candidate) = ty_candidates.get(&ty) {
                let ty_len = ty.len();
                let variant_name = c.ident.to_string()[ty_len + 1..].to_string();
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
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn array() {
        let rust = r#"
            struct A { a: [i32; 3] }
        "#;
        let ts = rust_to_ts(rust).unwrap();
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
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn pointer() {
        let rust = r#"
            struct A { a: *const i32 }
        "#;
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn pointer_array() {
        let rust = r#"
            struct A { a: [*const i32; 3] }
        "#;
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn array_pointer() {
        let rust = r#"
            struct A { a: *mut [i32; 3] }
        "#;
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }

    #[test]
    fn nested_array() {
        let rust = r#"
            struct A { a: [[i32; 3]; 3] }
        "#;
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }
}
