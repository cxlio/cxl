import { Parameter, parseParameters, program } from '@cxl/program';
import { Package, getBranch, readPackage } from '@cxl/build/package.js';
import { sh as _sh } from '@cxl/server';
import { mkdtemp } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { SpawnOptions } from 'child_process';

interface Script {
	parameters: Parameter[];
	fn(args: any): void | Promise<void>;
}

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
		publish: {
			parameters: [],
			async fn(args: { $?: string }) {
				const mod = args.$;
				if (!mod) throw 'Module not specified';
				const branch = await getBranch(mod);
				if (branch !== 'master') throw 'Active branch is not master';

				try {
					await sh(`git diff origin master -quiet`);
				} catch (e) {
					throw 'Branch has not been merged with origin';
				}

				const pkg = readPackage(mod);
				log(`Building ${pkg.name} ${pkg.version}`);
				await sh(`npm run build test package docs --prefix ${mod}`);
				//const report = require(`dist/${mod}/test-report.json`);

				testPackage(mod, pkg);
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
