const fs = require('fs').promises;
const path = require('path').posix;
const cp = require('child_process');

cp.execSync('npm run build --prefix build');

const { sh } = require('../dist/build');
const { readJson } = require('../dist/program');
const stats = {
	packages: [],
};

async function getScriptSize(dir, pkg) {
	const main = pkg.browser || pkg.main || 'index.js';
	const scriptPath = `dist/${dir}/${main}`;
	const stat = await fs.stat(scriptPath);
	return `${main}: ${stat.size}`;
}

async function build(dir) {
	const pkg = await readJson(path.join(dir, 'package.json'), false);

	if (!pkg) return;

	const cmd = !pkg.scripts?.package
		? `npm test && npm run build package`
		: `npm run package`;

	console.log(`Building ${pkg.name}`);

	const start = Date.now();
	await sh(cmd, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'] });
	const buildTime = Date.now() - start;
	const [tsconfig, testReport, mainScriptSize] = await Promise.all([
		readJson(`${dir}/tsconfig.json`),
		readJson(path.join('dist', dir, 'test-report.json')),
		getScriptSize(dir, pkg),
	]);

	stats.packages.push({
		dir,
		name: pkg.name,
		package: pkg,
		tsconfig,
		testReport,
		buildTime,
		stats: {
			mainScriptSize,
		},
	});
}

module.exports = fs.readdir('.').then(async all => {
	const start = Date.now();

	await build('tester');

	for (const dir of all) {
		try {
			if (dir !== 'tester') await build(dir);
		} catch (e) {
			console.error(`Failed to build: ${dir}`);
			console.error(e);
			process.exit(1);
		}
	}
	stats.totalTime = Date.now() - start;
	const statsJson = JSON.stringify(stats);
	await fs.writeFile('./dist/stats.json', statsJson, 'utf8');
	await sh('mkdir -p docs');
	//await sh('node dist/cli/build-data');
	await sh('cp scripts/build-report.html dist/index.html');
	console.log(`Finished in ${stats.totalTime}ms`);
});
