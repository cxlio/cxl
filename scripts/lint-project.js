/**
 * Verify project structure
 */
const path = require('path');
const fs = require('fs').promises;
const cp = require('child_process');

cp.execSync('npm run build --prefix build', 'utf8');

const { program, readJson } = require('../dist/program');

const BugsUrl = 'https://github.com/cxlio/cxl/issues';

const baseDir = path.resolve('.');
const requiredPackageFields = [
	'name',
	'version',
	'description',
	'license',
	'homepage',
	'bugs',
];
const requiredPackageScripts = ['build', 'test'];
const licenses = ['GPL-3.0', 'GPL-3.0-only', 'Apache-2.0', 'UNLICENSED'];
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

async function fixTsconfig({ projectPath, baseDir, dir }) {
	const pkgPath = `${projectPath}/package.json`;
	const pkg = await readJson(pkgPath);
	let tsconfig = await readJson(`${projectPath}/tsconfig.json`);
	const oldPackage = JSON.stringify(pkg, null, '\t');
	const depProp = pkg.browser ? 'devDependencies' : 'dependencies';
	const notDepProp = pkg.browser ? 'dependencies' : 'devDependencies';

	if (!tsconfig) {
		tsconfig = {
			extends: '../tsconfig.json',
			compilerOptions: {
				outDir: `../dist/${dir}`,
			},
			files: [],
			references: [],
		};
		await fs.writeFile(
			`${projectPath}/tsconfig.json`,
			JSON.stringify(tsconfig, null, '\t')
		);
	}

	for (const ref of tsconfig.references) {
		const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];
		if (refName) {
			const refPkg = `@cxl/${refName}`;
			if (!pkg[depProp]) pkg[depProp] = {};

			if (!pkg[depProp][refName]) {
				const pkgVersion = (
					await readJson(`${baseDir}/${refName}/package.json`)
				)?.version;
				if (pkgVersion) pkg[depProp][refPkg] = `~${pkgVersion}`;
			}

			if (pkg[notDepProp]?.[refName])
				pkg[notDepProp][refName] = undefined;
		}
	}

	const newPackage = JSON.stringify(pkg, null, '\t');

	if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
}

