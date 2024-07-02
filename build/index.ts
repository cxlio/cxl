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
export { mkdirp, sh } from '@cxl/program';
export { Output } from '@cxl/source';
export {
	AMD,
	REQUIRE_REPLACE,
	pkg,
	readme,
	bundle,
	bundleAmd,
	template,
	docgen,
	docgenTask,
} from './package.js';
export { Package } from './npm.js';
export { buildCxl } from './cxl.js';
export { Task, build, exec, shell } from './builder.js';

if (require.main?.filename === __filename) buildCxl();
