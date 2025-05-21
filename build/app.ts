import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

import { concat, fromAsync, EMPTY, merge } from '@cxl/rx';
import { Output } from '@cxl/source';
import { sh } from '@cxl/program';

import { checkBranchClean, checkBranchUpToDate, getBranch } from './git.js';
import { BuildConfiguration, build, exec } from './builder.js';
import { basename, copyDir, file, minifyDir } from './file.js';
import { tsconfig } from './tsc.js';
import { eslint } from './lint.js';

export interface PluginBuildConfig {
	appId: string;
	plugins?: string[];
	libraries?: Record<string, string>;
	thirdParty?: Record<string, string>;
}

export interface AppBuildConfig extends PluginBuildConfig {
	deployDir: string;
	publicDir?: string;
	s3DevUrl?: string;
	s3url: string;
	extraApps?: { appId: string; deployDir: string }[];
}

export const HASH = execSync(
	'git rev-parse --short "$(git symbolic-ref HEAD | sed \'s@^refs/remotes/origin/@@\')"',
)
	.toString()
	.trim();
const staticMaxAge = 31536000;

export function publishTasks(
	{ deployDir, extraApps }: AppBuildConfig,
	s3url: string,
	stage = false,
) {
	return [
		concat(
			fromAsync(async () => {
				const branch = await getBranch(process.cwd());
				await checkBranchClean(branch);
				await checkBranchUpToDate();
				if (!existsSync(`${deployDir}/${HASH}`))
					throw new Error(
						`Package has not been deployed to "${deployDir}/${HASH}"`,
					);
			}).ignoreElements(),
			exec(
				`aws s3 cp --recursive --cache-control public,max-age=${staticMaxAge},immutable ${deployDir}/${HASH} ${s3url}/${HASH}`,
			),
			stage && existsSync(`${deployDir}/stage.html`)
				? exec(
						`aws s3 cp --cache-control max-age=60 ${deployDir}/stage.html ${s3url}/index.html`,
				  )
				: exec(
						`aws s3 cp --cache-control max-age=60 ${deployDir}/index.html ${s3url}/index.html`,
				  ),
			...(extraApps || []).flatMap(app => [
				exec(
					`aws s3 cp --recursive --cache-control public,max-age=${staticMaxAge},immutable ${deployDir}/${app.appId} ${s3url}/${app.appId}`,
				),
				exec(
					stage && existsSync(`${deployDir}/stage.html`)
						? `aws s3 cp --cache-control max-age=60 ${deployDir}/${app.appId}/stage.html ${s3url}/${app.appId}/index.html`
						: `aws s3 cp --cache-control max-age=60 ${deployDir}/${app.appId}/index.html ${s3url}/${app.appId}/index.html`,
				),
			]),
		),
	];
}

export function replaceHash(src: string, prefix = './') {
	const match = /<base href=".+?" \/>/.exec(src);
	const base = `<base href="${prefix}${HASH}/" />`;
	if (match)
		return (
			src.slice(0, match.index) +
			base +
			src.slice(match.index + match[0].length)
		);

	return src.replace('<head>', `<head>${base}`);
}

export function insertHash(out: Output, prefix = './') {
	out.source = Buffer.from(replaceHash(out.source.toString(), prefix));
}

export function serviceWorkerTasks({
	appId,
	deployDir,
	s3url,
}: AppBuildConfig) {
	const outputDir = `../dist/${appId}`;
	return [
		{
			target: 'package',
			outputDir,
			tasks: [
				concat(
					exec('npm run build --prefix ../fs-client'),
					// Create symbolic link for worker scripts so they can be under the service worker
					exec(
						`mkdir -p ${outputDir}/lib && rm -f ${outputDir}/lib/cxl.app && ln -s ../.. ${outputDir}/lib/cxl.app`,
					),
					file('../dist/fs-client/worker.js', 'fs-worker.js'),
				),
			],
		},
		{
			target: 'deploy',
			outputDir: deployDir,
			tasks: [
				existsSync(`../dist/${appId}/fs-worker.js`)
					? file(`../dist/${appId}/fs-worker.js`, 'fs-worker.js')
					: EMPTY,
			],
		},
		{
			target: 'publish',
			outputDir,
			tasks: [
				exec(
					`aws s3 cp --cache-control max-age=60 ${deployDir}/fs-worker.js ${s3url}/fs-worker.js`,
				),
			],
		},
	];
}

