import { readFile, writeFile } from 'fs/promises';
import { escapeHtml } from '@cxl/source';
import { Report, TestCoverageReport } from './report.js';

const STYLES = `<style>
	body { font-size: 16px; }
	em.covered { background-color: #a5d6a7 }
	em { background-color: #ef9a9a; }
</style>`;

const HEADER = `<!DOCTYPE html>
	<head><title>Test Report</title></head>
`;
let INDEX = '';

type Tag = { offset: number; text: string };

async function renderSource(test: TestCoverageReport) {
	const source = await readFile(test.url, 'utf8');
	let index = 0;
	let output = `<h2><a name="${test.url}">${test.url}</a></h2><pre>`;
	const tags: Tag[] = [];
	const covPct = ((test.blockCovered / test.blockTotal) * 100).toFixed(2);

	INDEX += `<tr>
		<td><a href="#${test.url}">${test.url}</a></td>
		<td>${covPct}% (${test.blockCovered}/${test.blockTotal})</td>
	</tr>`;

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
	if (report.coverage) {
		const pages = await Promise.all(report.coverage.map(renderSource));
		const result = `${HEADER}${STYLES}<table>${INDEX}</table>${pages.join(
			''
		)}`;
		await writeFile('test-report.html', result);
	}
}
