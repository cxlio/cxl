import { sh } from '@cxl/program';
import { readFile } from 'fs/promises';
import { checkBranchClean, getBranch } from './git.js';

export type License =
	| 'GPL-3.0'
	| 'GPL-3.0-only'
	| 'Apache-2.0'
	| 'UNLICENSED'
	| 'SEE LICENSE IN LICENSE.txt';

export type Dependencies = Record<string, string>;

export interface Package {
	name: string;
	version: string;
	description: string;
	license: License;
	files: string[];
	main: string;
	bin?: string;
	keywords?: string[];
	browser?: string;
	homepage: string;
	private: boolean;
	bugs: string;
	repository: string | { type: 'git'; url: string; directory?: string };
	dependencies?: Dependencies;
	devDependencies?: Dependencies;
	peerDependencies?: Dependencies;
	bundledDependecies?: Dependencies;
	type?: string;
	scripts?: Record<string, string>;
}

export interface PackageInfo extends Package {
	'dist-tags': Record<string, string>;
	versions: string[];
	time: Record<string, string>;
}

export async function readPackage(path: string): Promise<Package> {
	return JSON.parse(await readFile(path, 'utf8'));
}

export async function getLatestVersion(
	packageName: string,
	tag = 'latest'
): Promise<string | undefined> {
	const info = await getPackageInfo(packageName);
	return info?.['dist-tags'][tag] || undefined;
}

export async function isVersionPublished(packageName: string, version: string) {
	const info = await getPackageInfo(packageName);
	return info.versions.includes(version);
}

export async function testPackage(dir: string, prefix: string) {
	try {
		await sh(`mkdir -p ${prefix}`);
		/*const tar = await sh(`npm pack --pack-destination ${prefix}`, {
			cwd: dir,
		});
		await sh(`tar -zxvf ${prefix}/${tar}`);*/
		console.log(await sh(`npm install --prefix ${prefix} file:${dir}`));
		/*await sh(
			`cd ${prefix} && node ${process.cwd()}/node_modules/@cxl/tester/bin/index.js`
		);*/
	} finally {
		await sh(`rm -rf ${prefix}`);
	}
}

export async function publishNpm(dir: string) {
	const branch = await getBranch(process.cwd());
	if (branch !== 'master') throw 'Active branch is not master';

	await checkBranchClean('master');

	const p = await readPackage(`${dir}/package.json`);

	const info = await getPackageInfo(p.name);

	if (info.versions.includes(p.version))
		throw new Error(`Package version "${p.version}" already published.`);

	await testPackage(dir, `${dir}/staging`);

	const tag = p.version.includes('beta') ? 'beta' : 'latest';
	const removeVersion = tag === 'beta' ? info['dist-tags'].beta : undefined;

	console.log(
		await sh(`npm publish --access=public --tag ${tag}`, {
			cwd: dir,
		})
	);

	if (tag === 'beta') {
		const baseTag = `${p.version.split('.')[0]}-beta`;
		console.log(
			await sh(`npm dist-tag add ${p.name}@${p.version} ${baseTag}`)
		);
	}

	if (removeVersion)
		console.log(await sh(`npm unpublish ${p.name}@${removeVersion}`));
}

export async function getPackageInfo(name: string): Promise<PackageInfo> {
	return JSON.parse((await sh(`npm show ${name} --json`)).trim());
}
