import { readFile, writeFile } from 'fs/promises';
import { Report, TestCoverage } from './report.js';

const STYLES = `<style>
	em.covered { background-color: #c3c; }
	em { background-color: #3cc; }
</style>`;

const HEADER = `<!DOCTYPE html>
	<head><title>Test Report</title></head>
<cxl-appbar>
	<cxl-appbar-title>Test Report</cxl-appbar-title>
	<cxl-navbar>
	</cxl-navbar>
</cxl-appbar><cxl-meta></cxl-meta>`;

async function renderSource(test: TestCoverage) {
	const source = await readFile(test.url);
	let index = 0;
	let output = `<h2>${test.url}</h2><pre>`;

	test.functions.forEach(fn => {
		if (!fn.isBlockCoverage)
			fn.ranges.forEach(range => {
				if (index >= range.endOffset) return;

				const start = Math.max(range.startOffset, index);
				output +=
					source.slice(index, start) +
					`<em class="${range.count ? '' : 'covered'}">${source.slice(
						range.startOffset,
						range.endOffset
					)}</em>`;
				index = range.endOffset;
			});
	});
	output += source.slice(index);

	return `${output}</pre>`;
}

export default async function generate(report: Report) {
	const pages = await Promise.all(report.coverage.map(renderSource));
	const result = `${HEADER}${STYLES}${pages.join('')}`;
	await writeFile('test-report.html', result);
}
