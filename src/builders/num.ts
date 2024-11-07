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

export const u8: ValueBuilder<number> = { size: 1, read: readU8 };
export const i8: ValueBuilder<number> = { size: 1, read: readI8 };
export const u16: ValueBuilder<number> = { size: 2, read: readU16 };
export const i16: ValueBuilder<number> = { size: 2, read: readI16 };
export const u32: ValueBuilder<number> = { size: 4, read: readU32 };
export const i32: ValueBuilder<number> = { size: 4, read: readI32 };
export const u64: ValueBuilder<bigint> = { size: 8, read: readU64 };
export const i64: ValueBuilder<bigint> = { size: 8, read: readI64 };
export const f32: ValueBuilder<number> = { size: 4, read: readF32 };
export const f64: ValueBuilder<number> = { size: 8, read: readF64 };
export const bool: ValueBuilder<boolean> = { size: 1, read: readBool };
export const char: ValueBuilder<string> = { size: 1, read: readChar };
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
