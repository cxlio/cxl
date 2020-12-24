import { buildCxl } from './cxl.js';

export { tsconfig } from './tsc.js';
export { file, files, concatFile, copyDir, minify } from './file.js';
export { concat } from '../rx/index.js';
export { AMD, pkg, readme, bundle } from './package.js';
export { sh } from '../server/index.js';
export { buildCxl } from './cxl.js';
export { build } from './builder.js';

if (require.main?.filename === __filename) buildCxl();
