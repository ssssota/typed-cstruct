import type { ValueBuilder, ValueBuilderOptions } from "../types.js";
import { readU32 } from "../utils.js";

export const charPointerAsString = {
	size: 4,
	build(opts: ValueBuilderOptions) {
		const { buf, offset = 0, endian = "little" } = opts;
		const ptr = readU32(buf, offset, endian);
		const zeorIndex = buf.indexOf(0, ptr);
		return new TextDecoder().decode(buf.slice(ptr, zeorIndex));
	},
} as const satisfies ValueBuilder<string>;
