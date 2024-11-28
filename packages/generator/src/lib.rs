use std::collections::{HashMap, HashSet};

use napi::bindgen_prelude::*;
use phf::phf_map;
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

    // https://doc.rust-lang.org/std/index.html#primitives
    "bool" => "__typ.bool",
    "char" => "__typ.u8",
    "f32" => "__typ.f32",
    "f64" => "__typ.f64",
    "i8" => "__typ.i8",
    "i16" => "__typ.i16",
    "i32" => "__typ.i32",
    "i64" => "__typ.i64",
    "u8" => "__typ.u8",
    "u16" => "__typ.u16",
    "u32" => "__typ.u32",
    "u64" => "__typ.u64",
    "isize" => "__typ.i32",
    "usize" => "__typ.u32",
};
fn well_known_or(ty: &str) -> &str {
    WELL_KNOWN_TYPES.get(ty).copied().unwrap_or(ty)
}

#[napi]
pub fn generate(headers: Vec<String>) -> Result<String> {
    let bindings = bindgen::builder()
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
        result.push_str("export function ");
        result.push_str(&name);
        result.push_str("() {\n");
        result.push_str("  return new __typ.default()\n");
        for f in &s.fields {
            match &f.ty {
                syn::Type::Path(ref p) => {
                    let ty = p
                        .path
                        .segments
                        .iter()
                        .map(|s| s.ident.to_string())
                        .collect::<Vec<String>>()
                        .join("__");
                    result.push_str("    .field('");
                    result.push_str(&f.ident.as_ref().unwrap().to_string());
                    result.push_str("', ");
                    result.push_str(well_known_or(&ty));
                    result.push_str("())\n");
                    if !WELL_KNOWN_TYPES.contains_key(&ty) {
                        used.insert(ty);
                    }
                }
                syn::Type::Array(ref a) => {
                    let ty = print_type(&a.elem);
                    result.push_str("    .field('");
                    result.push_str(&f.ident.as_ref().unwrap().to_string());
                    result.push_str("', ");
                    result.push_str("__typ.sizedArray(");
                    result.push_str(well_known_or(&ty));
                    result.push_str(", ");
                    result.push_str(&print_expr(&a.len));
                    result.push_str("))\n");
                    if !WELL_KNOWN_TYPES.contains_key(&ty) {
                        used.insert(ty);
                    }
                }
                _ => unimplemented!("currently unsupported type"),
            }
        }
        result.push_str("}\n");
        created.insert(name);
    }
    for e in find_enums(&visitor) {
        result.push_str("export function ");
        result.push_str(&e.0);
        result.push_str("() {\n");
        result.push_str("  return __typ.enumLike({\n");
        for (k, v) in e.1 {
            result.push_str("    ");
            result.push_str(&k);
            result.push_str(": ");
            result.push_str(&v);
            result.push_str(",\n");
        }
        result.push_str("  })\n");
        result.push_str("}\n");
        created.insert(e.0);
    }
    let not_created_types = visitor
        .types
        .iter()
        .filter(|t| !created.contains(&t.ident.to_string()))
        .collect::<Vec<&&syn::ItemType>>();
    for a in not_created_types {
        let name = a.ident.to_string();
        let ty = print_type(&a.ty);
        result.push_str("export function ");
        result.push_str(&name);
        result.push_str("() {\n");
        result.push_str("  return ");
        result.push_str(well_known_or(&ty));
        result.push_str("();\n");
        if !WELL_KNOWN_TYPES.contains_key(&ty) {
            used.insert(ty);
        }
        result.push_str("}\n");
        created.insert(name);
    }
    let used_but_not_created = used.difference(&created);
    if used_but_not_created.count() > 0 {
        return Err(err("used but not created"));
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
        _ => unimplemented!("unsupported expression"),
    }
}
fn print_type(ty: &syn::Type) -> String {
    match ty {
        syn::Type::Path(ref p) => p
            .path
            .segments
            .iter()
            .map(|s| s.ident.to_string())
            .collect::<Vec<String>>()
            .join("__"),
        _ => unimplemented!("unsupported type"),
    }
}
fn find_enums(visitor: &DeclarationVisitor) -> HashMap<String, HashMap<String, String>> {
    let mut enums: HashMap<String, HashMap<String, String>> = HashMap::new();
    let ty_candidates = &visitor
        .types
        .clone()
        .into_iter()
        .map(|t| t.ident.to_string())
        .collect::<Vec<String>>();
    for c in &visitor.constants {
        let ty = print_type(&c.ty);
        if !ty_candidates.contains(&ty) {
            continue;
        }
        let ty_len = ty.len();
        let variant_name = c.ident.to_string()[ty_len + 1..].to_string();
        let variant_value = print_expr(&c.expr);
        if let Some(e) = enums.get_mut(&ty) {
            e.insert(variant_name, variant_value);
        } else {
            let mut e = HashMap::new();
            e.insert(variant_name, variant_value);
            enums.insert(ty, e);
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
        "#;
        let ts = rust_to_ts(rust).unwrap();
        insta::assert_snapshot!(ts);
    }
}