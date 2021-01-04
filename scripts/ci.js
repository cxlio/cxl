const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const cp = require('child_process');
const { findProjects } = require('./util');

function exec(cmd, options) {
	console.log(cmd);
	return new Promise((resolve, reject) =>
		cp.exec(cmd, options, (e, val, err) =>
			e ? reject(err + val) : resolve(val)
		)
	);
}

async function buildProject(rootDir, dir) {
	await exec(`npm run build package --prefix ${dir}`, { cwd: rootDir });
	await exec(`npm install --production --prefix dist/${dir}`, {
		cwd: rootDir,
	});
}

async function testProject(rootDir, dir) {
	const pkgDir = `${rootDir}/dist/${dir}`;
	const pkg = require(`${pkgDir}/package.json`);
	const testerArgs = pkg.browser ? '' : '--node';
	await exec(`node ../tester ${testerArgs}`, { cwd: pkgDir });
}

async function run() {
	const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'cxl-'));

	try {
		await exec(`git clone . ${dest}`);
		await exec(`npm install`, { cwd: dest });
		await exec(`npm run build --prefix build`, { cwd: dest });

		const projects = await findProjects(dest);

		for (const dir of projects) await buildProject(dest, dir);

		// Clean node_modules
		await exec(`rm -rf node_modules`, { cwd: dest });

		for (const dir of projects) await testProject(dest, dir);
	} finally {
		await exec(`rm -rf ${dest}`);
	}
}

run();
