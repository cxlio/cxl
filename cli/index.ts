import { Parameter, parseParameters, program } from '@cxl/program';
import { Package, getBranch, readPackage } from '@cxl/build/package.js';
import { sh as _sh } from '@cxl/server';
import { mkdtemp, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { SpawnOptions } from 'child_process';

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

export default program('cli', ({ log }) => {
	function sh(cmd: string, o?: SpawnOptions) {
		log(cmd);
		return _sh(cmd, o);
	}

	async function testPackage(dir: string, _pkg: Package) {
		const cwd = await mkdtemp(join(os.tmpdir(), 'cxl-'));
		await sh(`cp -r dist/${dir}/* ${cwd}`);
		await sh(`npm install --production`, { cwd });
		await sh(`rm -rf ${cwd}`);
	}

	const scripts: Record<string, Script> = {
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
				if (!commit) throw 'commit not specified';
				/*commit =
					commit ||
					(await sh(`git rev-parse ${rev || 'master'}`)).trim();*/
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

				if (dryrun) return console.log(entry);

				const changelog = JSON.parse(
					await readFile('changelog.json', 'utf8').catch(() => '{}')
				) as Changelog;
				changelog[commit] = entry;

				log(`Writing changelog.json`);
				await writeFile('changelog.json', JSON.stringify(changelog));
			},
		},
		publish: {
			parameters: [],
			async fn(args: { $?: string }) {
				const mod = args.$;
				if (!mod) throw 'Module not specified';
				const branch = await getBranch(mod);
				if (branch !== 'master') throw 'Active branch is not master';

				try {
					await sh(`git diff origin master --quiet`);
				} catch (e) {
					throw 'Branch has not been merged with origin';
				}

				const pkg = readPackage(mod);
				log(`Building ${pkg.name} ${pkg.version}`);
				await sh(`npm run build clean test package --prefix ${mod}`);
				//const report = require(`dist/${mod}/test-report.json`);

				await testPackage(mod, pkg);
				await sh(`npm publish --access=public`, { cwd: `dist/${mod}` });
				await sh(`npm version minor --prefix ${mod}`);
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
