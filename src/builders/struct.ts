import type {
	Field,
	ObjFromFields,
	Prettify,
	ValueBuilder,
	ValueBuilderOptions,
} from "../types.js";

export class Struct<Fields extends Field[] = []> implements ValueBuilder {
	private fields: Field[] = [];
	get size() {
		return this.fields.reduce((acc, f) => acc + f.builder.size, 0);
	}

	field<Name extends string, T>(
		name: Name,
		builder: ValueBuilder<T, ObjFromFields<Fields> & Record<string, unknown>>,
	): Struct<
		[
			...Fields,
			{
				name: Name;
				builder: ValueBuilder<
					T,
					ObjFromFields<Fields> & Record<string, unknown>
				>;
			},
		]
	> {
		this.fields.push({ name, builder });
		// @ts-expect-error
		return this;
	}

	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		const self = this;
		const ret = new Proxy(
			{},
			{
				getOwnPropertyDescriptor(_, p) {
					const value = Reflect.get(ret, p);
					if (value === undefined) return undefined;
					return { value, enumerable: true, configurable: true };
				},
				get(_, prop) {
					if (typeof prop !== "string") return undefined;
					const fieldIndex = self.fields.findIndex((f) => f.name === prop);
					if (fieldIndex === -1) return undefined;
					const fieldOffset = self.fields
						.slice(0, fieldIndex)
						.reduce((acc, f) => acc + f.builder.size, 0);
					const field = self.fields[fieldIndex];
					return field.builder.build(
						{ buf, offset: offset + fieldOffset, endian },
						ret,
					);
				},
				ownKeys() {
					return self.fields.map((f) => f.name);
				},
				has(_, prop) {
					return self.fields.some((f) => f.name === prop);
				},
			},
		) as Prettify<ObjFromFields<Fields>>;
		return ret;
	}
}
