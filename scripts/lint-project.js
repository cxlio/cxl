/**
 * Verify project structure
 */
const path = require('path');
const fs = require('fs').promises;
const cp = require('child_process');

cp.execSync('npm run build --prefix build');

const { readJson } = require('../dist/server');
const { program } = require('../dist/server/program');

const BugsUrl = 'https://github.com/cxlio/cxl/issues';

const baseDir = path.resolve('.');
const requiredPackageFields = [
	'name',
	'version',
	'description',
	'license',
	//	'homepage',
	'bugs',
];
const requiredPackageScripts = ['build', 'test'];
const licenses = ['GPL-3.0', 'GPL-3.0-only', 'Apache-2.0'];
const dependencies = [];

function Result(id, valid, message) {
	return { id, valid, message };
}

const fixes = {
	package: async ({ projectPath, dir, rootPkg }) => {
		let hasChanges = false;
		const pkgPath = `${projectPath}/package.json`;
		const pkg = await readJson(pkgPath);
		const oldPackage = JSON.stringify(pkg, null, '\t');
		const testScript = `npm run build && cd ../dist/${dir} && node ../tester`;

		if (!pkg.scripts) pkg.scripts = {};
		if (!pkg.scripts.test) pkg.scripts.test = testScript;
		if (!pkg.scripts.build) pkg.scripts.build = `node ../dist/build`;

		if (!pkg.license) pkg.license = 'GPL-3.0';
		if (!pkg.bugs) pkg.bugs = rootPkg.bugs || BugsUrl;
		if (pkg.devDependencies) delete pkg.devDependencies;
		if (pkg.peerDependencies) delete pkg.peerDependencies;
		if (pkg.browser) pkg.browser = 'amd/index.min.js';

		if (!pkg.scripts.test.startsWith(testScript)) {
			const testerArgs =
				/node \.\.\/tester(\s+.+)/.exec(pkg.scripts.test)?.[1] || '';
			pkg.scripts.test = `${testScript}${testerArgs}`;
		}

		const newPackage = JSON.stringify(pkg, null, '\t');

		if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
	},

	'tsconfig.test': async ({ projectPath, dir }) => {
		const path = `${projectPath}/tsconfig.test.json`;
		if (!(await exists(path))) {
			await fs.writeFile(
				path,
				`{
	"extends": "../tsconfig.json",
	"compilerOptions": {
		"outDir": "../dist/${dir}"
	},
	"files": ["test.ts"],
	"references": [{ "path": "." }, { "path": "../spec" }]
}
`
			);
		}
	},

	async dependencies({ projectPath, rootPkg }) {
		const pkgPath = `${projectPath}/package.json`;
		const pkg = await readJson(pkgPath);
		const oldPackage = JSON.stringify(pkg, null, '\t');

		for (const name in pkg.dependencies) {
			const rootValue =
				rootPkg.devDependencies?.[name] || rootPkg.dependencies?.[name];
			if (pkg.dependencies[name] !== rootValue)
				pkg.dependencies[name] = rootValue;
		}

		const newPackage = JSON.stringify(pkg, null, '\t');

		if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
	},

	'tsconfig.references': async ({ projectPath, baseDir }) => {
		const pkgPath = `${projectPath}/package.json`;
		const pkg = await readJson(pkgPath);
		const tsconfig = await readJson(`${projectPath}/tsconfig.json`);
		const oldPackage = JSON.stringify(pkg, null, '\t');

		for (const ref of tsconfig.references) {
			const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];
			if (refName) {
				const refPkg = `@cxl/${refName}`;
				if (!pkg.dependencies) pkg.dependencies = {};

				if (!pkg.dependencies[refName]) {
					const pkgVersion = (
						await readJson(`${baseDir}/${refName}/package.json`)
					)?.version;
					if (pkgVersion) pkg.dependencies[refPkg] = `~${pkgVersion}`;
				}
			}
		}

		const newPackage = JSON.stringify(pkg, null, '\t');

		if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
	},
};

function exists(filepath) {
	return fs.stat(filepath).catch(() => false);
}

