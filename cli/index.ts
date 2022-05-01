import {
	Parameter,
	parseParameters,
	program,
	sh as _sh,
	readJson,
} from '@cxl/program';
import { Package, getBranch, readPackage } from '@cxl/build/package.js';
import { getPublishedVersion } from '@cxl/build/npm.js';
import { readdir, readFile, writeFile } from 'fs/promises';
//import { join } from 'path';
//import * as os from 'os';
import { SpawnOptions } from 'child_process';
import { lint } from './lint';
import { createFileSystem, projectFiles } from './create-project.js';

interface Script {
	parameters: Parameter[];
	fn(args: any): void | Promise<void>;
}

interface ChangelogEntry {
	project?: string;
	type: string;
	message: string;
	commit: string;
}

interface ChangelogCommit {
	commit: string;
	date: string;
	log: ChangelogEntry[];
}
type Changelog = Record<string, ChangelogCommit>;

const LOG_REGEX = /(\w+) (feat|fix|docs|style|refactor|test|chore|revert)(?:\(([\w-]+)\))?: (.+)/;

export default program('cli', async ({ log }) => {
	const rootPkg = await readJson('package.json');

	function sh(cmd: string, o?: SpawnOptions) {
		log(cmd, o ? o : '');
		return _sh(cmd, o);
	}

	async function testPackage(dir: string, _pkg: Package) {
		const cwd = `dist/${dir}`;
		await sh(`npm install --production`, { cwd });
		await sh(`npm test`, { cwd: dir });
		await sh(`rm -rf ${cwd}/node_modules package-lock.json`);
	}

	async function checkBranchClean(branch: string) {
		try {
			await sh(`git diff-index --quiet ${branch}`);
		} catch (e) {
			console.error(e);
			throw new Error('Not a clean repository');
		}
	}

	async function checkBranchUpToDate(branch = 'master') {
		try {
			await sh(`git diff origin ${branch} --quiet`);
		} catch (e) {
			log('Branch has not been merged with origin');
		}
	}

	const scripts: Record<string, Script> = {
		push: {
			parameters: [],
			async fn() {
				const branch = await getBranch(process.cwd());
				if (branch === 'master') throw 'Active branch cannot be master';
				log(`Merging ${branch} into master`);
				await sh('npm run build');
				await checkBranchClean(branch);
				await sh(`git checkout master && git merge --squash ${branch}`);
				await scripts.changelog.fn({});
				await sh(`git add changelog.json`);
				await sh(`git commit -m "chore: merge branch ${branch}"`);
				await sh('git push origin master');
			},
		},
		changelog: {
			parameters: [
				{ name: 'branch', type: 'string' },
				{ name: 'commit', type: 'string' },
				{ name: 'dryrun', type: 'boolean' },
			],
			async fn({
				commit,
				branch,
				dryrun,
			}: {
				dryrun?: boolean;
				commit?: string;
				branch?: string;
			}) {
				commit = commit || (await sh(`git rev-parse master`)).trim();
				const history = (
					await sh(
						`git log --oneline ${branch || ''} ${commit}..HEAD`
					)
				)
					.trim()
					.split('\n');

				const files: ChangelogEntry[] = [];
				const entry: ChangelogCommit = {
					commit,
					date: new Date().toISOString(),
					log: files,
				};

				history.forEach(line => {
					if (!line) return;
					const match = LOG_REGEX.exec(line);
					if (!match)
						throw new Error(`Invalid commit message: ${line}`);

					const [, commit, type, project, message] = match;

					files.push({ project, type, message, commit });
				});

				if (dryrun) return;

				const changelog = JSON.parse(
					await readFile('changelog.json', 'utf8').catch(() => '{}')
				) as Changelog;
				changelog[commit] = entry;

				log(`Writing changelog.json`);
				await writeFile('changelog.json', JSON.stringify(changelog));
			},
		},
		lint: {
			parameters: [{ name: 'dryrun', type: 'boolean' }],
			async fn(args: { $?: string; dryrun?: boolean }) {
				const mod = args.$;
				const dry = args.dryrun;

				if (!mod) throw 'Module not specified';

				const lintResults = await lint([mod], rootPkg);
				if (lintResults.errors.length) {
					console.log(lintResults.errors);
					if (!dry) {
						log('Attempting fixes');
						for (const fix of lintResults.fixes) await fix();
					}
					throw 'Lint errors found';
				}
			},
		},
		test: {
			parameters: [],
			async fn(args: { $?: string }) {
				const mod = args.$;
				if (!mod) throw 'Module not specified';
				await sh(`npm run build package --prefix ${mod}`);
				const pkg = readPackage(mod);
				await testPackage(mod, pkg);
			},
		},
		publish: {
			parameters: [{ name: 'dryrun', type: 'boolean' }],
			async fn(args: { $?: string; dryrun?: boolean }) {
				const mod = args.$;
				const dry = args.dryrun;

				if (!mod) throw 'Module not specified';
				const branch = await getBranch(mod);
				if (!dry && branch !== 'master')
					throw 'Active branch is not master';

				await sh(`npm run build docs --prefix ${mod}`);
				//await checkBranchClean(branch);
				await checkBranchUpToDate(branch);
				const pkg = readPackage(mod);
				const lintResults = await lint([mod], rootPkg);
				if (lintResults.errors.length) {
					console.log(lintResults.errors);
					if (!dry) for (const fix of lintResults.fixes) await fix();
					throw 'Lint errors found';
				}

				log(`Building ${pkg.name} ${pkg.version}`);
				await sh(`npm run build package --prefix ${mod}`);

				await testPackage(mod, pkg);
				if (!dry) {
					await sh(`npm publish --access=public`, {
						cwd: `dist/${mod}`,
					});
					await sh(`npm version minor --prefix ${mod}`);
					await sh(
						`git add ${mod}/package.json && git commit -m "chore(${mod}): publish ${pkg.name} ${pkg.version}"`
					);
				}
			},
		},

		'create-project': {
			parameters: [{ name: 'tsx', type: 'boolean' }],
			async fn(config: { $: string; tsx?: boolean }) {
				return createFileSystem(await projectFiles(config), log);
			},
		},

		'check-all': {
			parameters: [],
			async fn() {
				const all = await readdir('.');
				for (const dir of all) {
					const pkg = readPackage(dir);
					if (pkg.version === (await getPublishedVersion(pkg.name)))
						throw new Error('Package already publish');
				}
			},
		},
	};

	const argv = process.argv.slice(2); //.join(' ');
	const script = scripts[argv[0]];
	if (!script) {
		log(`script not found: ${argv[0]}`);
		process.exitCode = 1;
		return;
	}

	return script.fn(
		parseParameters(script.parameters, argv.slice(1).join(' '))
	);
});

if (require.main?.filename === __filename) exports.default();
