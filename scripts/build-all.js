const fs = require('fs').promises;
const path = require('path').posix;
const cp = require('child_process');

cp.execSync('npm run build --prefix build');

const { sh } = require('../dist/build');
const { readJson } = require('../dist/server');
const stats = {
	packages: [],
};

async function build(dir) {
	const pkg = await readJson(path.join(dir, 'package.json'));

	if (!pkg) return;

	// if (pkg.private) return console.log(`Ignoring private package ${pkg.name}`);

	const cmd = !pkg.scripts?.package
		? `npm run test && npm run build -- docs package`
		: `npm run package`;

	console.log(`Building ${pkg.name}`);

	const start = Date.now();
	await sh(cmd, { cwd: dir, stdio: 'ignore' });
	const buildTime = Date.now() - start;
	const testReport = await readJson(
		path.join('dist', dir, 'test-report.json')
	);

	stats.packages.push({
		name: pkg.name,
		package: pkg,
		testReport,
		buildTime,
	});
}

module.exports = fs.readdir('.').then(async all => {
	const start = Date.now();

	await build('docgen');
	await build('tester');

	for (const dir of all) {
		try {
			await build(dir);
		} catch (e) {
			console.error(`Failed to build: ${dir}`);
			console.error(e);
			process.exit(1);
		}
	}
	stats.totalTime = Date.now() - start;
	await fs.writeFile('./dist/stats.json', JSON.stringify(stats), 'utf8');
	console.log(`Finished in ${stats.totalTime}ms`);
});
