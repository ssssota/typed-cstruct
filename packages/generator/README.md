# @typed-cstruct/generator

This package generates TypeScript source code from C header files.

## Usage

### Installation

```sh
npm install -D @typed-cstruct/generator
```

### CLI

```sh
tcgen -h header.h -h another.h --clang-args="--sysroot=/usr/include" generated.ts
```

### API

```ts
import { generate } from '@typed-cstruct/generator';
const source = generate(
  ['header.h', 'another.h'], // header files
  false, // Dump Rust code to stdout, if true
  ['--sysroot=/usr/include'] // clang args
);
```

## License

MIT

This package depends on the rust-bindgen package, which is licensed under the BSD-3-Clause license.
