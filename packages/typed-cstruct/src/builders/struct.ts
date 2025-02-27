import type {
	Prettify,
	ProxyValueBuilder,
	ReadonlyValueBuilder,
	RecursiveReadonly,
	ValueBuilder,
	ValueBuilderOptions,
	WritableValueBuilder,
} from "../types.js";

export type Field<T extends ValueBuilder = ValueBuilder> = {
	name: string;
	builder: T;
	offset: number;
};
export type TupleToUnion<T> = T extends (infer U)[] ? U : never;
export type UnionToIntersection<U> = (
	U extends any
		? (arg: U) => void
		: never
) extends (arg: infer I) => void
	? I
	: never;
export type ObjFromFields<Fields extends Field[]> = UnionToIntersection<
	TupleToUnion<{
		[K in keyof Fields]: Fields[K] extends {
			name: infer Name;
			builder: infer Builder;
		}
			? Name extends string
				? Builder extends ReadonlyValueBuilder<infer T>
					? RecursiveReadonly<{ [P in Name]: T }>
					: Builder extends WritableValueBuilder<infer T>
						? { [P in Name]: Readonly<T> }
						: Builder extends ProxyValueBuilder<infer T>
							? { [P in Name]: T }
							: never
				: never
			: never;
	}>
>;

export type OverrideField<
	Fields extends Field[],
	Name extends Fields[number]["name"],
	Builder extends ValueBuilder<any, any>,
> = Fields extends [infer First, ...infer Rest]
	? First extends { name: Name }
		? [{ name: Name; builder: Builder; offset: number }, ...Rest]
		: Rest extends Field[]
			? [First, ...OverrideField<Rest, Name, Builder>]
			: never
	: never;

class Struct<Fields extends Field[] = []> implements ProxyValueBuilder {
	#size: number;
	protected constructor(private fields: Fields) {
		this.#size = this.fields.reduce((acc, f) => acc + f.builder.size, 0);
	}

	get size(): number {
		return this.#size;
	}

	field<Name extends string, Builder extends ValueBuilder<any, any>>(
		name: Name,
		builder: Builder,
	): Struct<[...Fields, { name: Name; builder: Builder; offset: number }]> {
		return new Struct([...this.fields, { name, builder, offset: this.#size }]);
	}
	override<
		Name extends Fields[number]["name"],
		Builder extends ValueBuilder<any, any>,
	>(
		name: Name,
		builder: Builder,
	): Struct<OverrideField<Fields, Name, Builder>> {
		const fields = this.fields.reduce<Field[]>((acc, f) => {
			const prev = acc.at(-1);
			const offset = prev ? prev.offset + prev.builder.size : 0;
			acc.push(f.name === name ? { name, builder, offset } : { ...f, offset });
			return acc;
		}, []);
		return new Struct(fields as OverrideField<Fields, Name, Builder>);
	}

	#proxy(
		opts: ValueBuilderOptions,
		useProxy = false,
	): Prettify<ObjFromFields<Fields>> {
		const { buf, offset = 0, endian = "little" } = opts;
		const self = this;
		const base = Object.fromEntries(
			self.fields.map((f) => [f.name, true] as const),
		);
		const ret = new Proxy(base, {
			get(_, prop) {
				if (typeof prop !== "string") return undefined;
				const field = self.fields.find((f) => f.name === prop);
				if (!field) return undefined;
				if (useProxy && typeof field.builder.proxy === "function") {
					return field.builder.proxy(
						{ buf, offset: offset + field.offset, endian },
						ret,
					);
				}
				return field.builder.read(
					{ buf, offset: offset + field.offset, endian },
					ret,
				);
			},
			set(_, prop, value) {
				if (typeof prop !== "string") return false;
				const field = self.fields.find((f) => f.name === prop);
				if (!field) return false;
				if (typeof field.builder.write !== "function") return false;
				field.builder.write(
					value,
					{ buf, offset: offset + field.offset, endian },
					ret,
				);
				return true;
			},
		}) as Prettify<ObjFromFields<Fields>>;
		return ret;
	}

	proxy(opts: ValueBuilderOptions): Prettify<ObjFromFields<Fields>> {
		return this.#proxy(opts, true);
	}

	read(
		opts: ValueBuilderOptions,
	): RecursiveReadonly<Prettify<ObjFromFields<Fields>>> {
		const proxy = this.#proxy(opts);
		const ret = Object.fromEntries(Object.entries(proxy)) as Prettify<
			ObjFromFields<Fields>
		>;
		return ret;
	}

	write(
		value: Prettify<ObjFromFields<Fields>>,
		opts: ValueBuilderOptions,
	): void {
		const proxy = this.#proxy(opts);
		for (const key of this.fields.map((f) => f.name)) {
			// @ts-expect-error
			proxy[key] = value[key];
		}
	}
}
export { Struct as StructBase };
