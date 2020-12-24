import { Application } from '../server/index.js';
import { writeFile } from 'fs/promises';

import runNode from './runner-node.js';
import runPuppeteer from './runner-puppeteer.js';
import printReportV2 from './report-stdout.js';
import renderHtml from './report-html.js';

export class TestRunner extends Application {
	version = '0.0.1';
	name = '@cxl/tester';
	entryFile = 'test.js';

	amd = false;
	node = false;
	firefox = false;

	setup() {
		this.parameters.register(
			{ name: 'node', help: 'Run tests in node mode.' },
			{ name: 'firefox', help: 'Run tests in firefox through puppeteer' },
			{ name: 'entryFile', rest: true }
		);
	}

	async run() {
		const report = await (this.node
			? runNode(this.entryFile, this)
			: runPuppeteer(this));

		if (report) {
			printReportV2(report);
			await writeFile('test-report.json', JSON.stringify(report));
			await renderHtml(report);
		}
	}
}

const app = new TestRunner();
app.start().then(() => process.exit(0));
