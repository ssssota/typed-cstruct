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
	writeBool,
	writeChar,
	writeF32,
	writeF64,
	writeI8,
	writeI16,
	writeI32,
	writeI64,
	writeU8,
	writeU16,
	writeU32,
	writeU64,
} from "../utils.js";

export const u8: ValueBuilder<number> = {
	size: 1,
	read: readU8,
	write: writeU8,
};
export const i8: ValueBuilder<number> = {
	size: 1,
	read: readI8,
	write: writeI8,
};
export const u16: ValueBuilder<number> = {
	size: 2,
	read: readU16,
	write: writeU16,
};
export const i16: ValueBuilder<number> = {
	size: 2,
	read: readI16,
	write: writeI16,
};
export const u32: ValueBuilder<number> = {
	size: 4,
	read: readU32,
	write: writeU32,
};
export const i32: ValueBuilder<number> = {
	size: 4,
	read: readI32,
	write: writeI32,
};
export const u64: ValueBuilder<bigint> = {
	size: 8,
	read: readU64,
	write: writeU64,
};
export const i64: ValueBuilder<bigint> = {
	size: 8,
	read: readI64,
	write: writeI64,
};
export const f32: ValueBuilder<number> = {
	size: 4,
	read: readF32,
	write: writeF32,
};
export const f64: ValueBuilder<number> = {
	size: 8,
	read: readF64,
	write: writeF64,
};
export const bool: ValueBuilder<boolean> = {
	size: 1,
	read: readBool,
	write: writeBool,
};
export const char: ValueBuilder<string> = {
	size: 1,
	read: readChar,
	write: writeChar,
};
export function enumLike<
	T extends number,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
	Variants extends Record<`${T}`, string> = Record<`${T}`, string>,
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
		write(
			value: Variants[keyof Variants],
			opts: ValueBuilderOptions,
			ctx: Ctx,
		) {
			const entry = Object.entries(variants).find(([_, v]) => v === value);
			if (entry) return realType.write?.(Number(entry[0]) as T, opts, ctx);
			throw new Error(`Unknown enum value: ${value}`);
		},
	};
}

export function skip(size: number): ValueBuilder<never> {
	return {
		size,
		read() {
			return undefined as never;
		},
		write() {},
	};
}
