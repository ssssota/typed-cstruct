import * as assert from "node:assert";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generate } from "../index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("generate", () => {
	assert.strictEqual(
		generate([path.resolve(__dirname, "sample.h")]),
		`import * as __typ from 'typed-cstruct';
export function foo() {
  return new __typ.default()
    .field('bar', foo__bindgen_ty_1())
}
export function foo__bindgen_ty_1() {
  return new __typ.default()
    .field('a', core__ffi__c_int())
    .field('b', core__ffi__c_int())
}
export function bar() {
  return new __typ.default()
    .field('__bindgen_anon_1', bar__bindgen_ty_1())
}
export function bar__bindgen_ty_1() {
  return new __typ.default()
    .field('a', core__ffi__c_uint())
    .field('b', core__ffi__c_uint())
}
export function Point() {
  return new __typ.default()
    .field('x', number())
    .field('y', number())
}
export function Angle() {
  return new __typ.default()
    .field('a', number())
    .field('b', number())
}
export function number() {
  return f32();
}
function core__ffi__c_uint() {
  return __typ.u32;
}
function core__ffi__c_int() {
  return __typ.i32;
}
function f32() {
  return __typ.f32;
}
`,
	);
});
