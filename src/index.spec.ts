import { expect, expectTypeOf, it } from "vitest";
import Struct, * as typ from "./index.js";

it("single field", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t a;
	 * } buf = { 0x01 };
	 * ```
	 */
	const buf = new Uint8Array([0x01]);
	const struct = new Struct().field("a", typ.u8);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{ readonly a: number }>();
	expect(struct.proxy({ buf })).toEqual({ a: 1 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{ readonly a: number }>();
	expect(struct.read({ buf })).toStrictEqual({ a: 1 });
});
it("multiple fields", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t a;
	 *   uint8_t b;
	 * } buf = { 0x01, 0x02 };
	 * ```
	 */
	const buf = new Uint8Array([0x01, 0x02]);
	const struct = new Struct().field("a", typ.u8).field("b", typ.u8);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ a: 1, b: 2 });
});
it("offset", () => {
	/**
	 * ```c
	 * auto padding = { 0x00, 0x00, 0x00 };
	 * struct {
	 *   uint8_t a;
	 *   uint8_t b;
	 * } buf = { 0x01, 0x02 };
	 * ```
	 */
	const buf = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x02]);
	const struct = new Struct().field("a", typ.u8).field("b", typ.u8);
	expectTypeOf(struct.proxy({ buf, offset: 3 })).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.proxy({ buf, offset: 3 })).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read({ buf, offset: 3 })).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.read({ buf, offset: 3 })).toStrictEqual({ a: 1, b: 2 });
});
it("little endian", () => {
	/**
	 * ```c
	 * struct {
	 *   uint16_t a;
	 * } buf = { 1 };
	 * ```
	 */
	const buf = new Uint8Array([0x01, 0x00]);
	const struct = new Struct().field("a", typ.u16);
	expectTypeOf(struct.proxy({ buf, endian: "little" })).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.proxy({ buf, endian: "little" })).toEqual({ a: 1 });
	expectTypeOf(struct.read({ buf, endian: "little" })).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.read({ buf, endian: "little" })).toStrictEqual({ a: 1 });
});
it("big endian", () => {
	/**
	 * ```c
	 * struct {
	 *   uint16_t a;
	 * } buf = { 256 };
	 * ```
	 */
	const buf = new Uint8Array([0x01, 0x00]);
	const struct = new Struct().field("a", typ.u16);
	expectTypeOf(struct.proxy({ buf, endian: "big" })).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.proxy({ buf, endian: "big" })).toEqual({ a: 256 });
	expectTypeOf(struct.read({ buf, endian: "big" })).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.read({ buf, endian: "big" })).toStrictEqual({ a: 256 });
});
it("char*", () => {
	/**
	 * ```c
	 * struct {
	 *   char* str;
	 *   size_t len;
	 * } string = { "Hello", 5 };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x08, 0x00, 0x00, 0x00, // *str
    0x05, 0x00, 0x00, 0x00, // len
    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, // "Hello"
	]);
	const struct = new Struct()
		.field("str", typ.charPointerAsString)
		.field("len", typ.u32);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly str: string;
		readonly len: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ str: "Hello", len: 5 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly str: string;
		readonly len: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ str: "Hello", len: 5 });
});
it("sized array", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t arr[3];
	 *   uint8_t length;
	 * } buf = { { 0x01, 0x02, 0x03 }, 3 };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x01, 0x02, 0x03, // arr
		0x03, // length
	]);
	const struct = new Struct()
		.field("arr", typ.sizedArray(typ.u8, 3))
		.field("length", typ.u8);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly arr: number[];
		readonly length: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ arr: [1, 2, 3], length: 3 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly arr: number[];
		readonly length: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ arr: [1, 2, 3], length: 3 });
});
it("sized string", () => {
	/**
	 * ```c
	 * struct {
	 *   char str[8];
	 * } buf = { "foo" };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x66, 0x6f, 0x6f, 0x00, // str
		0x00, 0x00, 0x00, 0x00, // padding
	]);
	const struct = new Struct().field("str", typ.sizedCharArrayAsString(8));
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.proxy({ buf })).toEqual({ str: "foo" });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.read({ buf })).toStrictEqual({ str: "foo" });
});
it("sized string (disable null termination)", () => {
	/**
	 * ```c
	 * struct {
	 *   char str[8];
	 * } buf = { "foo" };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x66, 0x6f, 0x6f, 0x00, // str
		0x00, 0x00, 0x00, 0x00, // padding
	]);
	const struct = new Struct().field(
		"str",
		typ.sizedCharArrayAsString(8, false),
	);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.proxy({ buf })).toEqual({ str: `foo${"\0".repeat(5)}` });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.read({ buf })).toStrictEqual({ str: `foo${"\0".repeat(5)}` });
});
it("nested struct", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t a;
	 *   struct {
	 *     uint8_t b;
	 *   } inner;
	 *   uint8_t c;
	 * } = { 0x01, { 0x01 }, 0xff };
	 * ```
	 */
	const buf = new Uint8Array([0x01, 0x01, 0xff]);
	const struct = new Struct()
		.field("a", typ.u8)
		.field("inner", new Struct().field("b", typ.u8))
		.field("c", typ.u8);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly inner: { readonly b: number };
		readonly c: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ a: 1, inner: { b: 1 }, c: 255 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly inner: { readonly b: number };
		readonly c: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ a: 1, inner: { b: 1 }, c: 255 });
});
it("length from field", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t length;
	 *   char *str;
	 * } string = { 5, "Hello" };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x48, 0x65, 0x6c, 0x6c, 0x6f, // "Hello"
		0x05, // length
		0x00, 0x00, 0x00, 0x00, // str*
	]);
	const struct = new Struct()
		.field("length", typ.u8)
		.field("str", typ.pointerArrayFromLengthField(typ.char, "length"));
	expectTypeOf(struct.proxy({ buf, offset: 5 })).toEqualTypeOf<{
		readonly length: number;
		readonly str: string[];
	}>();
	expect(struct.proxy({ buf, offset: 5 })).toEqual({
		length: 5,
		str: ["H", "e", "l", "l", "o"],
	});
	expectTypeOf(struct.read({ buf, offset: 5 })).toEqualTypeOf<{
		readonly length: number;
		readonly str: string[];
	}>();
	expect(struct.read({ buf, offset: 5 })).toStrictEqual({
		length: 5,
		str: ["H", "e", "l", "l", "o"],
	});
});
it("enum", () => {
	/**
	 * ```c
	 * enum Language {
	 *   English,
	 *   Japanese
	 * };
	 * struct {
	 *   Language lang;
	 * } buf = { Japanese };
	 * ```
	 */
	const buf = new Uint8Array([0x01]);
	const struct = new Struct().field(
		"lang",
		typ.enumLike(typ.u8, { 0: "English", 1: "Japanese" } as const),
	);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly lang: "English" | "Japanese";
	}>();
	expect(struct.proxy({ buf })).toEqual({ lang: "Japanese" });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly lang: "English" | "Japanese";
	}>();
	expect(struct.read({ buf })).toStrictEqual({ lang: "Japanese" });
});
it("skip", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t a;
	 *   uint8_t unused;
	 *   uint8_t b;
	 * } buf = { 0x01, 0xff, 0x02 };
	 */
	const buf = new Uint8Array([0x01, 0xff, 0x02]);
	const struct = new Struct()
		.field("a", typ.u8)
		.field("unused", typ.skip(typ.u8.size))
		.field("b", typ.u8);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly unused: never;
		readonly b: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly unused: never;
		readonly b: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ a: 1, b: 2 });
});
it("readme sample", () => {
	/**
	 * ```c
	 * struct {
	 *   int a;
	 *   char b;
	 *   float c;
	 *   char d[8];
	 *   uint8_t buf_size;
	 *   char *buf;
	 * } buf = { 1, 'a', 0.5, "hello", 5, "world" };
	 * ```
	 */
	// biome-ignore format: binary readability
	const buf = new Uint8Array([
		0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00, // "world"
		0x01, 0x00, 0x00, 0x00, // a
		0x61, // b
		0x00, 0x00, 0x00, 0x3f, // c
		0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x00, // d
		0x05, // buf_size
		0x00, 0x00, 0x00, 0x00, // buf*
	]);
	const struct = new Struct()
		.field("a", typ.i32)
		.field("b", typ.char)
		.field("c", typ.f32)
		.field("d", typ.sizedCharArrayAsString(8))
		.field("buf_size", typ.u8)
		.field("buf", typ.pointerArrayFromLengthField(typ.char, "buf_size"))
		.read({ buf, offset: 6 });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly a: number;
		readonly b: string;
		readonly c: number;
		readonly d: string;
		readonly buf_size: number;
		readonly buf: string[];
	}>();
	expect(struct).toEqual({
		a: 1,
		b: "a",
		c: 0.5,
		d: "hello",
		buf_size: 5,
		buf: ["w", "o", "r", "l", "d"],
	});
});
