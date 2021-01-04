import { writeFile } from 'fs/promises';
import { Application } from '@cxl/server';

import runNode from './runner-node.js';
import runPuppeteer from './runner-puppeteer.js';
import printReportV2 from './report-stdout.js';
import renderHtml from './report-html.js';

export class TestRunner extends Application {
	version = '0.0.1';
	name = '@cxl/tester';
	entryFile = './test.js';

	ignoreCoverage = false;
	amd = false;
	node = false;
	firefox = false;

	setup() {
		this.parameters.register(
			{ name: 'node', help: 'Run tests in node mode.' },
			{
				name: 'firefox',
				help: 'Run tests in firefox through puppeteer.',
			},
			{ name: 'entryFile', rest: true },
			{ name: 'ignoreCoverage', help: 'Disable coverage report.' }
		);
	}

	async run() {
		const report = await (this.node ? runNode(this) : runPuppeteer(this));
		if (report) {
			printReportV2(report);
			await writeFile('test-report.json', JSON.stringify(report));
			await renderHtml(report);
		}

		if (!report.success) process.exitCode = 1;
	}
}

const app = new TestRunner();
app.start().then(() => process.exit());
