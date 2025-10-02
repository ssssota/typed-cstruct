import { sample1_t } from "./dist/bindings.ts";
import instantiate from "./dist/index.js";

const sample1 = sample1_t();
instantiate().then((mod) => {
	mod._init_sample1();
	const ptr = mod._get_sample1();
	const opts = { buf: mod.HEAPU8, offset: ptr };
	console.log(sample1.read(opts));
	sample1.proxy(opts).b = 42;
	mod._print_sample1();
	mod._free_sample1();
});
