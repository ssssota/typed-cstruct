import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

/** @typedef {'typed-cstruct' | '@typed-cstruct/generator'} Package */
/** @typedef {'major' | 'minor' | 'patch'} VersionType */

/** @type {Record<Package, string>} */
const packages = {
	"typed-cstruct": "packages/typed-cstruct/package.json",
	"@typed-cstruct/generator": "packages/generator/package.json",
};
/** @type {Record<Package, string>} */
const tagPrefix = {
	"typed-cstruct": "",
	"@typed-cstruct/generator": "@typed-cstruct/generator",
};

main();
function main() {
	const { positionals } = parseArgs({ allowPositionals: true });

	const packageName = validatePackage(positionals[0]);
	const versionType = validateVersionType(positionals[1]);

	if (!packageName || !versionType) {
		console.error("pnpm bump <package> <versionType>");
		process.exit(1);
	}
	if (dirty()) {
		console.error("Working directory is dirty");
		process.exit(1);
	}

	const version = updateVersion(packageName, versionType);
	commit(packageName, version);
}

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
 * @returns {string} new version
 */
function updateVersion(name, versionType) {
	const packagePath = packages[name];
	const packageJson = readFileSync(packagePath, "utf8");
	let newVersion;
	const updated = packageJson.replace(
		/"version":\s*"(\d+)\.(\d+)\.(\d+)"/,
		(_, major, minor, patch) => {
			switch (versionType) {
				case "major":
					newVersion = `"version": "${Number(major) + 1}.0.0"`;
					break;
				case "minor":
					newVersion = `"version": "${major}.${Number(minor) + 1}.0"`;
					break;
				case "patch":
					newVersion = `"version": "${major}.${minor}.${Number(patch) + 1}"`;
					break;
			}
			return newVersion;
		},
	);
	if (!newVersion) {
		throw new Error("Version not found in package.json");
	}
	writeFileSync(packagePath, updated, "utf8");
	return newVersion;
}

function dirty() {
	const out = execFileSync("git", ["status", "--short"]);
	return out.toString().trim().length > 0;
}

/**
 * @param {Package} name
 * @param {string} version
 */
function commit(name, version) {
	execFileSync("git", ["add", "."]);
	execFileSync("git", ["commit", "-am", "chore: bump version"]);
	execFileSync("git", ["tag", `${tagPrefix[name]}v${version}`]);
	execFileSync("git", ["push"]);
	execFileSync("git", ["push", "origin", "--tags"]);
}
