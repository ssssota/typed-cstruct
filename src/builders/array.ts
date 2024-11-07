import type { ValueBuilder, ValueBuilderOptions } from "../types.js";
import { readU32 } from "../utils.js";

export function sizedArray<T>(
	builder: ValueBuilder<T>,
	size: number,
): ValueBuilder<T[]> {
	return {
		size: size * builder.size,
		read(opts: ValueBuilderOptions) {
			const { buf, offset = 0 } = opts;
			return Array.from({ length: size }, (_, i) =>
				builder.read({ buf, offset: offset + i * builder.size }, {}),
			);
		},
	};
}
export function pointerArrayFromLengthField<T, FieldName extends string>(
	builder: ValueBuilder<T>,
	fieldName: FieldName,
): ValueBuilder<T[], { [K in FieldName]: number }> {
	return {
		size: 4,
		read(opts: ValueBuilderOptions, ctx) {
			const ptr = readU32(opts);
			const size = ctx[fieldName];
			return Array.from({ length: size }, (_, i) =>
				builder.read({ buf: opts.buf, offset: ptr + i * builder.size }, {}),
			);
		},
	};
}
