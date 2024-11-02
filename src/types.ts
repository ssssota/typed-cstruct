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
export type TupleToUnion<T> = T extends (infer U)[] ? U : never;
export type UnionToIntersection<U> =
	// biome-ignore lint/suspicious/noExplicitAny: any is needed to infer the union
	(U extends any ? (arg: U) => void : never) extends (arg: infer I) => void
		? I
		: never;
export type ObjFromFields<Fields extends Field[]> = UnionToIntersection<
	TupleToUnion<{
		[K in keyof Fields]: Fields[K] extends {
			name: infer Name;
			builder: ValueBuilder<infer T>;
		}
			? Name extends string
				? { readonly [P in Name]: T }
				: never
			: never;
	}>
>;

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
