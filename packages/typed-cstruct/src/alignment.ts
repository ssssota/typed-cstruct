import type { ValueBuilder } from "./types.js";

export function alignment(builder: ValueBuilder<any, any>): number {
	return builder.alignment ?? builder.size;
}
