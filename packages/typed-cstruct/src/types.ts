export type Num = "u8" | "u16" | "u32" | "i8" | "i16" | "i32" | "f32" | "f64";
export type BigIntNum = "u64" | "i64";
export type Typ = Num | BigIntNum | "bool" | "char";
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type RecursiveReadonly<T extends Record<PropertyKey, unknown>> = {
	readonly [K in keyof T]: T[K] extends Record<PropertyKey, unknown>
		? RecursiveReadonly<T[K]>
		: T[K];
};
export type Endian = "little" | "big";
export type ValueBuilderOptions = {
	buf: Uint8Array;
	offset?: number;
	endian?: "little" | "big";
};

export interface ValueBuilder<
	T = unknown,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
> {
	readonly size: number;
	readonly alignment?: number;
	proxy?(opts: ValueBuilderOptions, ctx: Ctx): T;
	read(opts: ValueBuilderOptions, ctx: Ctx): NoInfer<T>;
	write?(value: T, opts: ValueBuilderOptions, ctx: Ctx): void;
}
export type ReadonlyValueBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
> = {
	readonly size: number;
	readonly alignment?: number;
	proxy?: undefined;
	read(opts: ValueBuilderOptions, ctx: Ctx): T;
	write?: undefined;
};
export type WritableValueBuilder<
	T,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
> = {
	readonly size: number;
	readonly alignment?: number;
	proxy?: undefined;
	read(opts: ValueBuilderOptions, ctx: Ctx): T;
	write(value: T, opts: ValueBuilderOptions, ctx: Ctx): void;
};
export type ProxyValueBuilder<
	T = unknown,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
> = {
	readonly size: number;
	readonly alignment?: number;
	proxy(opts: ValueBuilderOptions, ctx: Ctx): T;
	read(opts: ValueBuilderOptions, ctx: Ctx): NoInfer<T>;
	write(value: T, opts: ValueBuilderOptions, ctx: Ctx): void;
};
