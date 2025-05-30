/*const fs = require('fs').promises;
const path = require('path');
const cp = require('child_process');
const { sh } = require('../dist/build');

const HEADER = `# cxl

Collection of Libraries and Tools

## Libraries

| Package Name   | Version | License | Description                          | Links                                          |
| -------------- | ------- | ------- | ------------------------------------ | ---------------------------------------------- |
`;
const packages = [];

async function readPackage(dir) {
	const folder = path.join('.', dir);
	const pkgPath = path.resolve(folder, './package.json');
	try {
		const stat = await fs.stat(pkgPath);
	} catch (e) {
		return;
	}

	const content = await fs.readFile(pkgPath, 'utf8');
	const pkg = JSON.parse(content);

	if (pkg.private) return;

	const valid = pkg.description && pkg.license;

	if (!valid) throw new Error(`Invalid package: ${pkg.name}`);

	if (!pkg.homepage)
		pkg.homepage = `https://cxlio.github.io/${pkg.name.slice(1)}`;

	return pkg;
}

function exec(cmd, options = {}) {
	return new Promise((resolve, reject) =>
		cp.exec(cmd, { encoding: 'utf8', ...options }, (err, out) => {
			if (err) reject(err.message);
			else resolve(out.trim());
		}),
	);
}

function getPublishedVersion(pkgName, version) {
	return exec(
		`npm show ${pkgName}${version ? '@' + version : ''} version`,
	).catch(() => '');
}

function npmLink(pkgName, version) {
	return `https://npmjs.com/package/${pkgName}/v/${version}`;
}

function readIfExists(file) {
	return fs.readFile(file).catch(() => '');
}

function write(file, content) {
	console.log(`Writing ${file}`);
	if (!content) throw new Error('No content');
	return fs.writeFile(file, content);
}

async function renderPackage(dir) {
	const pkg = await readPackage(dir);

	if (!pkg) return '';

	console.log(`Building docs for ${dir}`);
	await sh(`node ../dist/docgen --clean -o ../docs/${dir} --summary`, {
		cwd: dir,
		stdio: 'ignore',
	});

	const latestVersion = await getPublishedVersion(pkg.name);
	const version = latestVersion
		? `[${latestVersion}](${npmLink(pkg.name, latestVersion)})`
		: `${pkg.version}`;

	return `| ${pkg.name.padEnd(20)} | ${version} | ${pkg.license.padEnd(
		10,
	)} | ${pkg.description} | ${
		pkg.homepage ? `[Docs](${pkg.homepage}/${pkg.version})` : ''
	} |\n`;
}

function render(rows) {
	const content = HEADER + rows.join('');
	return write('README.md', content);
}

module.exports = fs
	.readdir('.')
	.then(async dirs => {
		const result = [];
		for (const dir of dirs) result.push(await renderPackage(dir));
		return result;
	})
	.then(render)
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
*/
