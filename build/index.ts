#!/usr/bin/env node
import { buildCxl } from './cxl.js';

export { tsconfig, bundle as tsBundle } from './tsc.js';
export {
	basename,
	file,
	files,
	concatFile,
	copyDir,
	minify,
	zip,
} from './file.js';
export { concat } from '@cxl/rx';
export { mkdirp, sh } from '@cxl/server';
export { Output } from '@cxl/source';
export { AMD, Package, pkg, readme, bundle, template } from './package.js';
export { buildCxl } from './cxl.js';
export { Task, build, exec, shell } from './builder.js';

if (require.main?.filename === __filename) buildCxl();
