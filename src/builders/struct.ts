import type {
	Field,
	ObjFromFields,
	Prettify,
	RecursiveReadonly,
	ValueBuilder,
	ValueBuilderOptions,
} from "../types.js";

export class Struct<Fields extends Field[] = []> implements ValueBuilder {
	private fields: Field[] = [];
	get size(): number {
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

	private _proxy(
		opts: ValueBuilderOptions,
		useProxy = false,
	): Prettify<ObjFromFields<Fields>> {
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
					if (useProxy && typeof field.builder.proxy === "function") {
						return field.builder.proxy(
							{ buf, offset: offset + fieldOffset, endian },
							ret,
						);
					}
					return field.builder.read(
						{ buf, offset: offset + fieldOffset, endian },
						ret,
					);
				},
				set(_, prop, value) {
					if (typeof prop !== "string") return false;
					const fieldIndex = self.fields.findIndex((f) => f.name === prop);
					if (fieldIndex === -1) return false;
					const fieldOffset = self.fields
						.slice(0, fieldIndex)
						.reduce((acc, f) => acc + f.builder.size, 0);
					const field = self.fields[fieldIndex];
					if (typeof field.builder.write !== "function") return false;
					field.builder.write(
						value,
						{ buf, offset: offset + fieldOffset, endian },
						ret,
					);
					return true;
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

	proxy(opts: ValueBuilderOptions): Prettify<ObjFromFields<Fields>> {
		return this._proxy(opts, true);
	}

	read(
		opts: ValueBuilderOptions,
	): RecursiveReadonly<Prettify<ObjFromFields<Fields>>> {
		const proxy = this._proxy(opts);
		const ret = Object.fromEntries(Object.entries(proxy)) as Prettify<
			ObjFromFields<Fields>
		>;
		return ret;
	}

	write(
		value: Prettify<ObjFromFields<Fields>>,
		opts: ValueBuilderOptions,
	): void {
		const proxy = this._proxy(opts);
		for (const key of this.fields.map((f) => f.name)) {
			// @ts-expect-error
			proxy[key] = value[key];
		}
	}
}
