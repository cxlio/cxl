const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const cp = require('child_process');

function exec(cmd, options) {
	console.log(cmd);
	return new Promise((resolve, reject) =>
		cp.exec(cmd, options, (e, val, err) =>
			e ? reject(err + val) : resolve(val)
		)
	);
}

function exists(filepath) {
	return fs.stat(filepath).catch(() => false);
}

async function findProjects(rootPath) {
	const list = await fs.readdir(rootPath);
	const result = [];

	for (const dirname of list) {
		const projectPath = `${rootPath}/${dirname}`;

		if (
			(await fs.stat(projectPath)).isDirectory() &&
			(await exists(`${projectPath}/package.json`))
		)
			result.push(dirname);
	}

	return result;
}

async function testProject(rootDir, dir) {
	await exec(`npm test --prefix dist/${dir}`, { cwd: rootDir });
}

async function run() {
	const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'cxl-'));

	try {
		await exec(`git clone . ${dest}`);
		await exec(`npm install`, { cwd: dest });
		await exec(`node scripts/build-all`, { cwd: dest });

		// Clean node_modules
		await exec(`rm -rf node_modules`, { cwd: dest });
		await exec(`npm install --prefix dist/tester`);

		const projects = await findProjects(dest);
		await Promise.all(projects.map(dir => testProject(dest, dir)));
	} finally {
		await exec(`rm -rf ${dest}`);
	}
}

run();
