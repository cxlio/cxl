import { basename, join } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { EMPTY, concat, observable, mergeMap, of } from '@cxl/rx';
import { Output } from '@cxl/source';

import { BuildConfiguration, build, exec } from './builder.js';
import { docs, pkg, readPackage, readme } from './package.js';
import { concatFile, file, minifyDir, minify } from './file.js';
import { eslint } from './lint.js';
import { tsconfig } from './tsc.js';

export function minifyIf(filename: string) {
	return mergeMap((out: Output) =>
		out.path === filename
			? concat(of(out), file(out.path).pipe(minify()))
			: of(out),
	);
}

export function generateTestFile(
	dirName: string,
	pkgName: string,
	testFile: string,
) {
	return `<!DOCTYPE html>
<title>${pkgName} Test Suite</title>
<script type="module" src="/cxl/dist/tester/require-browser.js"></script>
<script type="module">
	require.replace = function (path) {
		return path.replace(
			/^@j5g3\\/(.+)/,
			(str, p1) =>
				\`/j5g3/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		)
		.replace(
			/^@cxl\\/workspace\\.(.+)/,
			(str, p1) =>
				\`/cxl.app/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		)
		.replace(
			/^@cxl\\/gbc\.(.*)/,
			(str, p1) =>
				\`/gbc/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		)
		.replace(
			/^@cxl\\/(ui.*)/,
			(str, p1) =>
				\`/ui/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		)
		.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		);
	};
	const browserRunner = require('/cxl/dist/tester/browser-runner.js').default;

	const suite = require('${testFile}').default;
	browserRunner.run([suite], '../../${dirName}/spec');
</script>`;
}

export function buildCxl(...extra: BuildConfiguration[]) {
	const packageJson = readPackage();
	const cwd = process.cwd();
	const tsconfigFile = require(cwd + '/tsconfig.json');
	const outputDir = tsconfigFile?.compilerOptions?.outDir;
	if (!outputDir) throw new Error('No outDir field set in tsconfig.json');

	const dirName = basename(outputDir);
	const tester = join(__dirname, '../tester');
	const isBrowser = !!packageJson.browser;
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
				file('stage.html', 'stage.html').catchError(() => EMPTY),
				file('icons.svg', 'icons.svg').catchError(() => EMPTY),
				file('favicon.ico', 'favicon.ico').catchError(() => EMPTY),
				file('test.html', 'test.html').catchError(() =>
					of({
						path: 'test.html',
						source: Buffer.from(
							generateTestFile(
								dirName,
								packageJson.name,
								'./test.js',
							),
						),
					}),
				),
				tsconfig('tsconfig.test.json'),
			],
		},
		{
			target: 'test',
			outputDir,
			tasks: [
				exec(
					`cd ${outputDir} && node ${tester} --baselinePath=../../${dirName}/spec${
						isBrowser ? '' : ' --node'
					}`,
				),
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
				eslint(),
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
							concat(
								tsconfig('tsconfig.amd.json'),
								minifyDir(outputDir + '/amd', {
									sourceMap: false,
									changePath: false,
								}),
							),
						],
					},
			  ]
			: []),
		...(existsSync('tsconfig.mjs.json')
			? [
					{
						target: 'package',
						outputDir: outputDir + '/mjs',
						tasks: [
							concat(
								tsconfig('tsconfig.mjs.json'),
								minifyDir(outputDir + '/mjs', {
									sourceMap: false,
									changePath: false,
								}),
							),
						],
					},
			  ]
			: []),
		...(existsSync('tsconfig.api.json')
			? [
					{
						outputDir: outputDir,
						tasks: [
							tsconfig('tsconfig.api.json', {
								sourceMap: false,
							})
								.filter(({ path }) => path.endsWith('.js'))
								.pipe(concatFile('server.js')),
						],
					},
			  ]
			: []),
		...(existsSync('tsconfig.server.json')
			? [
					{
						outputDir: outputDir,
						tasks: [tsconfig('tsconfig.server.json')],
					},
			  ]
			: []),
		...(existsSync('tsconfig.worker.json')
			? [
					{
						outputDir: outputDir,
						tasks: [
							tsconfig(
								'tsconfig.worker.json',
								undefined,
								outputDir,
							),
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
									minify({ changePath: false }),
								),
							),
						],
					},
			  ]
			: []),
		{
			target: 'docs-dev',
			outputDir: '.',
			tasks: [docs(dirName, true)],
		},
		...extra,
		{
			target: 'docs',
			outputDir: '.',
			tasks: [docs(dirName)],
		},
	);
}
