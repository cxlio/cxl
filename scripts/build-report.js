const fs = require('fs').promises;
const path = require('path').posix;
const { readJson, sh } = require('../dist/server');
//const { sh } = require('../dist/build');

function writeIndex(content) {
	const INDEX = `
<!DOCTYPE html>
<html>
<head>
	<title>@cxl - Build Report</title>
	<script src="ui/index.bundle.min.js"></script>
	<script src="ui-table/amd/index.min.js"></script>
	<style>
		.failure { background-color: #FFCDD2; }
	</style>
</head>
<body>
	<cxl-application>
	<cxl-appbar><cxl-appbar-title>Build Report</cxl-appbar-title></cxl-appbar>
	<cxl-content>${content}</cxl-content>
	</cxl-application>
</body>
</html>
`;

	return fs.writeFile('dist/index.html', INDEX);
}

async function getTotalCoverage(dir, coverage) {
	const files = await getPackageFiles(dir);
	let total = 0;
	let count = 0;
	for (const cov of coverage) {
		const covPath = path.resolve(`dist/${dir}`, cov.url);
		if (files.includes(covPath)) {
			total += cov.blockCovered / cov.blockTotal;
			count++;
		}
	}

	return ((total / count) * 100).toFixed(2);
}

function parseNpmPack(output) {
	const files = /=== Tarball Contents ===([^]+)?npm notice ===/m
		.exec(output)[1]
		.trim()
		.replace(/npm notice /g, '')
		.split('\n');
	const packageSize = /package size:\s*([\d.]+)/;
	console.log(files);
}

function getTsconfig(dir) {
	return readJson(`${dir}/tsconfig.json`);
}

async function getPackageFiles(dir) {
	const files = (await getTsconfig(dir))?.files;
	if (!files) throw new Error(`No files for ${dir}`);
	return files.map(f => path.resolve(dir, f));
}

async function build() {
	const stats = await readJson('dist/stats.json');
	let output = '';

	for (const pkg of stats.packages) {
		const dir = /\/(.+)/.exec(pkg.name)[1];
		const coverage = await getTotalCoverage(dir, pkg.testReport.coverage);
		const success = coverage > 90;
		const usedBy = stats.packages.filter(
			p => p.package.dependencies?.[pkg.name]
		);
		// const pkgFiles = await sh(`npm pack ./dist/${dir} --dry-run`);
		// parseNpmPack(pkgFiles);
		output += `<cxl-tr class="${success ? 'success' : 'failure'}">
				<cxl-td><a href="../docs/${dir}">${pkg.name}</a></cxl-td>
				<cxl-td>${pkg.package.version}</cxl-td>
				<cxl-td>${usedBy.map(p => p.name).join('<br>')}</cxl-td>
				<cxl-td>${pkg.buildTime}</cxl-td>
				<cxl-td><a href="${dir}/test-report.html">${coverage} %</a></cxl-td>
			</cxl-tr>`;
	}
	await writeIndex(`
<cxl-table>
	<cxl-tr>
	<cxl-th>Package</cxl-th>
	<cxl-th>Version</cxl-th>
	<cxl-th>Used By</cxl-th>
	<cxl-th>Build Time</cxl-th>
	<cxl-th>Coverage</cxl-th>
	</cxl-tr>
	${output}
</cxl-table>`);
}

build();
