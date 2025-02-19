#!/usr/bin/env node
const { parseArgs } = require("node:util");
const { generate } = require("./index.js");
const fs = require("node:fs");
const { values, positionals } = parseArgs({
	options: {
		header: {
			short: "h",
			type: "string",
			multiple: true,
			default: [],
		},
		"dump-rust-code": {
			type: "boolean",
			default: false,
		},
		help: {
			type: "boolean",
		},
		"clang-args": {
			type: "string",
			multiple: true,
		},
		"entry-types": {
			type: "string",
			multiple: true,
		},
	},
	allowPositionals: true,
});

if (values.help) {
	help();
	process.exit(0);
}

if (positionals.length !== 1) {
	console.error("Error: Expected exactly one positional argument");
	help();
	process.exit(1);
}

if (values.header.length === 0) {
	console.error("Error: Expected at least one header file");
	help();
	process.exit(1);
}

fs.writeFileSync(
	positionals[0],
	generate(
		values.header,
		values["dump-rust-code"],
		values["clang-args"],
		values["entry-types"],
	),
);

function help() {
	console.log("Usage: generator [options] <file>");
	console.log("Options:");
	console.log("  -h, --header <header>  Add a header file (multiple allowed)");
	console.log(
		"  --dump-rust-code       Dump the generated Rust code to stdout",
	);
	console.log(
		"  --clang-args <args>    Additional arguments to pass to clang (multiple allowed)",
	);
	console.log(
		"  --entry-types <types>  Entrypoint types to generate (multiple allowed)",
	);
	console.log("  --help                 Show this help");
	console.log("Arguments:");
	console.log("  file  The file to generate");
}
