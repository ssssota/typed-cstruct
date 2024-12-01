import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

/** @typedef {'typed-cstruct' | '@typed-cstruct/generator'} Package */
/** @typedef {'major' | 'minor' | 'patch'} VersionType */

/** @type {Record<Package, string>} */
const packages = {
	"typed-cstruct": "packages/typed-cstruct/package.json",
	"@typed-cstruct/generator": "packages/generator/package.json",
};

/** @returns {VersionType | undefined} */
function validateVersionType(maybeVersion) {
	if (
		maybeVersion === "major" ||
		maybeVersion === "minor" ||
		maybeVersion === "patch"
	) {
		return maybeVersion;
	}
	return undefined;
}

/** @returns {Package | undefined} */
function validatePackage(maybePackage) {
	if (maybePackage in packages) {
		return maybePackage;
	}
	return undefined;
}

/**
 * @param {Package} packageName
 * @param {VersionType} versionType
 */
function updateVersion(name, versionType) {
	const packagePath = packages[name];
	const packageJson = readFileSync(packagePath, "utf8");
	const updated = packageJson.replace(
		/"version":\s*"(\d+)\.(\d+)\.(\d+)"/,
		(_, major, minor, patch) => {
			switch (versionType) {
				case "major":
					return `"version": "${Number(major) + 1}.0.0"`;
				case "minor":
					return `"version": "${major}.${Number(minor) + 1}.0"`;
				case "patch":
					return `"version": "${major}.${minor}.${Number(patch) + 1}"`;
			}
		},
	);
	writeFileSync(packagePath, updated, "utf8");
}

function main() {
	const { positionals } = parseArgs({ allowPositionals: true });

	const packageName = validatePackage(positionals[0]);
	const versionType = validateVersionType(positionals[1]);

	if (!packageName || !versionType) {
		console.error("pnpm bump <package> <versionType>");
		process.exit(1);
	}

	updateVersion(packageName, versionType);
}

main();
