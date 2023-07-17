import { parametersParser, program, sh as _sh, readJson } from '@cxl/program';
import { Package, getBranch, readPackage } from '@cxl/build/package.js';
import { getPublishedVersion } from '@cxl/build/npm.js';
import { readdir, readFile, writeFile } from 'fs/promises';
import { SpawnOptions } from 'child_process';
import { lint } from './lint';
import { createFileSystem, projectFiles } from './create-project.js';

interface ChangelogEntry {
	project?: string;
	type: string;
	message: string;
}

interface ChangelogCommit {
	commit: string;
	date: string;
	log: ChangelogEntry[];
}
type Changelog = Record<string, ChangelogCommit>;

const LOG_REGEX =
	/(\w+) (feat|fix|docs|style|refactor|test|chore|revert)(?:\(([\w-]+)\))?: (.+)/;

export default program('cli', async ({ log }) => {
	const rootPkg = await readJson<Package>('package.json');

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
			await sh(
				`git status > /dev/null; git diff-index --quiet ${branch}`
			);
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

	async function publishProject(mod: string, dry: boolean, force: boolean) {
		const pkg = readPackage(mod);
		const lintResults = await lint([mod], rootPkg);
		if (lintResults.errors.length) {
			console.log(lintResults.errors);
			if (!dry) for (const fix of lintResults.fixes) await fix();
			throw 'Lint errors found';
		}

		if (!dry) {
			log(`Building ${pkg.name} ${pkg.version}`);
			await sh(`npm run build package docs --prefix ${mod}`);
			if (!force) await checkBranchClean('publish');
		}

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
	}

	const scripts = {
		push: parametersParser({}, async () => {
			const branch = await getBranch(process.cwd());
			if (branch === 'master') throw 'Active branch cannot be master';
			log(`Merging ${branch} into master`);
			await sh('npm run build');
			await checkBranchClean(branch);
			await sh(`git checkout master && git merge --squash ${branch}`);
			await scripts.changelog('');
			await sh(`git add changelog.json`);
			await sh(`git commit -m "chore: merge branch ${branch}"`);
			await sh('git push origin master');
			await sh(`git push -d origin ${branch} && git branch -D ${branch}`);
		}),
		changelog: parametersParser(
			{
				branch: { type: 'string', help: 'Git Branch' },
				commit: { type: 'string', help: 'Commit Hash' },
				dryrun: { type: 'boolean', help: 'Do not make changes' },
			},
			async ({ commit, branch, dryrun }) => {
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

					const [, , type, project, message] = match;

					files.push({ project, type, message });
				});

				if (dryrun) return console.log(entry);

				const changelog = JSON.parse(
					await readFile('changelog.json', 'utf8').catch(() => '{}')
				) as Changelog;
				changelog[commit] = entry;

				log(`Writing changelog.json`);
				await writeFile('changelog.json', JSON.stringify(changelog));
			}
		),
		lint: parametersParser(
			{
				dryrun: { type: 'boolean', help: 'Do not make changes' },
			},
			async args => {
				let mod = args.$;
				const dry = args.dryrun;

				if (mod.length === 0) mod = await readdir('.');

				if (!mod) throw 'Module not specified';

				const lintResults = await lint(mod, rootPkg);
				if (lintResults.errors.length) {
					console.error(lintResults.errors);
					if (!dry) {
						log('Attempting fixes');
						for (const fix of lintResults.fixes) await fix();
					}
					throw 'Lint errors found';
				} else log('[lint] No errors found');
			}
		),
		test: parametersParser({}, async args => {
			for (const mod of args.$) {
				if (!mod) throw 'Module not specified';
				await sh(`npm run build package --prefix ${mod}`);
				const pkg = readPackage(mod);
				await testPackage(mod, pkg);
			}
		}),
		publish: parametersParser(
			{
				dryrun: { type: 'boolean', help: 'Do not make changes' },
				force: { type: 'boolean', help: 'Ignore branch protection' },
			},
			async args => {
				const dry = args.dryrun;
				const force = args.force;
				const branch = await getBranch(process.cwd());
				if (!dry && branch !== 'master')
					throw 'Active branch is not master';

				if (!force) await checkBranchUpToDate();

				try {
					if (!dry) await sh('git checkout -b publish');
					for (const mod of args.$)
						if (mod) await publishProject(mod, !!dry, !!force);
					if (!dry) {
						await sh(`node scripts/build-readme.js`);
						await sh(`git commit -m "chore: update readme" -a`);
						await sh(
							'git checkout master && git merge --squash publish'
						);
						await sh(
							`git commit --no-edit -n && git push origin master`
						);
					}
				} catch (e) {
					console.error(e);
					log(`Publish failed. Aborting.`);
				} finally {
					if (!dry)
						await sh(`git checkout master; git branch -D publish`);
				}
			}
		),

		'create-project': parametersParser(
			{
				tsx: { help: 'Enable TSX mode' },
			},
			async config => {
				return createFileSystem(await projectFiles(config), log);
			}
		),

		'check-all': parametersParser({}, async () => {
			const all = await readdir('.');
			for (const dir of all) {
				const pkg = readPackage(dir);
				if (pkg.version === (await getPublishedVersion(pkg.name)))
					throw new Error('Package already published');
			}
		}),
	};

	const argv = process.argv.slice(2); //.join(' ');
	const script = scripts[argv[0] as keyof typeof scripts];
	if (!script) {
		log(`script not found: ${argv[0]}`);
		process.exitCode = 1;
		return;
	} else log(`Running "${argv[0]}"`);

	try {
		return await script(argv.slice(1).join(' '));
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
});

if (require.main?.filename === __filename) exports.default();
