import type {
	Prettify,
	RecursiveReadonly,
	ValueBuilder,
	ValueBuilderOptions,
} from "../types.js";

type Field<Name extends string, T extends ValueBuilder = ValueBuilder> = {
	[Key in Name]: { builder: T; offset: number };
};
type ObjFromFields<Fields extends Field<string>> = {
	[Key in keyof Fields]: Fields[Key] extends { builder: infer T }
		? T extends ValueBuilder<infer U, any>
			? U
			: never
		: never;
};

export class Struct<Fields extends Field<string> = Record<string, never>>
	implements ValueBuilder
{
	#size: number;
	protected constructor(private fields: Fields) {
		this.#size = Object.values(this.fields).reduce(
			(acc, f) => acc + f.builder.size,
			0,
		);
	}

	get size(): number {
		return this.#size;
	}

	field<Name extends string, Builder extends ValueBuilder<any, any>>(
		name: Name,
		builder: Builder,
	): Struct<
		Prettify<
			Omit<Fields, Name> & {
				[Key in Name]: { builder: Builder; offset: number };
			}
		>
	> {
		return new Struct({
			...this.fields,
			[name]: { builder, offset: this.#size },
		});
	}

	#proxy(
		opts: ValueBuilderOptions,
		useProxy = false,
	): Prettify<ObjFromFields<Fields>> {
		const { buf, offset = 0, endian = "little" } = opts;
		const self = this;
		const base = Object.fromEntries(
			Object.keys(self.fields).map((name) => [name, true] as const),
		);
		const ret = new Proxy(base, {
			get(_, prop) {
				if (typeof prop !== "string") return undefined;
				const field = Object.entries(self.fields).find(
					([name]) => name === prop,
				);
				if (!field) return undefined;
				if (useProxy && typeof field[1].builder.proxy === "function") {
					return field[1].builder.proxy(
						{ buf, offset: offset + field[1].offset, endian },
						ret,
					);
				}
				return field[1].builder.read(
					{ buf, offset: offset + field[1].offset, endian },
					ret,
				);
			},
			set(_, prop, value) {
				if (typeof prop !== "string") return false;
				const field = Object.entries(self.fields).find(
					([name]) => name === prop,
				);
				if (!field) return false;
				if (typeof field[1].builder.write !== "function") return false;
				field[1].builder.write(
					value,
					{ buf, offset: offset + field[1].offset, endian },
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
		for (const key of Object.keys(this.fields)) {
			// @ts-expect-error
			proxy[key] = value[key];
		}
	}
}
