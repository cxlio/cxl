import * as path from 'path';
import { promises as fs } from 'fs';
import * as cp from 'child_process';
import { program, readJson } from '@cxl/program';
import { Package } from '@cxl/build/npm.js';

interface LintData {
	projectPath: string;
	dir: string;
	pkg: Package;
	rootPkg: Package;
	baseDir: string;
}

interface Rule {
	valid: boolean;
	message: string;
}

interface ErrorResult extends Rule {
	project: string;
}

interface LinterResult {
	id: string;
	project: string;
	rules: Rule[];
	fix?: Fixer;
	valid?: boolean;
	data?: LintData;
	hasErrors?: boolean;
}

interface Tsconfig {
	references?: { path: string }[];
	extends?: string;
	compilerOptions?: Record<string, string>;
	files?: string[];
	include?: string[];
	exclude?: string[];
}

type Fixer = (data: LintData) => Promise<void>;
type Linter = (data: LintData) => Promise<LinterResult>;

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

async function fixDependencies({ projectPath, rootPkg }: LintData) {
	const pkgPath = `${projectPath}/package.json`;
	const pkg = await readJson<Package>(pkgPath);
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

async function fixTsconfig({ projectPath, baseDir, dir }: LintData) {
	const pkgPath = `${projectPath}/package.json`;
	const pkg = await readJson<Package>(pkgPath);
	let tsconfig = await readJson<Tsconfig | false>(
		`${projectPath}/tsconfig.json`,
		false,
	);
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
			JSON.stringify(tsconfig, null, '\t'),
		);
	}

	if (tsconfig.references)
		for (const ref of tsconfig.references) {
			const refName = /^\.\.\/([^/]+)/.exec(ref.path)?.[1];
			if (refName) {
				const refPkg = `@cxl/${refName}`;
				const pkgDep = (pkg[depProp] ||= {});

				if (!pkgDep?.[refName]) {
					const pkgVersion = (
						await readJson<Package | null>(
							`${baseDir}/${refName}/package.json`,
							null,
						)
					)?.version;
					if (pkgVersion && pkgDep) pkgDep[refPkg] = `~${pkgVersion}`;
				}

				if (pkg[notDepProp]?.[refName])
					delete pkg[notDepProp]?.[refName];
			}
		}

	const newPackage = JSON.stringify(pkg, null, '\t');

	if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
}

