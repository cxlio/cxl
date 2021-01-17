import { basename } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

import { EMPTY, defer } from '@cxl/rx';

import { BuildConfiguration, build } from './builder.js';
import { docs, pkg, readPackage, readme } from './package.js';
import { file, minify } from './file.js';
import { eslint } from './lint.js';
import { tsconfig } from './tsc.js';

export function buildCxl(...extra: BuildConfiguration[]) {
	const packageJson = readPackage();
	const cwd = process.cwd();
	const tsconfigFile = require(cwd + '/tsconfig.json');
	const outputDir = tsconfigFile?.compilerOptions?.outDir;
	if (!outputDir) throw new Error('No outDir field set in tsconfig.json');

	const dirName = basename(outputDir);
	return build(
		{
			target: 'clean',
			outputDir,
			tasks: [
				defer(() => {
					execSync(`rm -rf ${outputDir}`);
				}),
			],
		},
		{
			outputDir,
			tasks: [
				file('index.html', 'index.html').catchError(() => EMPTY),
				file('debug.html', 'debug.html').catchError(() => EMPTY),
				file('test.html', 'test.html').catchError(() => EMPTY),
				tsconfig('tsconfig.test.json'),
			],
		},
		{
			target: 'docs',
			outputDir: '.',
			tasks: [readme()],
		},
		{
			target: 'docs-dev',
			outputDir: '.',
			tasks: [readme()],
		},
		{
			target: 'docs',
			outputDir: '.',
			tasks: [docs(dirName)],
		},
		{
			target: 'docs-dev',
			outputDir: '.',
			tasks: [docs(dirName, true)],
		},
		{
			target: 'package',
			outputDir,
			tasks: [
				eslint({ resolvePluginsRelativeTo: __dirname }),
				packageJson.browser
					? file(`${outputDir}/index.js`).pipe(minify())
					: EMPTY,
				pkg(),
			],
		},
		...(existsSync('tsconfig.amd.json')
			? [
					{
						target: 'package',
						outputDir: outputDir + '/amd',
						tasks: [
							tsconfig('tsconfig.amd.json'),
							packageJson.browser
								? file(`${outputDir}/amd/index.js`).pipe(
										minify()
								  )
								: EMPTY,
						],
					},
			  ]
			: []),
		...(existsSync('tsconfig.es6.json')
			? [
					{
						target: 'package',
						outputDir: outputDir + '/es6',
						tasks: [
							tsconfig('tsconfig.es6.json'),
							packageJson.browser
								? file(`${outputDir}/es6/index.js`).pipe(
										minify()
								  )
								: EMPTY,
						],
					},
			  ]
			: []),
		...extra
	);
}
