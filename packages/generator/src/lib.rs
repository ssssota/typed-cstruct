// #![deny(clippy::all)]

use std::collections::HashSet;

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
    let mut visitor = StructVisitor {
        structs: vec![],
        types: vec![],
    };
    visitor.visit_file(&ast);

    let mut result = "import * as __typ from 'typed-cstruct';\n".to_string();
    let mut created = HashSet::new();
    let mut used = HashSet::new();
    for s in visitor.structs {
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
                    result.push_str(&ty);
                    result.push_str("())\n");
                    used.insert(ty);
                }
                _ => unimplemented!("currently unsupported type"),
            }
        }
        result.push_str("}\n");
        created.insert(name);
    }
    for a in visitor.types {
        let name = a.ident.to_string();
        result.push_str("export function ");
        result.push_str(&name);
        result.push_str("() {\n");
        match *a.ty {
            syn::Type::Path(ref p) => {
                let ty = p
                    .path
                    .segments
                    .iter()
                    .map(|s| s.ident.to_string())
                    .collect::<Vec<String>>()
                    .join("__");
                result.push_str("  return ");
                result.push_str(&ty);
                result.push_str("();\n");
                used.insert(ty);
            }
            _ => unimplemented!("currently unsupported type"),
        }
        result.push_str("}\n");
        created.insert(name);
    }
    let used_but_not_created = used.difference(&created);
    for ty in used_but_not_created {
        if let Some(well_known) = WELL_KNOWN_TYPES.get(ty.as_str()) {
            result.push_str("function ");
            result.push_str(ty);
            result.push_str("() {\n");
            result.push_str("  return ");
            result.push_str(well_known);
            result.push_str(";\n");
            result.push_str("}\n");
        } else {
            return Err(err(format!("type {} is used but not created", ty)));
        }
    }

    Ok(result)
}

struct StructVisitor<'ast> {
    structs: Vec<&'ast syn::ItemStruct>,
    types: Vec<&'ast syn::ItemType>,
}
impl<'ast> syn::visit::Visit<'ast> for StructVisitor<'ast> {
    fn visit_item_struct(&mut self, node: &'ast syn::ItemStruct) {
        self.structs.push(node);
        syn::visit::visit_item_struct(self, node);
    }
    fn visit_item_type(&mut self, node: &'ast syn::ItemType) {
        self.types.push(node);
        syn::visit::visit_item_type(self, node);
    }
}

fn err<T: ToString>(e: T) -> Error {
    Error::from_reason(e.to_string())
}
