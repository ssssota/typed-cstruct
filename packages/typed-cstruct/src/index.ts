import { StructBase } from "./builders/struct.js";
export class Struct extends StructBase<[]> {
	constructor() {
		super([]);
	}
}
export * from "./types.js";
export * from "./builders/index.js";
export * from "./utils.js";
