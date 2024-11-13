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
	const opts = { buf };
	const struct = new Struct().field("a", typ.u8);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{ a: number }>();
	expect(struct.proxy(opts)).toEqual({ a: 1 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{ readonly a: number }>();
	expect(struct.read(opts)).toStrictEqual({ a: 1 });
	struct.proxy(opts).a = 2;
	expect(struct.read(opts)).toStrictEqual({ a: 2 });
	expect(buf).toStrictEqual(new Uint8Array([0x02]));
	struct.write({ a: 3 }, opts);
	expect(struct.read(opts)).toStrictEqual({ a: 3 });
	expect(buf).toStrictEqual(new Uint8Array([0x03]));
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
	const opts = { buf };
	const struct = new Struct().field("a", typ.u8).field("b", typ.u8);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		a: number;
		b: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ a: 1, b: 2 });
	struct.proxy(opts).b = 3;
	expect(struct.read(opts)).toStrictEqual({ a: 1, b: 3 });
	expect(buf).toStrictEqual(new Uint8Array([0x01, 0x03]));
	struct.write({ a: 4, b: 5 }, opts);
	expect(struct.read(opts)).toStrictEqual({ a: 4, b: 5 });
	expect(buf).toStrictEqual(new Uint8Array([0x04, 0x05]));
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
	const opts = { buf, offset: 3 };
	const struct = new Struct().field("a", typ.u8).field("b", typ.u8);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		a: number;
		b: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly a: number;
		readonly b: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ a: 1, b: 2 });
	struct.proxy(opts).b = 3;
	expect(struct.read(opts)).toStrictEqual({ a: 1, b: 3 });
	expect(buf).toStrictEqual(new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x03]));
	struct.write({ a: 4, b: 5 }, opts);
	expect(struct.read(opts)).toStrictEqual({ a: 4, b: 5 });
	expect(buf).toStrictEqual(new Uint8Array([0x00, 0x00, 0x00, 0x04, 0x05]));
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
	const opts = { buf, endian: "little" } as const;
	const struct = new Struct().field("a", typ.u16);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		a: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ a: 1 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ a: 1 });
	struct.proxy(opts).a = 2;
	expect(struct.read(opts)).toStrictEqual({ a: 2 });
	expect(buf).toStrictEqual(new Uint8Array([0x02, 0x00]));
	struct.write({ a: 256 }, opts);
	expect(struct.read(opts)).toStrictEqual({ a: 256 });
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
	const opts = { buf, endian: "big" } as const;
	const struct = new Struct().field("a", typ.u16);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		a: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ a: 256 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly a: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ a: 256 });
	struct.proxy(opts).a = 257;
	expect(struct.read(opts)).toStrictEqual({ a: 257 });
	expect(buf).toStrictEqual(new Uint8Array([0x01, 0x01]));
	struct.write({ a: 1 }, opts);
	expect(struct.read(opts)).toStrictEqual({ a: 1 });
	expect(buf).toStrictEqual(new Uint8Array([0x00, 0x01]));
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
	const opts = { buf };
	const struct = new Struct()
		.field("str", typ.charPointerAsString)
		.field("len", typ.u32);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		str: string;
		len: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ str: "Hello", len: 5 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly str: string;
		readonly len: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ str: "Hello", len: 5 });
	expect(() => {
		struct.proxy(opts).str = "World";
	}).toThrowError("'set' on proxy: trap returned falsish for property 'str'");
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
	const opts = { buf };
	const struct = new Struct()
		.field("arr", typ.sizedArray(typ.u8, 3))
		.field("length", typ.u8);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		arr: number[];
		length: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ arr: [1, 2, 3], length: 3 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly arr: number[];
		readonly length: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ arr: [1, 2, 3], length: 3 });
	struct.proxy(opts).arr = [4, 5, 6];
	expect(struct.read(opts)).toStrictEqual({ arr: [4, 5, 6], length: 3 });
	expect(buf).toStrictEqual(new Uint8Array([0x04, 0x05, 0x06, 0x03]));
	struct.proxy(opts).arr[2] = 0;
	expect(struct.read(opts)).toStrictEqual({ arr: [4, 5, 0], length: 3 });
	expect(buf).toStrictEqual(new Uint8Array([0x04, 0x05, 0x00, 0x03]));
	struct.write({ arr: [7, 8, 0], length: 2 }, opts);
	expect(struct.read(opts)).toStrictEqual({ arr: [7, 8, 0], length: 2 });
	expect(buf).toStrictEqual(new Uint8Array([0x07, 0x08, 0x00, 0x02]));
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
	const opts = { buf };
	const struct = new Struct().field("str", typ.sizedCharArrayAsString(8));
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{ str: string }>();
	expect(struct.proxy(opts)).toEqual({ str: "foo" });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.read(opts)).toStrictEqual({ str: "foo" });
	struct.proxy(opts).str = "bar";
	expect(struct.read(opts)).toStrictEqual({ str: "bar" });
	expect(buf).toStrictEqual(
		new Uint8Array([0x62, 0x61, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00]),
	);
	struct.write({ str: "baz" }, opts);
	expect(struct.read(opts)).toStrictEqual({ str: "baz" });
	expect(buf).toStrictEqual(
		new Uint8Array([0x62, 0x61, 0x7a, 0x00, 0x00, 0x00, 0x00, 0x00]),
	);
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
	const opts = { buf };
	const struct = new Struct().field(
		"str",
		typ.sizedCharArrayAsString(8, false),
	);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{ str: string }>();
	expect(struct.proxy(opts)).toEqual({ str: `foo${"\0".repeat(5)}` });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{ readonly str: string }>();
	expect(struct.read(opts)).toStrictEqual({ str: `foo${"\0".repeat(5)}` });
	struct.proxy(opts).str = "bar";
	expect(struct.read(opts)).toStrictEqual({ str: `bar${"\0".repeat(5)}` });
	expect(buf).toStrictEqual(
		new Uint8Array([0x62, 0x61, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00]),
	);
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
	const opts = { buf };
	const struct = new Struct()
		.field("a", typ.u8)
		.field("inner", new Struct().field("b", typ.u8))
		.field("c", typ.u8);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		a: number;
		inner: { b: number };
		c: number;
	}>();
	expect(struct.proxy(opts)).toEqual({ a: 1, inner: { b: 1 }, c: 255 });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly a: number;
		readonly inner: { readonly b: number };
		readonly c: number;
	}>();
	expect(struct.read(opts)).toStrictEqual({ a: 1, inner: { b: 1 }, c: 255 });
	struct.proxy(opts).inner.b = 2;
	expect(struct.read(opts)).toStrictEqual({ a: 1, inner: { b: 2 }, c: 255 });
	expect(buf).toStrictEqual(new Uint8Array([0x01, 0x02, 0xff]));
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
	const opts = { buf, offset: 5 };
	const struct = new Struct()
		.field("length", typ.u8)
		.field("str", typ.pointerArrayFromLengthField(typ.char, "length"));
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		length: number;
		str: string[];
	}>();
	expect(struct.proxy(opts)).toEqual({
		length: 5,
		str: ["H", "e", "l", "l", "o"],
	});
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly length: number;
		readonly str: string[];
	}>();
	expect(struct.read(opts)).toStrictEqual({
		length: 5,
		str: ["H", "e", "l", "l", "o"],
	});
	expect(() => {
		struct.proxy(opts).str = ["W", "o", "r", "l", "d"];
	}).toThrowError("'set' on proxy: trap returned falsish for property 'str'");
	struct.proxy(opts).length = 4;
	expect(struct.read(opts)).toStrictEqual({
		length: 4,
		str: ["H", "e", "l", "l"],
	});
	expect(buf).toStrictEqual(
		// biome-ignore format: binary readability
		new Uint8Array([
			0x48, 0x65, 0x6c, 0x6c, 0x6f, // "Hello"
			0x04, // length
			0x00, 0x00, 0x00, 0x00, // str*
		]),
	);
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
	const opts = { buf };
	const struct = new Struct().field(
		"lang",
		typ.enumLike(typ.u8, { 0: "English", 1: "Japanese" } as const),
	);
	expectTypeOf(struct.proxy(opts)).toEqualTypeOf<{
		lang: "English" | "Japanese";
	}>();
	expect(struct.proxy(opts)).toEqual({ lang: "Japanese" });
	expectTypeOf(struct.read(opts)).toEqualTypeOf<{
		readonly lang: "English" | "Japanese";
	}>();
	expect(struct.read(opts)).toStrictEqual({ lang: "Japanese" });
	struct.proxy(opts).lang = "English";
	expect(struct.read(opts)).toStrictEqual({ lang: "English" });
	expect(buf).toStrictEqual(new Uint8Array([0x00]));
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
		a: number;
		unused: never;
		b: number;
	}>();
	expect(struct.proxy({ buf })).toEqual({ a: 1, b: 2 });
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly a: number;
		readonly unused: never;
		readonly b: number;
	}>();
	expect(struct.read({ buf })).toStrictEqual({ a: 1, b: 2, unused: undefined });
});
it("custom builder", () => {
	const float = (value: number) =>
		new Uint8Array(new Float32Array([value]).buffer);
	/**
	 * ```c
	 * struct {
	 *   float pos[3];
	 *   float rot[3];
	 * } buf = { { 1.0, 2.0, 3.0 }, { 4.0, 5.0, 6.0 } };
	 */
	const buf = new Uint8Array([
		...float(1.0),
		...float(2.0),
		...float(3.0),
		...float(4.0),
		...float(5.0),
		...float(6.0),
	]);
	const xyz = typ.defineBuilder<{ x: number; y: number; z: number }>({
		size: 12,
		read: (opts, ctx) => {
			const offset = opts.offset ?? 0;
			const x = typ.f32.read({ ...opts, offset }, ctx);
			const y = typ.f32.read({ ...opts, offset: offset + 4 }, ctx);
			const z = typ.f32.read({ ...opts, offset: offset + 8 }, ctx);
			return { x, y, z };
		},
	});
	const struct = new Struct().field("pos", xyz).field("rot", xyz);
	expectTypeOf(struct.proxy({ buf })).toEqualTypeOf<{
		pos: { x: number; y: number; z: number };
		rot: { x: number; y: number; z: number };
	}>();
	expect(struct.proxy({ buf })).toEqual({
		pos: { x: 1, y: 2, z: 3 },
		rot: { x: 4, y: 5, z: 6 },
	});
	expectTypeOf(struct.read({ buf })).toEqualTypeOf<{
		readonly pos: Readonly<{ x: number; y: number; z: number }>;
		readonly rot: Readonly<{ x: number; y: number; z: number }>;
	}>();
	expect(struct.read({ buf })).toStrictEqual({
		pos: { x: 1, y: 2, z: 3 },
		rot: { x: 4, y: 5, z: 6 },
	});
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
