import type { ValueBuilder, ValueBuilderOptions } from "./types.js";
const little = "little";
export function view(buf: Uint8Array): DataView {
	return new DataView(buf.buffer);
}
export function readU8(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint8(opts.offset || 0);
}
export function writeU8(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setUint8(opts.offset || 0, value);
}
export function readI8(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt8(opts.offset || 0);
}
export function writeI8(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setInt8(opts.offset || 0, value);
}
export function readU16(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint16(opts.offset || 0, opts.endian === little);
}
export function writeU16(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setUint16(opts.offset || 0, value, opts.endian === little);
}
export function readI16(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt16(opts.offset || 0, opts.endian === little);
}
export function writeI16(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setInt16(opts.offset || 0, value, opts.endian === little);
}
export function readU32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getUint32(opts.offset || 0, opts.endian === little);
}
export function writeU32(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setUint32(opts.offset || 0, value, opts.endian === little);
}
export function readI32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getInt32(opts.offset || 0, opts.endian === little);
}
export function writeI32(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setInt32(opts.offset || 0, value, opts.endian === little);
}
export function readU64(opts: ValueBuilderOptions): bigint {
	return view(opts.buf).getBigUint64(opts.offset || 0, opts.endian === little);
}
export function writeU64(value: bigint, opts: ValueBuilderOptions): void {
	view(opts.buf).setBigUint64(opts.offset || 0, value, opts.endian === little);
}
export function readI64(opts: ValueBuilderOptions): bigint {
	return view(opts.buf).getBigInt64(opts.offset || 0, opts.endian === little);
}
export function writeI64(value: bigint, opts: ValueBuilderOptions): void {
	view(opts.buf).setBigInt64(opts.offset || 0, value, opts.endian === little);
}
export function readF32(opts: ValueBuilderOptions): number {
	return view(opts.buf).getFloat32(opts.offset || 0, opts.endian === little);
}
export function writeF32(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setFloat32(opts.offset || 0, value, opts.endian === little);
}
export function readF64(opts: ValueBuilderOptions): number {
	return view(opts.buf).getFloat64(opts.offset || 0, opts.endian === little);
}
export function writeF64(value: number, opts: ValueBuilderOptions): void {
	view(opts.buf).setFloat64(opts.offset || 0, value, opts.endian === little);
}
export function readBool(opts: ValueBuilderOptions): boolean {
	return !!readU8(opts);
}
export function writeBool(value: boolean, opts: ValueBuilderOptions): void {
	writeU8(value ? 1 : 0, opts);
}
export function readChar(opts: ValueBuilderOptions): string {
	return String.fromCharCode(readU8(opts));
}
export function writeChar(value: string, opts: ValueBuilderOptions): void {
	writeU8(value.charCodeAt(0), opts);
}
