import type {
	ProxyValueBuilder,
	ReadonlyValueBuilder,
	ValueBuilder,
	WritableValueBuilder,
} from "../types.js";
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
