import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { generate } = require('./index.js');
export { generate };
