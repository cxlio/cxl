const fs = require('fs').promises;
const path = require('path').posix;
const { readJson, sh } = require('../dist/server');

async function writeIndex(content) {
	const [INDEX] = await Promise.all([
		fs.readFile(__dirname + '/build-report.html', 'utf8'),
	]);

	return fs.writeFile('dist/index.html', INDEX.replace('$HOME$', content));
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

async function getNPMVersion(name) {
	try {
		return (
			await sh(`npm show ${name} version`, {
				encoding: 'utf8',
			})
		).trim();
	} catch (e) {
		return;
	}
}

async function getScriptSize(dir, pkg) {
	const main = pkg.browser || pkg.main || 'index.js';
	const scriptPath = `dist/${dir}/${main}`;
	const stat = await fs.stat(scriptPath);
	return `${main}: ${stat.size}`;
}

async function build() {
	const stats = await readJson('dist/stats.json');
	let output = '';

	for (const pkg of stats.packages) {
		const dir = /\/(.+)/.exec(pkg.name)[1];
		const [npmVersion, coverage, size] = await Promise.all([
			'', //getNPMVersion(pkg.name),
			getTotalCoverage(dir, pkg.testReport.coverage),
			getScriptSize(dir, pkg.package),
		]);
		const success = coverage > 90;
		const usedBy = stats.packages.filter(
			p => p.package.dependencies?.[pkg.name]
		);
		output += `<cxl-tr class="${success ? 'success' : 'failure'}">
				<cxl-td><a href="../docs/${dir}">${pkg.name}</a></cxl-td>
				<cxl-td>
					<a href="../${dir}/CHANGELOG.md">CHANGELOG</a>
					<a href="${dir}/test.html">Spec</a>
				</cxl-td>
				<cxl-td>${pkg.package.version} (NPM ${npmVersion})</cxl-td>
				<cxl-td>${usedBy.map(p => p.name).join('<br>')}</cxl-td>
				<cxl-td>${size}</cxl-td>
				<cxl-td>${pkg.buildTime}</cxl-td>
				<cxl-td><a href="${dir}/test-report.html">${coverage} %</a></cxl-td>
			</cxl-tr>`;
	}
	await writeIndex(`
<cxl-table>
	<cxl-tr>
	<cxl-th>Package</cxl-th>
	<cxl-th>Changelog</cxl-th>
	<cxl-th>Version</cxl-th>
	<cxl-th>Used By</cxl-th>
	<cxl-th>Script Size</cxl-th>
	<cxl-th>Build Time</cxl-th>
	<cxl-th>Coverage</cxl-th>
	</cxl-tr>
	${output}
</cxl-table>`);
}

build();
