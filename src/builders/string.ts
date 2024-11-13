import type { ReadonlyValueBuilder, WritableValueBuilder } from "../types.js";
import { readU32 } from "../utils.js";

type Decode = (buf: Uint8Array) => string;
const defaultDecode: Decode = (buf) => new TextDecoder().decode(buf);
type Encode = (val: string) => Uint8Array;
const defaultEncode: Encode = (val) => new TextEncoder().encode(val);

export function charPointerAsString(
	decode?: Decode,
): ReadonlyValueBuilder<string> {
	return {
		size: 4,
		read(opts) {
			const ptr = readU32(opts);
			const zeorIndex = opts.buf.indexOf(0, ptr);
			return (decode ?? defaultDecode)(opts.buf.slice(ptr, zeorIndex));
		},
	};
}

export function sizedCharArrayAsString(
	size: number,
	options: { nullTermination?: boolean; decode?: Decode; encode?: Encode } = {},
): WritableValueBuilder<string> {
	const {
		nullTermination = true,
		decode = defaultDecode,
		encode = defaultEncode,
	} = options;
	return {
		size,
		read(opts) {
			const { buf, offset = 0 } = opts;
			const end = nullTermination ? buf.indexOf(0, offset) : offset + size;
			return (decode ?? defaultDecode)(buf.slice(offset, end));
		},
		write(value, opts) {
			const { buf, offset = 0 } = opts;
			const encoded = (encode ?? defaultEncode)(value);
			for (let i = 0; i < size; i++) {
				buf[offset + i] = i < encoded.length ? encoded[i] : 0;
			}
		},
	} as const;
}
