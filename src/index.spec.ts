import { expect, expectTypeOf, it } from "vitest";
import * as typ from "./builders/index.js";
import { Struct } from "./index.js";

it("single field", () => {
	/**
	 * ```c
	 * struct {
	 *   uint8_t a;
	 * } buf = { 0x01 };
	 * ```
	 */
	const buf = new Uint8Array([0x01]);
	const struct = new Struct().field("a", typ.u8).build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{ readonly a: number }>();
	expect(struct).toEqual({ a: 1 });
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
	const struct = new Struct()
		.field("a", typ.u8)
		.field("b", typ.u8)
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct).toEqual({ a: 1, b: 2 });
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
	const struct = new Struct()
		.field("a", typ.u8)
		.field("b", typ.u8)
		.build({ buf, offset: 3 });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct).toEqual({ a: 1, b: 2 });
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
	const struct = new Struct()
		.field("a", typ.u16)
		.build({ buf, endian: "little" });
	expectTypeOf(struct).toEqualTypeOf<{ readonly a: number }>();
	expect(struct).toEqual({ a: 1 });
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
	const struct = new Struct().field("a", typ.u16).build({ buf, endian: "big" });
	expectTypeOf(struct).toEqualTypeOf<{ readonly a: number }>();
	expect(struct).toEqual({ a: 256 });
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
		.field("len", typ.u32)
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly str: string;
		readonly len: number;
	}>();
	expect(struct).toEqual({ str: "Hello", len: 5 });
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
		.field("length", typ.u8)
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly arr: number[];
		readonly length: number;
	}>();
	expect(struct).toEqual({ arr: [1, 2, 3], length: 3 });
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
	const struct = new Struct()
		.field("str", typ.sizedCharArrayAsString(8))
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{ readonly str: string }>();
	expect(struct).toEqual({ str: "foo" });
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
	const struct = new Struct()
		.field("str", typ.sizedCharArrayAsString(8, false))
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{ readonly str: string }>();
	expect(struct).toEqual({ str: `foo${"\0".repeat(5)}` });
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
		.field("c", typ.u8)
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly a: number;
		readonly inner: { readonly b: number };
		readonly c: number;
	}>();
	expect(struct).toEqual({ a: 1, inner: { b: 1 }, c: 255 });
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
		.field("str", typ.pointerArrayFromLengthField(typ.char, "length"))
		.build({ buf, offset: 5 });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly length: number;
		readonly str: string[];
	}>();
	expect(struct).toEqual({ length: 5, str: ["H", "e", "l", "l", "o"] });
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
	const struct = new Struct()
		.field(
			"lang",
			typ.enumLike(typ.u8, { 0: "English", 1: "Japanese" } as const),
		)
		.build({ buf });
	expectTypeOf(struct).toEqualTypeOf<{
		readonly lang: "English" | "Japanese";
	}>();
	expect(struct).toEqual({ lang: "Japanese" });
});
