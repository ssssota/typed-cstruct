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

export const u8: ValueBuilder<number> = {
	size: 1,
	read(opts: ValueBuilderOptions) {
		return readU8(opts);
	},
} as const;
export const i8: ValueBuilder<number> = {
	size: 1,
	read(opts: ValueBuilderOptions) {
		return readI8(opts);
	},
} as const;
export const u16: ValueBuilder<number> = {
	size: 2,
	read(opts: ValueBuilderOptions) {
		return readU16(opts);
	},
} as const;
export const i16: ValueBuilder<number> = {
	size: 2,
	read(opts: ValueBuilderOptions) {
		return readI16(opts);
	},
} as const;
export const u32: ValueBuilder<number> = {
	size: 4,
	read(opts: ValueBuilderOptions) {
		return readU32(opts);
	},
} as const;
export const i32: ValueBuilder<number> = {
	size: 4,
	read(opts: ValueBuilderOptions) {
		return readI32(opts);
	},
} as const;
export const u64: ValueBuilder<bigint> = {
	size: 8,
	read(opts: ValueBuilderOptions) {
		return readU64(opts);
	},
} as const;
export const i64: ValueBuilder<bigint> = {
	size: 8,
	read(opts: ValueBuilderOptions) {
		return readI64(opts);
	},
} as const;
export const f32: ValueBuilder<number> = {
	size: 4,
	read(opts: ValueBuilderOptions) {
		return readF32(opts);
	},
} as const;
export const f64: ValueBuilder<number> = {
	size: 8,
	read(opts: ValueBuilderOptions) {
		return readF64(opts);
	},
} as const;
export const bool: ValueBuilder<boolean> = {
	size: 1,
	read(opts: ValueBuilderOptions) {
		return readBool(opts);
	},
} as const;
export const char: ValueBuilder<string> = {
	size: 1,
	read(opts: ValueBuilderOptions) {
		return readChar(opts);
	},
} as const;
export function enumLike<
	T extends number,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
	Variants extends Record<T, string> = Record<T, string>,
>(
	realType: ValueBuilder<T, Ctx>,
	variants: Variants,
): ValueBuilder<Variants[keyof Variants], Ctx> {
	return {
		size: realType.size,
		read(opts: ValueBuilderOptions, ctx: Ctx) {
			const t = realType.read(opts, ctx);
			const entry = Object.entries(variants).find(([k]) => k === t.toString());
			if (entry) return entry[1] as Variants[keyof Variants];
			throw new Error(`Unknown enum value: ${t}`);
		},
	};
}
