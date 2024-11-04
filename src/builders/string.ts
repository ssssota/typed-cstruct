import type { ValueBuilder, ValueBuilderOptions } from "../types.js";
import { readU32 } from "../utils.js";

export const charPointerAsString: ValueBuilder<string> = {
	size: 4,
	read(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		const ptr = readU32(buf, offset, endian);
		const zeorIndex = buf.indexOf(0, ptr);
		return new TextDecoder().decode(buf.slice(ptr, zeorIndex));
	},
} as const;

export const sizedCharArrayAsString = (
	size: number,
	nullTermination = true,
): ValueBuilder<string> => {
	return {
		size,
		read(opts: ValueBuilderOptions) {
			const { buf, offset = 0 } = opts;
			const end = nullTermination ? buf.indexOf(0, offset) : offset + size;
			return new TextDecoder().decode(buf.slice(offset, end));
		},
	} as const;
};