async function fixTest({ projectPath, dir }: LintData) {
	const path = `${projectPath}/tsconfig.test.json`;
	const testPath = `${projectPath}/test.ts`;

	if (!(await exists(path))) {
		await fs.writeFile(
			path,
			`{
	"extends": "./tsconfig.json",
	"compilerOptions": {
		"outDir": "../dist/${dir}"
	},
	"files": ["test.ts"],
	"references": [{ "path": "." }, { "path": "../spec" }]
}
`,
		);
	}

	const tsconfig =
		(await readJson<Tsconfig | null>(
			`${projectPath}/tsconfig.test.json`,
			null,
		)) || {};

	if (!tsconfig.extends || tsconfig.extends !== './tsconfig.json') {
		tsconfig.extends = './tsconfig.json';
		await fs.writeFile(
			`${projectPath}/tsconfig.test.json`,
			JSON.stringify(tsconfig, null, '\t'),
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
`,
		);
	}
}

function exists(filepath: string) {
	return fs.stat(filepath).catch(() => false);
}

function rule(valid: boolean, message: string): Rule {
	return { valid, message };
}

async function fixPackage({ projectPath, dir, rootPkg }: LintData) {
	const pkgPath = `${projectPath}/package.json`;
	const pkg = await readJson<Package>(pkgPath);
	const oldPackage = JSON.stringify(pkg, null, '\t');

	const isMjs = pkg.type === 'module';
	const builder = rootPkg.devDependencies?.['@cxl/build']
		? 'cxl-build'
		: 'node ../dist/build';
	const tester = rootPkg.devDependencies?.['@cxl/tester']
		? 'cxl-tester'
		: 'node ../tester';
	const testScript = `npm run build && cd ../dist/${dir} && ${tester} ${
		isMjs ? '--mjs ' : ''
	}${pkg.browser ? `--baselinePath=../../${dir}/spec` : '--node'}`;
	const tsconfigBundle = await readJson(
		`${projectPath}/tsconfig.bundle.json`,
		false,
	);
	const browser = tsconfigBundle ? 'index.bundle.min.js' : 'amd/index.js';

	if (!(pkg.name === `${rootPkg.name}${dir}`))
		pkg.name = `${rootPkg.name}${dir}`;
	if (!pkg.scripts) pkg.scripts = {};
	if (!pkg.scripts.test) pkg.scripts.test = testScript;
	if (!pkg.scripts.build) pkg.scripts.build = builder;
	if (!pkg.homepage) pkg.homepage = `${rootPkg.homepage}/${dir}`;

	if (!pkg.license) pkg.license = 'GPL-3.0';
	if (!pkg.bugs || pkg.bugs !== rootPkg.bugs)
		pkg.bugs = rootPkg.bugs || BugsUrl;
	if (!pkg.browser && pkg.devDependencies) delete pkg.devDependencies;
	if (pkg.browser && pkg.dependencies) delete pkg.dependencies;
	if (pkg.peerDependencies) delete pkg.peerDependencies;
	if (pkg.browser) pkg.browser = browser;
	if (!pkg.repository && rootPkg.repository) {
		if (typeof rootPkg.repository === 'string')
			rootPkg.repository = { type: 'git', url: rootPkg.repository };
		pkg.repository = {
			...rootPkg.repository,
			directory: dir,
		};
	}

	if (pkg.scripts.test !== testScript) pkg.scripts.test = testScript;

	const newPackage = JSON.stringify(pkg, null, '\t');

	if (oldPackage !== newPackage) await fs.writeFile(pkgPath, newPackage);
}

async function lintTsconfigBundle({ dir, projectPath, pkg }: LintData) {
	const tsconfig = await readJson(
		`${projectPath}/tsconfig.bundle.json`,
		false,
	);

	if (!tsconfig)
		return {
			id: 'tsconfig.bundle',
			project: dir,
			rules: [],
		};

	return {
		id: 'tsconfig.bundle',
		project: dir,
		rules: [
			rule(
				!pkg.browser || pkg.browser === 'index.bundle.min.js',
				`Package "browser" property should use minified bundle version`,
			),
		],
	};
}

async function lintPackage({ projectPath, pkg, dir, rootPkg }: LintData) {
	const rules = requiredPackageFields.map(field =>
		rule(field in pkg, `Field "${field}" required in package.json`),
	);

	const tsconfigBundle = await readJson(
		`${projectPath}/tsconfig.bundle.json`,
		false,
	);
	const browser = tsconfigBundle ? 'index.bundle.min.js' : 'amd/index.js';

	if (pkg.scripts) {
		const scripts = pkg.scripts;
		rules.push(
			...requiredPackageScripts.map(field =>
				rule(
					field in scripts,
					`Script "${field}" required in package.json`,
				),
			),
		);
	} else
		rules.push(
			rule('scripts' in pkg, `Field "scripts" required in package.json`),
		);

	const isMjs = pkg.type === 'module';
	const tester = rootPkg.devDependencies?.['@cxl/tester']
		? 'cxl-tester'
		: 'node ../tester';
	const testScript = `npm run build && cd ../dist/${dir} && ${tester} ${
		isMjs ? '--mjs ' : ''
	}${pkg.browser ? `--baselinePath=../../${dir}/spec` : '--node'}`;

	rules.push(
		rule(
			pkg.name === `${rootPkg.name}${dir}`,
			`Package name should be valid.`,
		),
		rule(
			licenses.includes(pkg.license),
			`"${pkg.license}" is not a valid license.`,
		),
		rule(
			!!pkg.browser || !pkg.devDependencies,
			`Package should not have devDependencies.`,
		),
		rule(
			!pkg.browser || !pkg.dependencies,
			`Browser package should only have devDependencies.`,
		),
		rule(
			!pkg.peerDependencies,
			`Package should not have peerDependencies.`,
		),
		rule(
			!pkg.browser || pkg.browser === browser,
			`Package "browser" property should use amd script`,
		),
		rule(
			pkg.bugs === rootPkg.bugs,
			`Package "bugs" property must match root package`,
		),
		rule(
			pkg?.scripts?.test === testScript,
			`Valid test script in package.json`,
		),
		rule(!!pkg.repository, 'Package "repository" field must be set'),
		rule(
			typeof pkg.repository !== 'string',
			'"repository" must be an object',
		),
	);

	return {
		id: 'package',
		project: dir,
		fix: fixPackage,
		rules,
	};
}

async function lintTest({ projectPath }: LintData) {
	const tsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.test.json`,
	);

	return {
		id: 'test',
		fix: fixTest,
		project: projectPath,
		rules: [
			rule(
				!!(await exists(`${projectPath}/tsconfig.test.json`)),
				`Missing "tsconfig.test.json" file.`,
			),
			rule(
				tsconfig?.extends === './tsconfig.json',
				'tsconfig.test.json extends should match base tsconfig.json',
			),
			rule(
				!!(
					(await exists(`${projectPath}/test.ts`)) ||
					(await exists(`${projectPath}/test.tsx`))
				),
				`Missing "test.ts" file.`,
			),
		],
	};
}

async function lintDependencies({ dir, rootPkg, pkg }: LintData) {
	const rules = [];

	for (const name in pkg.dependencies) {
		const pkgValue = pkg.dependencies[name];
		const rootValue =
			rootPkg.devDependencies?.[name] || rootPkg.dependencies?.[name];

		rules.push(
			rule(
				!!(name.startsWith(rootPkg.name) || rootValue),
				`Dependency "${name}" must be included in root package.json`,
			),
			rule(
				pkgValue !== '*',
				`Dependency "${name}" must be a valid version. pkg:${pkgValue}`,
			),
			rule(
				name.startsWith(rootPkg.name) || rootValue === pkgValue,
				`Conflicting versions "${name}". root: ${rootValue}, dep: ${pkgValue}`,
			),
		);
	}

	return {
		id: 'dependencies',
		project: dir,
		fix: fixDependencies,
		rules,
	};
}

async function lintTsconfig({ projectPath, pkg, dir }: LintData) {
	const tsconfig = await readJson<Tsconfig | null>(
		`${projectPath}/tsconfig.json`,
		null,
	);
	const rules = [
		rule(!!tsconfig, 'tsconfig.json should be present'),
		rule(
			!!tsconfig?.compilerOptions,
			'tsconfig.json should have compilerOptions',
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}`,
			'tsconfig.json should have a valid outDir compiler option',
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
						!!pkg[depProp]?.[refPkg],
						`reference ${refPkg} should be declared as ${depProp}`,
					),
				);
			}
		}

	return {
		id: 'tsconfig',
		project: dir,
		fix: fixTsconfig,
		rules,
	};
}

async function fixTsconfigMjs({ projectPath, dir, pkg }: LintData) {
	if (!pkg.browser) return;

	const baseTsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.json`,
	);
	const tsconfig =
		(await readJson<Tsconfig | null>(
			`${projectPath}/tsconfig.mjs.json`,
			null,
		)) || {};
	const outDir = `../dist/${dir}/mjs`;

	if (!tsconfig.extends || tsconfig.extends !== './tsconfig.json')
		tsconfig.extends = './tsconfig.json';
	if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
	if (tsconfig.compilerOptions.module !== 'ESNext')
		tsconfig.compilerOptions.module = 'ESNext';
	if (tsconfig.compilerOptions.outDir !== outDir)
		tsconfig.compilerOptions.outDir = outDir;
	tsconfig.files = baseTsconfig.files;
	tsconfig.references = checkTsReferences(baseTsconfig, 'mjs');

	await fs.writeFile(
		`${projectPath}/tsconfig.mjs.json`,
		JSON.stringify(tsconfig, null, '\t'),
	);
}

async function fixTsconfigAmd({ projectPath, dir, pkg }: LintData) {
	if (!pkg.browser) return;

	const baseTsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.json`,
	);
	const tsconfig =
		(await readJson<Tsconfig | null>(
			`${projectPath}/tsconfig.amd.json`,
			null,
		)) || {};
	const outDir = `../dist/${dir}/amd`;

	if (!tsconfig.extends || tsconfig.extends !== './tsconfig.json')
		tsconfig.extends = './tsconfig.json';
	if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
	if (tsconfig.compilerOptions.module !== 'amd')
		tsconfig.compilerOptions.module = 'amd';
	if (tsconfig.compilerOptions.outDir !== outDir)
		tsconfig.compilerOptions.outDir = outDir;
	tsconfig.files = baseTsconfig.files;
	tsconfig.include = baseTsconfig.include;
	tsconfig.exclude = baseTsconfig.exclude;
	tsconfig.references = checkTsReferences(baseTsconfig, 'amd');

	await fs.writeFile(
		`${projectPath}/tsconfig.amd.json`,
		JSON.stringify(tsconfig, null, '\t'),
	);
}

async function lintTsconfigEs6({ projectPath, pkg, dir }: LintData) {
	if (!pkg.browser)
		return {
			id: 'tsconfig.es6',
			project: dir,
			rules: [],
		};

	const tsconfig = await readJson<Tsconfig | null>(
		`${projectPath}/tsconfig.mjs.json`,
		null,
	);
	if (!tsconfig)
		return {
			id: 'tsconfig.es6',
			project: dir,
			rules: [],
		};
	const baseTsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.json`,
	);
	const references = tsconfig?.references;
	const expectedReferences = baseTsconfig.references?.map(
		(ref: { path: string }) => {
			const refName = /^\.\.\/[^/]+/.exec(ref.path)?.[0];
			return { path: `${refName}/tsconfig.mjs.json` };
		},
	);
	const rules = [
		rule(!!tsconfig, 'tsconfig.mjs.json should be present'),
		rule(
			tsconfig?.extends === './tsconfig.json',
			'tsconfig.mjs.json extends should match base tsconfig.json',
		),
		rule(
			!!tsconfig?.compilerOptions,
			'tsconfig.mjs.json should have compilerOptions',
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}/mjs`,
			'tsconfig.mjs.json should have a valid outDir compiler option',
		),
		rule(
			tsconfig?.compilerOptions?.module === 'ESNext',
			'tsconfig.mjs.json should have a module set as ESNext',
		),
		rule(
			tsconfig?.files?.join('|') === baseTsconfig.files?.join('|'),
			'tsconfig.mjs.json files should match base tsconfig.json',
		),
		rule(
			!baseTsconfig.references || !!references,
			'tsconfig.mjs.json should have references if base tsconfig.json has them',
		),
		rule(
			!expectedReferences ||
				JSON.stringify(references) ===
					JSON.stringify(expectedReferences),
			'tsconfig.mjs.json should match base tsconfig references',
		),
	];

	return {
		id: 'tsconfig.mjs',
		project: dir,
		fix: fixTsconfigMjs,
		rules,
	};
}

function checkTsReferences(baseTsconfig: Tsconfig, mod: string) {
	return baseTsconfig.references?.map((ref: { path: string }) => {
		const refName = ref.path.replace(/\/.tsconfig.json$/, '');
		return { path: `${refName}/tsconfig.${mod}.json` };
	});
}

async function lintTsconfigAmd({ projectPath, pkg, dir }: LintData) {
	if (!pkg.browser)
		return {
			id: 'tsconfig.amd',
			project: dir,
			rules: [],
		};

	const tsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.amd.json`,
	);
	const baseTsconfig = await readJson<Tsconfig>(
		`${projectPath}/tsconfig.json`,
	);
	const references = tsconfig?.references;
	const expectedReferences = checkTsReferences(baseTsconfig, 'amd');

	const rules = [
		rule(!!tsconfig, 'tsconfig.amd.json should be present'),
		rule(
			tsconfig?.extends === './tsconfig.json',
			'tsconfig.amd.json extends should extends base tsconfig.json',
		),
		rule(
			!!tsconfig?.compilerOptions,
			'tsconfig.amd.json should have compilerOptions',
		),
		rule(
			tsconfig?.compilerOptions?.outDir === `../dist/${dir}/amd`,
			`tsconfig.amd.json should have a valid outDir compiler option ("../dist/${dir}/amd")`,
		),
		rule(
			tsconfig?.compilerOptions?.module === 'amd',
			'tsconfig.amd.json should have a module set as amd',
		),
		rule(
			tsconfig?.files?.join('|') === baseTsconfig.files?.join('|'),
			'tsconfig.amd.json files should match base tsconfig.json',
		),
		rule(
			tsconfig?.include?.join('|') === baseTsconfig.include?.join('|'),
			'tsconfig.amd.json "include" should match base tsconfig.json',
		),
		rule(
			tsconfig?.exclude?.join('|') === baseTsconfig.exclude?.join('|'),
			'tsconfig.amd.json "exclude" should match base tsconfig.json',
		),
		rule(
			!baseTsconfig.references || !!references,
			'tsconfig.amd.json should have references if base tsconfig.json has them',
		),
		rule(
			!expectedReferences ||
				JSON.stringify(references) ===
					JSON.stringify(expectedReferences),
			'tsconfig.amd.json should match base tsconfig references',
		),
	];

	return {
		id: 'tsconfig.amd',
		project: dir,
		fix: fixTsconfigAmd,
		rules,
	};
}

