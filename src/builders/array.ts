import type { ValueBuilder, ValueBuilderOptions } from "../types.js";
import { readU32 } from "../utils.js";

export function sizedArray<T>(
	builder: ValueBuilder<T>,
	size: number,
): ValueBuilder<T[]> {
	return {
		size: size * builder.size,
		build(opts: ValueBuilderOptions) {
			const { buf, offset = 0 } = opts;
			return Array.from({ length: size }, (_, i) =>
				builder.build({ buf, offset: offset + i * builder.size }, {}),
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
		build(opts: ValueBuilderOptions, ctx) {
			const { buf, offset = 0, endian = "little" } = opts;
			const ptr = readU32(buf, offset, endian);
			const size = ctx[fieldName];
			return Array.from({ length: size }, (_, i) =>
				builder.build({ buf, offset: ptr + i * builder.size }, {}),
			);
		},
	};
}
