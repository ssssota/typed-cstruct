/**
 * from
 * packages/generator/generator.XXX.node
 * to
 * packages/generator/npm/XXX/generator.*.node
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatorRoot = path.resolve(__dirname, "..");
const npmDir = path.join(generatorRoot, "npm");

const binaries = fs
	.readdirSync(generatorRoot, { withFileTypes: true })
	.filter((dirent) => dirent.isFile())
	.map((dirent) => dirent.name)
	.filter((name) => name.endsWith(".node"));
for (const binary of binaries) {
	const [, target] = binary.match(/\.([^.]+)\.node$/);
	const targetDir = path.join(npmDir, target);
	fs.renameSync(binary, path.join(targetDir, binary));
}
