import type { ReadonlyValueBuilder, WritableValueBuilder } from "../types.js";
import { readU32 } from "../utils.js";

export const charPointerAsString: ReadonlyValueBuilder<string> = {
	size: 4,
	read(opts) {
		const ptr = readU32(opts);
		const zeorIndex = opts.buf.indexOf(0, ptr);
		return new TextDecoder().decode(opts.buf.slice(ptr, zeorIndex));
	},
} as const;

export function sizedCharArrayAsString(
	size: number,
	nullTermination = true,
	decoder: TextDecoder = new TextDecoder(),
	encoder: TextEncoder = new TextEncoder(),
): WritableValueBuilder<string> {
	return {
		size,
		read(opts) {
			const { buf, offset = 0 } = opts;
			const end = nullTermination ? buf.indexOf(0, offset) : offset + size;
			return decoder.decode(buf.slice(offset, end));
		},
		write(value, opts) {
			const { buf, offset = 0 } = opts;
			const encoded = encoder.encode(value);
			for (let i = 0; i < size; i++) {
				buf[offset + i] = i < encoded.length ? encoded[i] : 0;
			}
		},
	} as const;
}
