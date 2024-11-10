import { Struct as StructInternal } from "./builders/struct.js";
export class Struct extends StructInternal<NonNullable<unknown>> {
	constructor() {
		super({});
	}
}
export default Struct;
export * from "./types.js";
export * from "./builders/index.js";
export * from "./utils.js";
