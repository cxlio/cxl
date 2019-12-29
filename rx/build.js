// import { build, tsconfig, typescript, pkg } from '../dist/build/index.js';
const { build, tsconfig, typescript, pkg } = require('../dist/build/index.js');

build({
	outputDir: '../dist/rx',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