async function fixTest({ projectPath, dir }) {
	const path = `${projectPath}/tsconfig.test.json`;
	const testPath = `${projectPath}/test.ts`;

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

	if (!(await exists(testPath))) {
		await fs.writeFile(
			testPath,
			`import { spec } from '@cxl/spec';
import {  } from './index.js';

export default spec('${dir}', s => {
	s.test('should load', a => {
		a.ok(get);
	});
});
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
	const testScript = `npm run build && cd ../dist/${dir} && node ../tester ${
		pkg.browser ? `--baselinePath=../../${dir}/spec` : '--node'
	}`;

	const tsconfigBundle = await readJson(
		`${projectPath}/tsconfig.bundle.json`
	);
	const browser = tsconfigBundle ? 'index.bundle.min.js' : 'amd/index.min.js';

	if (!(pkg.name === `${rootPkg.name}${dir}`))
		pkg.name = `${rootPkg.name}${dir}`;
	if (!pkg.scripts) pkg.scripts = {};
	if (!pkg.scripts.test) pkg.scripts.test = testScript;
	if (!pkg.scripts.build) pkg.scripts.build = `node ../dist/build`;
	if (!pkg.homepage) pkg.homepage = `${rootPkg.homepage}/${dir}`;

	if (!pkg.license) pkg.license = 'GPL-3.0';
	if (!pkg.bugs) pkg.bugs = rootPkg.bugs || BugsUrl;
	if (!pkg.browser && pkg.devDependencies) delete pkg.devDependencies;
	if (pkg.browser && pkg.dependencies) delete pkg.dependencies;
	if (pkg.peerDependencies) delete pkg.peerDependencies;
	if (pkg.browser) pkg.browser = browser;
	if (!pkg.repository && rootPkg.repository)
		pkg.repository = {
			...rootPkg.repository,
			directory: dir,
		};

	if (!pkg.scripts.test !== testScript) {
		/*
		const testerArgs =
			/node \.\.\/tester(\s+.+)/.exec(pkg.scripts.test)?.[1] || '';
		pkg.scripts.test = `${testScript}${testerArgs}`;*/
		pkg.scripts.test = testScript;
	}

	const newPackage = JSON.stringify(pkg, null, '\t');

	if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
}

async function lintTsconfigBundle({ projectPath, pkg }) {
	const tsconfig = await readJson(`${projectPath}/tsconfig.bundle.json`);

	if (!tsconfig)
		return {
			id: 'tsconfig.bundle',
			rules: [],
		};

	return {
		id: 'tsconfig.bundle',
		rules: [
			rule(
				!pkg.browser || pkg.browser === 'index.bundle.min.js',
				`Package "browser" property should use minified bundle version`
			),
		],
	};
}

async function lintPackage({ projectPath, pkg, dir, rootPkg }) {
	const rules = requiredPackageFields.map(field =>
		rule(field in pkg, `Field "${field}" required in package.json`)
	);

	const tsconfigBundle = await readJson(
		`${projectPath}/tsconfig.bundle.json`
	);
	const browser = tsconfigBundle ? 'index.bundle.min.js' : 'amd/index.min.js';

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

	const testScript = `npm run build && cd ../dist/${dir} && node ../tester ${
		pkg.browser ? `--baselinePath=../../${dir}/spec` : '--node'
	}`;

	rules.push(
		rule(
			pkg.name === `${rootPkg.name}${dir}`,
			`Package name should be valid.`
		),
		rule(
			licenses.includes(pkg.license),
			`"${pkg.license}" is not a valid license.`
		),
		rule(
			pkg.browser || !pkg.devDependencies,
			`Package should not have devDependencies.`
		),
		rule(
			!pkg.browser || !pkg.dependencies,
			`Browser package should only have devDependencies.`
		),
		rule(
			!pkg.peerDependencies,
			`Package should not have peerDependencies.`
		),
		rule(
			!pkg.browser || pkg.browser === browser,
			`Package "browser" property should use minified amd version`
		),
		rule(
			pkg.bugs === rootPkg.bugs,
			`Package "bugs" property must match root package`
		),
		rule(
			pkg?.scripts?.test === testScript,
			`Valid test script in package.json`
		),
		rule(!!pkg.repository, 'Package "repository" field must be set')
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

async function lintTsconfig({ projectPath, pkg, dir }) {
	const tsconfig = await readJson(`${projectPath}/tsconfig.json`);
	const rules = [
		rule(tsconfig, 'tsconfig.json should be present'),
		rule(
			tsconfig?.compilerOptions,
			'tsconfig.json should have compilerOptions'
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}`,
			'tsconfig.json should have a valid outDir compiler option'
		),
	];
	const references = tsconfig?.references;
	const depProp = pkg.browser ? 'devDependencies' : 'dependencies';

	if (references)
		for (const ref of references) {
			const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];

			if (refName) {
				const refPkg = `@cxl/${refName}`;
				rules.push(
					rule(
						pkg[depProp]?.[refPkg],
						`reference ${refPkg} should be declared as ${depProp}`
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

async function fixTsconfigMjs({ projectPath, baseDir, dir, pkg }) {
	if (!pkg.browser) return;

	const baseTsconfig = await readJson(`${projectPath}/tsconfig.json`);
	let tsconfig = (await readJson(`${projectPath}/tsconfig.mjs.json`)) || {};
	const outDir = `../dist/${dir}/mjs`;

	if (!tsconfig.extends) tsconfig.extends = '../tsconfig.json';
	if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
	if (tsconfig.compilerOptions.module !== 'ESNext')
		tsconfig.compilerOptions.module = 'ESNext';
	if (tsconfig.compilerOptions.outDir !== outDir)
		tsconfig.compilerOptions.outDir = outDir;
	tsconfig.files = baseTsconfig.files;

	tsconfig.references = baseTsconfig.references?.map(ref => {
		const refName = /^\.\.\/[^/]+/.exec(ref.path)?.[0];
		return { path: `${refName}/tsconfig.mjs.json` };
	});

	await fs.writeFile(
		`${projectPath}/tsconfig.mjs.json`,
		JSON.stringify(tsconfig, null, '\t')
	);
}

async function fixTsconfigAmd({ projectPath, baseDir, dir, pkg }) {
	if (!pkg.browser) return;

	const baseTsconfig = await readJson(`${projectPath}/tsconfig.json`);
	let tsconfig = (await readJson(`${projectPath}/tsconfig.amd.json`)) || {};
	const outDir = `../dist/${dir}/amd`;

	if (!tsconfig.extends) tsconfig.extends = '../tsconfig.json';
	if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
	if (tsconfig.compilerOptions.module !== 'amd')
		tsconfig.compilerOptions.module = 'amd';
	if (tsconfig.compilerOptions.outDir !== outDir)
		tsconfig.compilerOptions.outDir = outDir;
	tsconfig.files = baseTsconfig.files;
	tsconfig.include = baseTsconfig.include;
	tsconfig.exclude = baseTsconfig.exclude;

	tsconfig.references = baseTsconfig.references?.map(ref => {
		const refName = /^\.\.\/[^/]+/.exec(ref.path)?.[0];
		return { path: `${refName}/tsconfig.amd.json` };
	});

	await fs.writeFile(
		`${projectPath}/tsconfig.amd.json`,
		JSON.stringify(tsconfig, null, '\t')
	);
}

async function lintTsconfigEs6({ projectPath, pkg, dir }) {
	if (!pkg.browser)
		return {
			id: 'tsconfig.es6',
			rules: [],
		};

	const tsconfig = await readJson(`${projectPath}/tsconfig.mjs.json`);
	const baseTsconfig = await readJson(`${projectPath}/tsconfig.json`);
	const references = tsconfig?.references;
	const expectedReferences = baseTsconfig.references?.map(ref => {
		const refName = /^\.\.\/[^/]+/.exec(ref.path)?.[0];
		return { path: `${refName}/tsconfig.mjs.json` };
	});
	const rules = [
		rule(tsconfig, 'tsconfig.mjs.json should be present'),
		rule(
			tsconfig?.compilerOptions,
			'tsconfig.mjs.json should have compilerOptions'
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}/mjs`,
			'tsconfig.mjs.json should have a valid outDir compiler option'
		),
		rule(
			tsconfig?.compilerOptions?.module === 'ESNext',
			'tsconfig.mjs.json should have a module set as ESNext'
		),
		rule(
			tsconfig?.files?.join('|') === baseTsconfig.files?.join('|'),
			'tsconfig.mjs.json files should match base tsconfig.json'
		),
		rule(
			!baseTsconfig.references || references,
			'tsconfig.mjs.json should have references if base tsconfig.json has them'
		),
		rule(
			!expectedReferences ||
				JSON.stringify(references) ===
					JSON.stringify(expectedReferences),
			'tsconfig.mjs.json should match base tsconfig references'
		),
	];

	return {
		id: 'tsconfig.mjs',
		fix: fixTsconfigMjs,
		rules,
	};
}

async function lintTsconfigAmd({ projectPath, pkg, dir }) {
	if (!pkg.browser)
		return {
			id: 'tsconfig.amd',
			rules: [],
		};

	const tsconfig = await readJson(`${projectPath}/tsconfig.amd.json`);
	const baseTsconfig = await readJson(`${projectPath}/tsconfig.json`);
	const references = tsconfig?.references;
	const expectedReferences = baseTsconfig.references?.map(ref => {
		const refName = /^\.\.\/[^/]+/.exec(ref.path)?.[0];
		return { path: `${refName}/tsconfig.amd.json` };
	});

	const rules = [
		rule(tsconfig, 'tsconfig.amd.json should be present'),
		rule(
			tsconfig?.compilerOptions,
			'tsconfig.amd.json should have compilerOptions'
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}/amd`,
			'tsconfig.amd.json should have a valid outDir compiler option'
		),
		rule(
			tsconfig?.compilerOptions?.module === 'amd',
			'tsconfig.amd.json should have a module set as amd'
		),
		rule(
			tsconfig?.files?.join('|') === baseTsconfig.files?.join('|'),
			'tsconfig.amd.json files should match base tsconfig.json'
		),
		rule(
			tsconfig?.include?.join('|') === baseTsconfig.include?.join('|'),
			'tsconfig.amd.json "include" should match base tsconfig.json'
		),
		rule(
			tsconfig?.exclude?.join('|') === baseTsconfig.exclude?.join('|'),
			'tsconfig.amd.json "exclude" should match base tsconfig.json'
		),
		rule(
			!baseTsconfig.references || references,
			'tsconfig.amd.json should have references if base tsconfig.json has them'
		),
		rule(
			!expectedReferences ||
				JSON.stringify(references) ===
					JSON.stringify(expectedReferences),
			'tsconfig.amd.json should match base tsconfig references'
		),
	];

	return {
		id: 'tsconfig.amd',
		fix: fixTsconfigAmd,
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
	lintTsconfigAmd,
	lintTsconfigEs6,
	lintTsconfigBundle,
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
				result.hasErrors = hasErrors = true;
				error(result.data?.dir || 'root', rule.message);
			}
		}
		if (result.hasErrors && result.fix)
			fixes.push(() => {
				log(`${result.data?.dir}: Attempting fix for "${result.id}"`);
				result.fix(result.data);
			});
	}

	for (const fix of fixes) await fix();

	if (hasErrors) process.exitCode = 1;
})();
