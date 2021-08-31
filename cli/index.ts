import { Parameter, parseParameters, program } from '@cxl/program';
import { getBranch, readPackage } from '@cxl/build/package.js';
//import { stat } from 'fs/promises';

interface Script {
	parameters: Parameter[];
	fn(args: any): void | Promise<void>;
}

const scripts: Record<string, Script> = {
	publish: {
		parameters: [],
		async fn(args: { $?: string }) {
			const mod = args.$;
			if (!mod) throw 'Module not specified';
			const branch = await getBranch(mod);
			if (branch !== 'master') throw 'Active branch is not master';

			const pkg = readPackage(mod);

			console.log(args, pkg);
		},
	},
};

export default program('cli', ({ log }) => {
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
