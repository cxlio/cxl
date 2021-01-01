const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const cp = require('child_process');

function exec(cmd, options) {
	console.log(cmd);
	return new Promise((resolve, reject) =>
		cp.exec(cmd, options, (e, val) => (e ? reject(e) : resolve(val)))
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
			result.push(projectPath);
	}

	return result;
}

async function run() {
	const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'cxl-'));

	try {
		await exec(`git clone . ${dest}`);
		await exec(`npm install --prefix build`, { cwd: dest });
		await exec(`npm run build --prefix build`, { cwd: dest });
		const projects = findProjects(dest);
	} finally {
		await exec(`rm -rf ${dest}`);
	}
}

run();
