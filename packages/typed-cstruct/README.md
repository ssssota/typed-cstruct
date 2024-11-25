# typed-cstruct

Read and write a binary C struct, Use it as a JavaScript object (Off course, it's fully typed).

## Installation

```sh
npm install typed-cstruct
```

## Usage

### Basic

```javascript
import Struct, * as typ from "typed-cstruct";

// 0. Check the struct definition
// struct {
//   uint8_t a;
//   int16_t b;
//   float c;
// } buf = { 1, 0x0302, 1.0f };
const buf = new Uint8Array([
  0x01, // a
  0x02, 0x03, // b
  0x00, 0x00, 0x80, 0x3f // c
]);

// 1. Define a struct
const struct = new Struct()
  .field("a", typ.u8) // unsigned 8-bit(1-byte) integer
  .field("b", typ.i16) // 16-bit(2-byte) integer
  .field("c", typ.f32); // 32-bit(4-byte) float

// 2a. Read a struct from a buffer
const obj = struct.read({ buf });
console.log(obj); // => { a: 1, b: 770, c: 1 } == { a: 1, b: 0x0302, c: 1.0 }

// 2b. Write a struct to a buffer
const newBuf = new Uint8Array(7);
struct.write({ a: 2, b: 0x0403, c: 2.0 }, { buf: newBuf });
console.log(newBuf); // => Uint8Array [ 2, 4, 3, 0, 0, 0, 64 ]

// 2c. Overwrite a field
struct.proxy({ buf: newBuf }).a = 3;
console.log(newBuf); // => Uint8Array [ 3, 4, 3, 0, 0, 0, 64 ]

// 2d. Get size of a struct
console.log(struct.size); // => 7
```

### Advanced

#### Offset

You can specify the offset to read a struct from a buffer.

```javascript
struct.read({ buf, offset: 1 }); // Skip the first byte
```

#### Endian

You can specify the endian of a struct. (default: `little`)

```javascript
const struct = new Struct({ buf, endian: "big" });
```

#### Array

You can define an array field.

```javascript
// struct {
//   uint8_t a;
//   int16_t b[3];
// } buf = { 1, { 0x0102, 0x0304, 0x0506 } };
const struct = new Struct()
  .field("a", typ.u8)
  .field("b", typ.sizedArray(typ.i16, 3)); // 3 x 16-bit(2-byte) integers
```

#### Nested

You can define a nested struct.

```javascript
// struct {
//   uint8_t a;
//   struct {
//     int16_t b;
//     float c;
//   } d;
// } buf = { 1, { 0x0203, 1.0f } };
const struct = new Struct()
  .field("a", typ.u8)
  .field("d", new Struct()
    .field("b", typ.i16)
    .field("c", typ.f32));
```

#### String

You can define a string field.

```javascript
// struct {
//   uint8_t a;
//   char b[4];
// } buf = { 1, "foo" };
const struct = new Struct()
  .field("a", typ.u8)
  .field("b", typ.sizedCharArrayAsString(4)); // 4-byte string
```

Default encoding is `utf8`.
You can specify the encoding and decoding functions.

```javascript
const encode = (str) => new Uint8Array(str.split("").map((c) => c.charCodeAt(0)));
const decode = (buf) => buf.map((c) => String.fromCharCode(c)).join("");
const struct = new Struct()
  .field("a", typ.u8)
  .field("b", typ.sizedCharArrayAsString(4, { encode, decode })); // 4-byte string
```

#### Enum

You can define an enum field.

```javascript
// struct {
//   uint8_t a;
//   enum {
//     FOO = 1,
//     BAR = 2,
//     BAZ = 3
//   } b;
// } buf = { 1, 2 };
const struct = new Struct()
  .field("a", typ.u8)
  .field("b", typ.enumLike(typ.u8, { 1: 'FOO', 2: 'BAR', 3: 'BAZ' } as const));
const buf = new Uint8Array([0x01, 0x02]);
const obj = struct.read({ buf });
console.log(obj); // => { a: 1, b: 'BAR' }
```

#### Custom

You can define a custom field.

```javascript
// struct {
//   uint8_t a;
//   uint8_t pos[2];
// }
const position = typ.defineBuilder({ // define custom builder
  size: 2,
  read(opts) {
    const offset = opts.offset || 0;
    return { x: typ.u8.read({ ...opts, offset }), y: typ.u8.read({ ...opts, offset: offset + 1 }) };
  },
});
const struct = new Struct()
  .field("a", typ.u8)
  .field("pos", position);
const buf = new Uint8Array([0x01, 0x02, 0x03]);
const obj = struct.read({ buf });
console.log(obj); // => { a: 1, pos: { x: 2, y: 3 } }
```

You can use `convert` function to convert a value (readonly).

```javascript
const struct = new Struct()
  .field("a", typ.u8)
  .field("pos", typ.convert(typ.sizedArray(typ.u8, 2), ([x, y]) => ({ x, y })));
const buf = new Uint8Array([0x01, 0x02, 0x03]);
const obj = struct.read({ buf });
console.log(obj); // => { a: 1, pos: { x: 2, y: 3 } }
```

## License

MIT