const MATCH_REGEX = /(.+):(.+)/g;

async function lintImports({ dir }: LintData) {
	const result = cp.spawnSync('git', ['grep', `"from '\\.\\.\\/"`, dir], {
		shell: true,
		encoding: 'utf8',
	});
	const imports = result.stdout.trim();
	const violations: { file: string; line: string; newLine: string }[] = [];

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
		project: dir,
		rules: [rule(violations.length === 0, 'Should not have local imports')],
		async fix() {
			for (const v of violations) {
				const contents = await fs.readFile(v.file, 'utf8');
				await fs.writeFile(v.file, contents.replace(v.line, v.newLine));
			}
		},
	};
}

const linters: Linter[] = [
	lintPackage,
	lintTest,
	lintDependencies,
	lintTsconfig,
	lintImports,
	lintTsconfigAmd,
	lintTsconfigEs6,
	lintTsconfigBundle,
];

async function verifyProject(dir: string, rootPkg: Package) {
	const projectPath = `${baseDir}/${dir}`;
	const stat = await fs.stat(projectPath);

	if (!stat.isDirectory()) return [];

	const pkg = await readJson<Package | false>(
		`${projectPath}/package.json`,
		false,
	);
	if (!pkg) return [];

	const data: LintData = { projectPath, dir, pkg, rootPkg, baseDir };
	const results = (await Promise.all(linters.map(lint => lint(data)))).flat();

	results.forEach(r => (r.data = data));

	return results;
}

