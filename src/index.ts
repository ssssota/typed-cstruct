import { Struct as StructInternal } from "./builders/struct.js";
export const Struct = StructInternal<[]>; // hide the generic type
export * from "./types.js";
export * from "./builders/index.js";
export * from "./utils.js";
