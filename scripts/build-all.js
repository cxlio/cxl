const fs = require('fs').promises;
const path = require('path').posix;
const cp = require('child_process');
const { sh } = require('../dist/build');
const { readJson } = require('../dist/server');

async function build(dir) {
	const pkg = await readJson(path.join(dir, 'package.json'));

	if (!pkg) return;

	if (pkg.private) return console.log(`Ignoring private package ${pkg.name}`);

	const cmd = !pkg.scripts?.package
		? `npm run test && npm run build -- docs package`
		: `npm run package`;

	console.log(`Building ${pkg.name}`);
	await sh(cmd, { cwd: dir, stdio: 'ignore' });
}

module.exports = fs.readdir('.').then(async all => {
	const start = Date.now();

	await build('docgen');

	for (const dir of all) {
		try {
			await build(dir);
		} catch (e) {
			console.error(`Failed to build: ${dir}`);
			console.error(e);
			process.exit(1);
		}
	}
	console.log(`Finished in ${Date.now() - start}ms`);
});
