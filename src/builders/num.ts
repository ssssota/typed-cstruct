import type { ValueBuilder, ValueBuilderOptions } from "../types.js";
import {
	readBool,
	readChar,
	readF32,
	readF64,
	readI8,
	readI16,
	readI32,
	readI64,
	readU8,
	readU16,
	readU32,
	readU64,
} from "../utils.js";

export const u8 = {
	size: 1,
	build(opts: { buf: Uint8Array; offset?: number }) {
		const { buf, offset = 0 } = opts;
		return readU8(buf, offset);
	},
} as const satisfies ValueBuilder<number>;
export const i8 = {
	size: 1,
	build(opts: { buf: Uint8Array; offset?: number }) {
		const { buf, offset = 0 } = opts;
		return readI8(buf, offset);
	},
} as const satisfies ValueBuilder<number>;
export const u16 = {
	size: 2,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readU16(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const i16 = {
	size: 2,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readI16(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const u32 = {
	size: 4,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readU32(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const i32 = {
	size: 4,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readI32(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const u64 = {
	size: 8,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readU64(buf, offset, endian);
	},
} as const satisfies ValueBuilder<bigint>;
export const i64 = {
	size: 8,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readI64(buf, offset, endian);
	},
} as const satisfies ValueBuilder<bigint>;
export const f32 = {
	size: 4,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readF32(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const f64 = {
	size: 8,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		return readF64(buf, offset, endian);
	},
} as const satisfies ValueBuilder<number>;
export const bool = {
	size: 1,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0 } = opts;
		return readBool(buf, offset);
	},
} as const satisfies ValueBuilder<boolean>;
export const char = {
	size: 1,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0 } = opts;
		return readChar(buf, offset);
	},
} as const satisfies ValueBuilder<string>;
