import type {
	ReadonlyValueBuilder,
	ValueBuilderOptions,
	WritableValueBuilder,
} from "../types.js";
import {
	readBool,
	readChar,
	readF32,
	readF64,
	readI8,
	readI16,
	readI32,
	readI64,
	readI128,
	readU8,
	readU16,
	readU32,
	readU64,
	readU128,
	writeBool,
	writeChar,
	writeF32,
	writeF64,
	writeI8,
	writeI16,
	writeI32,
	writeI64,
	writeI128,
	writeU8,
	writeU16,
	writeU32,
	writeU64,
	writeU128,
} from "../utils.js";

export const u8: WritableValueBuilder<number> = {
	size: 1,
	read: readU8,
	write: writeU8,
};
export const i8: WritableValueBuilder<number> = {
	size: 1,
	read: readI8,
	write: writeI8,
};
export const u16: WritableValueBuilder<number> = {
	size: 2,
	read: readU16,
	write: writeU16,
};
export const i16: WritableValueBuilder<number> = {
	size: 2,
	read: readI16,
	write: writeI16,
};
export const u32: WritableValueBuilder<number> = {
	size: 4,
	read: readU32,
	write: writeU32,
};
export const i32: WritableValueBuilder<number> = {
	size: 4,
	read: readI32,
	write: writeI32,
};
export const u64: WritableValueBuilder<bigint> = {
	size: 8,
	read: readU64,
	write: writeU64,
};
export const i64: WritableValueBuilder<bigint> = {
	size: 8,
	read: readI64,
	write: writeI64,
};
export const u128: WritableValueBuilder<bigint> = {
	size: 16,
	read: readU128,
	write: writeU128,
};
export const i128: WritableValueBuilder<bigint> = {
	size: 16,
	read: readI128,
	write: writeI128,
};
export const f32: WritableValueBuilder<number> = {
	size: 4,
	read: readF32,
	write: writeF32,
};
export const f64: WritableValueBuilder<number> = {
	size: 8,
	read: readF64,
	write: writeF64,
};
export const bool: WritableValueBuilder<boolean> = {
	size: 1,
	read: readBool,
	write: writeBool,
};
export const char: WritableValueBuilder<string> = {
	size: 1,
	read: readChar,
	write: writeChar,
};
export function enumLike<
	T extends number,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
	Variants extends Record<string, T> = Record<string, T>,
>(
	realType: WritableValueBuilder<T, Ctx> | ReadonlyValueBuilder<T, Ctx>,
	variants: Variants,
): WritableValueBuilder<keyof Variants, Ctx> {
	return {
		size: realType.size,
		read(opts: ValueBuilderOptions, ctx: Ctx) {
			const value = realType.read(opts, ctx);
			const variant = Object.entries(variants).find(
				([_, v]) => v === value,
			)?.[0];
			if (variant === undefined) {
				throw new Error(`Unknown enum value: ${value}`);
			}
			return variant;
		},
		write(value: keyof Variants, opts: ValueBuilderOptions, ctx: Ctx) {
			const variant = variants[value];
			if (variant === undefined) {
				throw new Error(`Unknown enum variant: ${String(value)}`);
			}
			return realType.write?.(variant, opts, ctx);
		},
	};
}
