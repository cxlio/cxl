import { buildCxl } from './cxl.js';

export { tsconfig } from './tsc.js';
export { file, files, concatFile, copyDir, minify } from './file.js';
export { concat } from '@cxl/rx';
export { sh } from '@cxl/server';
export { AMD, pkg, readme, bundle } from './package.js';
export { buildCxl } from './cxl.js';
export { build } from './builder.js';

if (require.main?.filename === __filename) buildCxl();
