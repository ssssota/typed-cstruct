import { Struct as StructInternal } from "./builders/struct.js";
export const Struct: typeof StructInternal<[]> = StructInternal<[]>; // hide the generic type
export default Struct;
export * from "./types.js";
export * from "./builders/index.js";
export * from "./utils.js";
