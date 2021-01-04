const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const cp = require('child_process');
const { findProjects } = require('./util');

function exec(cmd, options) {
	console.log(cmd);
	return new Promise((resolve, reject) =>
		cp.exec(cmd, options, (e, val, err) => {
			console.log(val);
			if (e) {
				console.error(err);
				reject(err);
			} else resolve(val);
		})
	);
}

async function installDependencies(root, dest, project) {
	const pkgDir = `${dest}/${project}`;
	const pkgPath = `${pkgDir}/package.json`;
	const pkg = require(pkgPath);

	for (const dep in pkg.dependencies) {
		const depName = /@cxl\/(.+)/.exec(dep)?.[1];
		if (depName) pkg.dependencies[dep] = `${root}/dist/${depName}`;
	}
	pkg.devDependencies = { '@cxl/spec': `${root}/dist/spec` };

	if (pkg.browser) pkg.devDependencies['@cxl/tsx'] = `${root}/dist/tsx`;

	await fs.writeFile(pkgPath, JSON.stringify(pkg));
	await exec(`npm install --no-fund --no-package-lock`, { cwd: pkgDir });

	return pkg;
}

async function testProject(root, dest, project) {
	await exec(`npm run build package --prefix ${project}`, { cwd: root });
	await exec(`cp -r dist/${project} ${dest}`);
	const package = await installDependencies(root, dest, project);
	const testerArgs = package.browser ? '' : '--node';

	await exec(`node ${root}/dist/tester --ignoreCoverage ${testerArgs}`, {
		cwd: `${dest}/${project}`,
	});
}

async function run() {
	const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'cxl-'));
	const root = process.cwd();
	const projects = await findProjects(root);

	try {
		for (const project of projects) {
			await testProject(root, dest, project);
			await exec(`rm -rf ${dest}/${project}`);
		}
	} finally {
		await exec(`rm -rf ${dest}`);
	}
}

run();
