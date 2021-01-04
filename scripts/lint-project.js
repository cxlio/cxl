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

function Result(id, valid, message, fix) {
	return { id, valid, message, fix };
}

async function fixDependencies({ projectPath, rootPkg }) {
	const pkgPath = `${projectPath}/package.json`;
	const pkg = await readJson(pkgPath);
	const oldPackage = JSON.stringify(pkg, null, '\t');

	for (const name in pkg.dependencies) {
		const rootValue =
			rootPkg.devDependencies?.[name] || rootPkg.dependencies?.[name];
		if (rootValue && pkg.dependencies[name] !== rootValue)
			pkg.dependencies[name] = rootValue;
	}

	const newPackage = JSON.stringify(pkg, null, '\t');

	if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
}

async function fixTsconfig({ projectPath, baseDir }) {
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
}

async function fixTest({ projectPath, dir }) {
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
}

function exists(filepath) {
	return fs.stat(filepath).catch(() => false);
}

function rule(valid, message) {
	return { valid, message };
}

async function fixPackage({ projectPath, dir, rootPkg }) {
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
}

function lintPackage({ pkg, dir, rootPkg }) {
	const rules = requiredPackageFields.map(field =>
		rule(field in pkg, `Field "${field}" required in package.json`)
	);

	if (pkg.scripts)
		rules.push(
			...requiredPackageScripts.map(field =>
				rule(
					field in pkg.scripts,
					`Script "${field}" required in package.json`
				)
			)
		);
	else
		rules.push(
			rule('scripts' in pkg, `Field "scripts" required in package.json`)
		);
	rules.push(
		rule(
			licenses.includes(pkg.license),
			`Valid license "${pkg.license}" required.`
		),
		rule(!pkg.devDependencies, `Package should not have devDependencies.`),
		rule(
			!pkg.peerDependencies,
			`Package should not have peerDependencies.`
		),
		rule(
			!pkg.browser || pkg.browser === 'amd/index.min.js',
			`Package "browser" property should use minified amd version`
		),
		rule(
			pkg.bugs === rootPkg.bugs,
			`Package "bugs" property must match root package`
		),
		rule(
			pkg?.scripts?.test?.startsWith(
				`npm run build && cd ../dist/${dir} && node ../tester`
			),
			`Valid test script in package.json`
		)
	);

	return {
		id: 'package',
		fix: fixPackage,
		rules,
	};
}

async function lintTest({ projectPath }) {
	return {
		id: 'test',
		fix: fixTest,
		rules: [
			rule(
				await exists(`${projectPath}/tsconfig.test.json`),
				`Missing "tsconfig.test.json" file.`
			),
			rule(
				(await exists(`${projectPath}/test.ts`)) ||
					(await exists(`${projectPath}/test.tsx`)),
				`Missing "test.ts" file.`
			),
		],
	};
}

function lintDependencies({ rootPkg, pkg }) {
	const rules = [];

	for (const name in pkg.dependencies) {
		const pkgValue = pkg.dependencies[name];
		const rootValue =
			rootPkg.devDependencies?.[name] || rootPkg.dependencies?.[name];

		rules.push(
			rule(
				name.startsWith(rootPkg.name) || rootValue,
				`Dependency "${name}" must be included in root package.json`
			),
			rule(
				pkgValue !== '*',
				`Dependency "${name}" must be a valid version. pkg:${pkgValue}`
			),
			rule(
				name.startsWith(rootPkg.name) || rootValue === pkgValue,
				`Conflicting versions "${name}". root: ${rootValue}, dep: ${pkgValue}`
			)
		);
	}

	return {
		id: 'dependencies',
		fix: fixDependencies,
		rules,
	};
}

async function lintTsconfig({ projectPath, pkg }) {
	const tsconfig = await readJson(`${projectPath}/tsconfig.json`);
	const rules = [rule(tsconfig, 'tsconfig.json should be present')];
	const references = tsconfig?.references;

	if (references)
		for (const ref of references) {
			const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];

			if (refName) {
				const refPkg = `@cxl/${refName}`;
				rules.push(
					rule(
						pkg.dependencies?.[refPkg],
						`reference ${refPkg} should be declared as dependency`
					)
				);
			}
		}

	return {
		id: 'tsconfig',
		fix: fixTsconfig,
		rules,
	};
}

const MATCH_REGEX = /(.+):(.+)/g;

async function lintImports({ dir }) {
	const result = cp.spawnSync('git', ['grep', `"from '\\.\\.\\/"`, dir], {
		shell: true,
		encoding: 'utf8',
	});
	const imports = result.stdout.trim();
	const violations = [];

	let match;
	while ((match = MATCH_REGEX.exec(imports))) {
		const [, file, line] = match;
		const newLine = line.replace(/'\.\.\/([^/]+)\/index\.js/, "'@cxl/$1");
		if (newLine !== line) {
			violations.push({ file, line, newLine });
			const contents = await fs.readFile(file, 'utf8');
			await fs.writeFile(file, contents.replace(line, newLine));
		}
	}

	return {
		id: 'imports',
		rules: [rule(violations.length === 0, 'Should not have local imports')],
		async fix() {
			for (const v of violations) {
				const contents = await fs.readFile(v.file, 'utf8');
				await fs.writeFile(v.file, contents.replace(v.line, v.newLine));
			}
		},
	};
}

const linters = [
	lintPackage,
	lintTest,
	lintDependencies,
	lintTsconfig,
	lintImports,
];

async function verifyProject(dir, rootPkg) {
	const projectPath = `${baseDir}/${dir}`;
	const stat = await fs.stat(projectPath);

	if (!stat.isDirectory()) return [];

	const pkg = await readJson(`${projectPath}/package.json`);
	if (!pkg) return [];

	const data = { projectPath, dir, pkg, rootPkg, baseDir };
	const results = (await Promise.all(linters.map(lint => lint(data)))).flat();

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

	let hasErrors = false;
	const fixes = [];
	for (const result of results) {
		for (const rule of result.rules) {
			if (!rule.valid) {
				hasErrors = true;
				error(result.data?.dir || 'root', rule.message);

				if (result.fix)
					fixes.push(() => {
						log(`${result.data?.dir}: Attempting fix`);
						result.fix(result.data);
					});
			}
		}
	}

	for (const fix of fixes) await fix();

	if (hasErrors) process.exitCode = 1;
})();
