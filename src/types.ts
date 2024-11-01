export type Num = "u8" | "u16" | "u32" | "i8" | "i16" | "i32" | "f32" | "f64";
export type BigIntNum = "u64" | "i64";
export type Typ = Num | BigIntNum | "bool" | "char";
export type Field<T extends ValueBuilder = ValueBuilder> = {
	name: string;
	builder: T;
};
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type BlankObject = NonNullable<unknown>;
export type ObjFromFields<Fields extends Field[]> = Fields extends [
	{ name: infer Name; builder: infer Builder },
	...infer Rest,
]
	? Name extends string
		? Builder extends ValueBuilder<infer T>
			? Rest extends Field[]
				? Prettify<{ readonly [K in Name]: T } & ObjFromFields<Rest>>
				: { readonly [K in Name]: T }
			: BlankObject
		: BlankObject
	: BlankObject;

export type ValueBuilderOptions = {
	buf: Uint8Array;
	offset?: number;
	endian?: "little" | "big";
};

export interface ValueBuilder<
	T = unknown,
	Ctx extends Record<string, unknown> = Record<string, unknown>,
> {
	size: number;
	build(opts: ValueBuilderOptions, ctx: Ctx): T;
}
