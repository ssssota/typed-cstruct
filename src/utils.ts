import type { ValueBuilderOptions } from "./types.js";
const little = "little";
export function view(buf: Uint8Array): DataView {
	return new DataView(buf.buffer);
}
export function readU8(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint8(opts.offset || 0);
}
export function readI8(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt8(opts.offset || 0);
}
export function readU16(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint16(opts.offset || 0, opts.endian === little);
}
export function readI16(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt16(opts.offset || 0, opts.endian === little);
}
export function readU32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint32(opts.offset || 0, opts.endian === little);
}
export function readI32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt32(opts.offset || 0, opts.endian === little);
}
export function readU64(opts: ValueBuilderOptions): bigint {
	return view(opts.buf).getBigUint64(opts.offset || 0, opts.endian === little);
}
export function readI64(opts: ValueBuilderOptions): bigint {
	return view(opts.buf).getBigInt64(opts.offset || 0, opts.endian === little);
}
export function readF32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getFloat32(opts.offset || 0, opts.endian === little);
}
export function readF64(opts: ValueBuilderOptions): number {
	return view(opts.buf).getFloat64(opts.offset || 0, opts.endian === little);
}
export function readBool(opts: ValueBuilderOptions): boolean {
	return !!readU8(opts);
}
export function readChar(opts: ValueBuilderOptions): string {
	return String.fromCharCode(readU8(opts));
}