export function extraAppsTasks({
	appId,
	extraApps,
	deployDir,
}: AppBuildConfig) {
	const outputDir = `../dist/${appId}`;
	return (extraApps || []).flatMap(app => [
		{
			target: 'package',
			outputDir,
			tasks: [exec(`npm run build package --prefix ../${app.appId}`)],
		},
		{
			target: 'deploy',
			outputDir,
			tasks: [
				concat(
					exec(`npm run build deploy --prefix ../${app.appId}`),
					copyDir(app.deployDir, `${deployDir}/${app.appId}`),
				),
			],
		},
	]);
}

export function appTasks(config: AppBuildConfig) {
	const { appId, deployDir, publicDir, s3url, s3DevUrl } = config;
	let { libraries, thirdParty } = config;
	const outputDir = `../dist/${appId}`;
	const deployFilter =
		"* --exclude=test.js --exclude=test-* --exclude=package.json --include='*.js' --include='*.wasm' --include='*.json' --exclude='*' ";
	const dirName = basename(outputDir);
	const tester = join(__dirname, '../tester');
	const body = existsSync('body.html') && readFileSync('body.html');

	function appendBody(out: Output) {
		if (body) out.source = Buffer.concat([out.source, body]);
	}

	libraries ||= {};
	thirdParty ||= {};

	return [
		{
			outputDir,
			tasks: [
				file('debug.html', 'index.html').tap(appendBody),
				file('favicon.ico', 'favicon.ico'),
				existsSync('text.html')
					? file('test.html', 'test.html')
					: EMPTY,
				tsconfig('tsconfig.test.json'),
				publicDir ? copyDir(publicDir, `${outputDir}/public`) : EMPTY,
			],
		},
		{
			target: 'test',
			outputDir,
			tasks: [
				exec(
					`cd ${outputDir} && node ${tester} --baselinePath=../../${dirName}/spec`,
				),
			],
		},
		{
			target: 'package',
			outputDir,
			tasks: [eslint()],
		},
		...Object.keys(libraries).map(key => ({
			target: 'package',
			outputDir,
			tasks: [exec(`npm run build package --prefix ../../${key}`)],
		})),
		{
			target: 'publish',
			outputDir: deployDir,
			tasks: [
				fromAsync(async () => {
					await sh(`rm -r ${deployDir}`);
					const branch = await getBranch(process.cwd());
					await checkBranchClean(branch);
				}).ignoreElements(),
			],
		},
		{
			target: 'deploy',
			outputDir: deployDir,
			tasks: [
				publicDir
					? copyDir(
							`${outputDir}/public`,
							`${deployDir}/${HASH}/public`,
					  )
					: EMPTY,
				merge(
					file('index.html', 'index.html'),
					file('stage.html', 'stage.html'),
				)
					.tap(appendBody)
					.tap(insertHash),
			],
		},
		{
			target: 'deploy',
			outputDir: `${deployDir}/${HASH}`,
			tasks: [
				copyDir(outputDir, `${deployDir}/${HASH}`, deployFilter),
				...Object.entries(libraries).map(([key, value]) =>
					copyDir(
						value,
						`${deployDir}/${HASH}/lib/${key}`,
						deployFilter,
					),
				),
				...Object.entries(thirdParty).map(([key, value]) =>
					copyDir(
						value,
						`${deployDir}/${HASH}/lib/${key}`,
						deployFilter,
					),
				),
			],
		},
		{
			target: 'deploy',
			outputDir: `${deployDir}/${HASH}`,
			tasks: [
				minifyDir(`${deployDir}/${HASH}`, {
					sourceMap: false,
					changePath: false,
				}),
			],
		},
		...extraAppsTasks(config),
		{
			target: 'publish',
			outputDir,
			tasks: publishTasks(config, s3url),
		},
		...(s3DevUrl
			? [
					{
						target: 'publish-dev',
						outputDir,
						tasks: publishTasks(config, s3DevUrl, true),
					},
			  ]
			: []),
	];
}

export function buildApp(
	config: AppBuildConfig,
	...extra: BuildConfiguration[]
) {
	return build(...appTasks(config), ...extra);
}
