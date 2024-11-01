export function view(buf: Uint8Array) {
	return new DataView(buf.buffer);
}
export function readU8(buf: Uint8Array, offset = 0) {
	return view(buf).getUint8(offset);
}
export function readI8(buf: Uint8Array, offset = 0) {
	return view(buf).getInt8(offset);
}
export function readU16(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getUint16(offset, endian === "little");
}
export function readI16(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getInt16(offset, endian === "little");
}
export function readU32(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getUint32(offset, endian === "little");
}
export function readI32(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getInt32(offset, endian === "little");
}
export function readU64(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getBigUint64(offset, endian === "little");
}
export function readI64(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getBigInt64(offset, endian === "little");
}
export function readF32(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getFloat32(offset, endian === "little");
}
export function readF64(
	buf: Uint8Array,
	offset = 0,
	endian: "little" | "big" = "little",
) {
	return view(buf).getFloat64(offset, endian === "little");
}
export function readBool(buf: Uint8Array, offset = 0) {
	return !!view(buf).getUint8(offset);
}
export function readChar(buf: Uint8Array, offset = 0) {
	return String.fromCharCode(view(buf).getUint8(offset));
}
