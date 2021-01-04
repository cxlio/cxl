const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const cp = require('child_process');

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

module.exports = {
	findProjects,
};
