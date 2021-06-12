import { basename } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { EMPTY, concat, observable, mergeMap, of } from '@cxl/rx';
import { Output } from '@cxl/source';

import { BuildConfiguration, build } from './builder.js';
import { docs, pkg, readPackage, readme } from './package.js';
import { file, minify } from './file.js';
import { eslint } from './lint.js';
import { tsconfig } from './tsc.js';

export function minifyIf(filename: string) {
	return mergeMap((out: Output) =>
		out.path === filename
			? concat(of(out), file(out.path).pipe(minify()))
			: of(out)
	);
}

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
				observable(() => {
					execSync(`rm -rf ${outputDir}`);
				}),
			],
		},
		{
			outputDir,
			tasks: [
				file('index.html', 'index.html').catchError(() => EMPTY),
				file('debug.html', 'debug.html').catchError(() => EMPTY),
				file('test.html', 'test.html').catchError(() =>
					of({
						path: 'test.html',
						source: Buffer.from(`<!DOCTYPE html>
<script src="../tester/require-browser.js"></script>
<script type="module">
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`../../../cxl/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		);
	};
	const browserRunner = require('../tester/browser-runner.js').default;

	const suite = require('./test.js').default;
	browserRunner.run([suite], '../../${dirName}/spec');
</script>`),
					})
				),
				tsconfig('tsconfig.test.json'),
			],
		},
		{
			target: 'package',
			outputDir: '.',
			tasks: [readme()],
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
		...(existsSync('tsconfig.bundle.json')
			? [
					{
						target: 'package',
						outputDir: outputDir,
						tasks: [
							concat(
								tsconfig('tsconfig.bundle.json'),
								file(`${outputDir}/index.bundle.js`).pipe(
									minify()
								)
							),
						],
					},
			  ]
			: []),
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
		...extra
	);
}
