import type { ValueBuilder } from "./types.js";

export function alignment(builder: ValueBuilder): number {
	return builder.alignment ?? builder.size;
}