const rules = [
	({ pkg }) =>
		requiredPackageFields.map(field =>
			Result(
				'package',
				field in pkg,
				`Field "${field}" required in package.json`
			)
		),

	({ pkg }) =>
		pkg.scripts
			? requiredPackageScripts.map(field =>
					Result(
						'package',
						field in pkg.scripts,
						`Script "${field}" required in package.json`
					)
			  )
			: [
					Result(
						'package',
						'scripts' in pkg,
						`Field "scripts" required in package.json`
					),
			  ],
	({ pkg, dir, rootPkg }) => [
		Result(
			'package',
			licenses.includes(pkg.license),
			`Valid license "${pkg.license}" required.`
		),
		Result(
			'package',
			!pkg.devDependencies,
			`Package should not have devDependencies.`
		),
		Result(
			'package',
			!pkg.peerDependencies,
			`Package should not have peerDependencies.`
		),
		Result(
			'package',
			!pkg.browser || pkg.browser === 'amd/index.min.js',
			`Package "browser" property should use minified amd version`
		),
		Result(
			'package',
			pkg.bugs === rootPkg.bugs,
			`Package "bugs" property must match root package`
		),
		Result(
			'package',
			pkg?.scripts?.test?.startsWith(
				`npm run build && cd ../dist/${dir} && node ../tester`
			),
			`Valid test script in package.json`
		),
	],

	async ({ projectPath }) =>
		Result(
			'tsconfig.test',
			await exists(`${projectPath}/tsconfig.test.json`),
			`Missing "tsconfig.test.json" file.`
		),

	async ({ projectPath }) =>
		Result(
			'test',
			(await exists(`${projectPath}/test.ts`)) ||
				(await exists(`${projectPath}/test.tsx`)),
			`Missing "test.ts" file.`
		),
	({ rootPkg, pkg }) => {
		const result = [];

		for (const name in pkg.dependencies) {
			const pkgValue = pkg.dependencies[name];
			const rootValue =
				rootPkg.devDependencies?.[name] || rootPkg.dependencies?.[name];
			result.push(
				Result(
					'dependencies',
					name.startsWith(rootPkg.name) || rootValue,
					`Dependency "${name}" must be included in root package.json`
				),
				Result(
					'dependencies',
					pkgValue !== '*',
					`Dependency "${name}" must be a valid version. pkg:${pkgValue}`
				),
				Result(
					'dependencies',
					name.startsWith(rootPkg.name) || rootValue === pkgValue,
					`Conflicting versions "${name}". root: ${rootValue}, dep: ${pkgValue}`
				)
			);
		}

		return result;
	},
	/*({ pkg, rootPkg }) => {
		const result = [];

		for (const name in pkg.peerDependencies) {
			const pkgValue = pkg.peerDependencies[name];

			result.push(
				Result(
					'peerDependencies',
					!name.startsWith(rootPkg.name),
					`Local package "${name}" should not be a peerDependency.`
				),
				Result(
					'peerDependencies',
					pkgValue !== '*',
					`Peer Dependency "${name}" must be a valid version. pkg:${pkgValue}`
				)
			);
		}

		return result;
	},*/
	async ({ projectPath, pkg }) => {
		const tsconfig = await readJson(`${projectPath}/tsconfig.json`);
		const result = [
			Result('tsconfig', tsconfig, 'tsconfig.json should be present'),
		];
		const references = tsconfig?.references;

		if (references)
			for (const ref of references) {
				const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];

				if (refName) {
					const refPkg = `@cxl/${refName}`;
					result.push(
						Result(
							'tsconfig.references',
							pkg.dependencies?.[refPkg],
							`reference ${refPkg} should be declared as dependency`
						)
					);
				}
			}

		return result;
	},
];

/*function pushDependencies(deps, results) {
	for (const name in deps) {
		if (dependencies[name] && dependencies[name] !== deps[name])
			results.push(
				Result(
					'dependencies',
					false,
					`Inconsistent dependency version "${name}"`
				)
			);
		else dependencies[name] = deps[name];
	}
}

async function verifyDependencies(results) {
	for (const name in dependencies) {

		results.push(
			Result(
				'dependencies',
				pkgValue,
				`Dependency "${name}" must be included in root package.json`
			),
			Result(
				'dependencies',
				pkgValue === dependencies[name],
				`Inconsistent dependency version "${name}". root: ${pkgValue}, dep: ${dependencies[name]}`
			)
		);
	}
}*/

async function verifyProject(dir, rootPkg) {
	const projectPath = `${baseDir}/${dir}`;
	const stat = await fs.stat(projectPath);

	if (!stat.isDirectory()) return [];

	const pkg = await readJson(`${projectPath}/package.json`);
	if (!pkg) return [];

	const data = { projectPath, dir, pkg, rootPkg, baseDir };
	const results = (await Promise.all(rules.map(rule => rule(data)))).flat();

	// Collect dependencies
	// if (pkg.dependencies) pushDependencies(pkg.dependencies, results);

	results.forEach(r => (r.data = data));

	return results;
}

program('verify', async ({ log }) => {
	function error(project, msg) {
		log(`${project}: ${msg}`);
	}

	const rootPkg = await readJson('package.json');

	const results = (
		await fs
			.readdir(baseDir)
			.then(all =>
				Promise.all(all.map(dir => verifyProject(dir, rootPkg)))
			)
	).flat();
	// await verifyDependencies(results);

	let hasErrors = false;
	const fixMap = new Map();

	for (const result of results) {
		if (!result.valid) {
			const id = `${result.data?.dir}:${result.id}`;
			hasErrors = true;
			error(result.data?.dir || 'root', result.message);

			if (fixes[result.id] && !fixMap.has(id))
				fixMap.set(id, fixes[result.id].bind(null, result.data));
		}
	}

	for (const [id, fix] of fixMap) {
		log(`${id}: Attempting fix`);
		await fix();
	}

	if (hasErrors) process.exitCode = 1;
})();
