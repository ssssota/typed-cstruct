import type {
	ProxyValueBuilder,
	ReadonlyValueBuilder,
	ValueBuilder,
	ValueBuilderOptions,
	WritableValueBuilder,
} from "../types.js";
import { readU32 } from "../utils.js";
export function defineBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
>(builder: ReadonlyValueBuilder<T, Ctx>): ReadonlyValueBuilder<T, Ctx>;
export function defineBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
>(builder: WritableValueBuilder<T, Ctx>): WritableValueBuilder<T, Ctx>;
export function defineBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
>(builder: ProxyValueBuilder<T, Ctx>): ProxyValueBuilder<T, Ctx>;
export function defineBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
>(builder: ValueBuilder<T, Ctx>): ValueBuilder<T, Ctx> {
	return builder;
}

export function skip(size: number): ReadonlyValueBuilder<never> {
	return {
		size,
		read() {
			return undefined as never;
		},
	};
}

export function convert<T, U>(
	builder: ValueBuilder<T>,
	convert: (value: T) => U,
): ReadonlyValueBuilder<U> {
	return {
		size: builder.size,
		read(opts, ctx) {
			return convert(builder.read(opts, ctx));
		},
	};
}

export function ptr<T>(
	builder: ReadonlyValueBuilder<T>,
): ReadonlyValueBuilder<T | null>;
export function ptr<T>(
	builder: WritableValueBuilder<T>,
): WritableValueBuilder<T | null>;
export function ptr<T>(
	builder: ProxyValueBuilder<T>,
): ProxyValueBuilder<T | null>;
export function ptr<T>(builder: ValueBuilder<T>): ValueBuilder<T | null> {
	const read = (opts: ValueBuilderOptions) => {
		const p = readU32(opts);
		if (p === 0) return null;
		return builder.read({ ...opts, offset: p }, {});
	};
	const write = builder.write
		? (value: T, opts: ValueBuilderOptions) => {
				if (value === null) throw new Error("Cannot write null pointer");
				const p = readU32(opts);
				if (p === 0) throw new Error("Cannot write to null pointer");
				builder.write?.(value, { ...opts, offset: p }, {});
			}
		: undefined;
	const proxy = builder.proxy
		? (opts: ValueBuilderOptions) => {
				const p = readU32(opts);
				if (p === 0) return null;
				return builder.proxy?.({ ...opts, offset: p }, {}) ?? null;
			}
		: undefined;

	return { size: 4, read, write, proxy };
}

export function padding(size: number): ReadonlyValueBuilder<undefined> {
	return { size, alignment: 1, read: () => undefined };
}
