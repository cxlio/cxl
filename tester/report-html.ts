import { readFile, writeFile } from 'fs/promises';
import { escapeHtml } from '../source/index.js';
import { Report, TestCoverageReport } from './report.js';

const STYLES = `<style>
	body { font-size: 16px; }
	em.covered { background-color: #a5d6a7 }
	em { background-color: #ef9a9a; }
</style>`;

const HEADER = `<!DOCTYPE html>
	<head><title>Test Report</title></head>
<cxl-appbar>
	<cxl-appbar-title>Test Report</cxl-appbar-title>
	<cxl-navbar>
	</cxl-navbar>
</cxl-appbar><cxl-meta></cxl-meta>`;

type Tag = { offset: number; text: string };

async function renderSource(test: TestCoverageReport) {
	const source = await readFile(test.url, 'utf8');
	let index = 0;
	let output = `<h2>${test.url} <small>(${test.blockCovered}/${test.blockTotal})</small></h2><pre>`;
	const tags: Tag[] = [];

	test.functions.forEach(fn => {
		fn.ranges.forEach(range => {
			tags.push(
				{
					offset: range.startOffset,
					text: `<em class="${range.count ? 'covered' : ''}">`,
				},
				{ offset: range.endOffset, text: '</em>' }
			);
		});
	});

	tags.sort((a, b) => a.offset - b.offset);

	for (const tag of tags) {
		output += escapeHtml(source.slice(index, tag.offset)) + tag.text;
		index = tag.offset;
	}

	output += source.slice(index);

	return `${output}</pre>`;
}

export default async function generate(report: Report) {
	const pages = await Promise.all(report.coverage.map(renderSource));
	const result = `${HEADER}${STYLES}${pages.join('')}`;
	await writeFile('test-report.html', result);
}
