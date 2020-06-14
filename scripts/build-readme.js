const fs = require('fs').promises;
const path = require('path');

const HEADER = `
# cxl

Collection of Libraries and Tools

## Libraries

| Package Name   | Description                          | Links                                          |
| -------------- | ------------------------------------ | ---------------------------------------------- |
`;
const packages = [];

async function readPackage(dir) {
	const pkgPath = path.resolve(dir, './package.json');
	try {
		const stat = await fs.stat(pkgPath);
		const content = await fs.readFile(pkgPath, 'utf8');
		packages.push(JSON.parse(content));
	} catch (e) {}
}

function renderRow(pkg) {
	if (pkg.private || !pkg.description) return '';
	console.log(`Found project ${pkg.name}`);

	return `| ${pkg.name}        | ${pkg.description}       | ${
		pkg.home ? `[Docs](${pkg.home})` : ''
	} |`;
}

function render() {
	const content = HEADER + packages.map(renderRow).join('');
	fs.writeFile('README.md', content);
}

fs.readdir('.')
	.then(dirs => Promise.all(dirs.map(readPackage)))
	.then(render);
