import { type Field, StructBase } from "./builders/struct.js";
export class Struct<Fields extends Field[] = []> extends StructBase<Fields> {
	constructor() {
		super([] as unknown as Fields);
	}
}
export * from "./builders/index.js";
export * from "./types.js";
export * from "./utils.js";
