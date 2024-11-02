# typed-cstruct

Read a binary C struct, Use it as a JavaScript object.

## Usage

```javascript
import Struct, * as typ from "typed-cstruct";

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
  .build({ buf, offset: 6 });
console.log(struct.a); // 1
console.log(struct.b); // "a"
console.log(struct.c); // 0.5
console.log(struct.d); // "hello"
console.log(struct.buf_size); // 5
console.log(struct.buf); // ["w", "o", "r", "l", "d"]
```

## Installation

```sh
npm install typed-cstruct
```

## License

MIT