export async function lint(projects: string[], rootPkg: Package) {
	const results = (
		await Promise.all(projects.map(dir => verifyProject(dir, rootPkg)))
	).flat();

	const fixes: (() => Promise<void>)[] = [];
	const errors: ErrorResult[] = [];

	for (const result of results) {
		for (const rule of result.rules) {
			if (!rule.valid) {
				result.hasErrors = true;
				errors.push({ ...rule, project: result.project });
			}
		}
		if (result.hasErrors && result.fix && result.data) {
			const { data, fix } = result;
			fixes.push(() => fix(data));
		}
	}

	return { results, fixes, errors };
}

export default program('verify', async ({ log }) => {
	cp.execSync('npm run build --prefix build');

	function error(project: string, msg: string) {
		log(`${project}: ${msg}`);
	}

	const rootPkg = await readJson<Package>('package.json');

	const results = (
		await fs
			.readdir(baseDir)
			.then(all =>
				Promise.all(all.map(dir => verifyProject(dir, rootPkg))),
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
		if (result.hasErrors && result.fix && result.data) {
			const { data, fix } = result;
			fixes.push(() => {
				log(`${result.data?.dir}: Attempting fix for "${result.id}"`);
				return fix(data);
			});
		}
	}

	for (const fix of fixes) await fix();

	if (hasErrors) process.exitCode = 1;
});
