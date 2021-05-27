import { buildCxl } from './cxl.js';

export { tsconfig } from './tsc.js';
export { file, files, concatFile, copyDir, minify } from './file.js';
export { concat } from '@cxl/rx';
export { mkdirp, sh } from '@cxl/server';
export { Output } from '@cxl/source';
export { AMD, Package, pkg, readme, bundle, template } from './package.js';
export { buildCxl } from './cxl.js';
export { Task, build } from './builder.js';

if (require.main?.filename === __filename) buildCxl();
