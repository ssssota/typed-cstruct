import type {
	ProxyValueBuilder,
	ReadonlyValueBuilder,
	ValueBuilder,
	ValueBuilderOptions,
	WritableValueBuilder,
} from "../types.js";
import { readU32 } from "../utils.js";

export function sizedArray<T>(
	builder: ReadonlyValueBuilder<T>,
	size: number,
): ReadonlyValueBuilder<T[]>;
export function sizedArray<T>(
	builder: WritableValueBuilder<T>,
	size: number,
): ProxyValueBuilder<T[]>;
export function sizedArray<T>(
	builder: ProxyValueBuilder<T>,
	size: number,
): ProxyValueBuilder<T[]>;
export function sizedArray<T>(
	builder: ValueBuilder<T>,
	size: number,
): ValueBuilder<T[]> {
	const proxy = (
		opts: ValueBuilderOptions,
		_: Record<string, unknown>,
		useProxy = true,
	) => {
		return new Proxy<T[]>(Array.from({ length: size }), {
			get(target, prop) {
				const defaultValue = Reflect.get(target, prop);
				if (defaultValue !== undefined || typeof prop === "symbol")
					return defaultValue;
				const index = Number(prop);
				if (index < 0 || size <= index) return undefined;
				const { offset = 0 } = opts;
				if (useProxy && typeof builder.proxy === "function") {
					return builder.proxy(
						{ ...opts, offset: offset + index * builder.size },
						{},
					);
				}
				return builder.read(
					{ ...opts, offset: offset + index * builder.size },
					{},
				);
			},
			set(_, prop, value) {
				if (typeof prop === "symbol") return false;
				const index = Number(prop);
				if (!Number.isFinite(index)) return false;
				const { offset = 0 } = opts;
				if (typeof builder.write !== "function") return false;
				builder.write?.(
					value,
					{ ...opts, offset: offset + index * builder.size },
					{},
				);
				return true;
			},
		});
	};
	return {
		size: size * builder.size,
		proxy,
		read(opts, ctx) {
			return proxy(opts, ctx, false).slice();
		},
		write(value, opts, ctx) {
			if (typeof builder.write !== "function") return;
			const { offset = 0 } = opts;
			for (let i = 0; i < size; i++) {
				builder.write(
					value[i],
					{ ...opts, offset: offset + i * builder.size },
					ctx,
				);
			}
		},
	};
}
export function pointerArrayFromLengthField<T, FieldName extends string>(
	builder: ValueBuilder<T>,
	fieldName: FieldName,
): ReadonlyValueBuilder<T[], { [K in FieldName]: number }> {
	return {
		size: 4,
		read(opts, ctx) {
			const ptr = readU32(opts);
			const size = ctx[fieldName];
			return Array.from({ length: size }, (_, i) =>
				builder.read({ ...opts, offset: ptr + i * builder.size }, {}),
			);
		},
	};
}
