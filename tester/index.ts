import { writeFile } from 'fs/promises';
import { Logger, Parameter, program, parseArgv } from '@cxl/program';

import runNode from './runner-node.js';
import runPuppeteer from './runner-puppeteer.js';
import printReportV2 from './report-stdout.js';
import renderHtml from './report-html.js';

export interface TestRunner {
	entryFile: string;
	updateBaselines: boolean;
	ignoreCoverage: boolean;
	baselinePath: string;
	amd: boolean;
	node: boolean;
	firefox: boolean;
	log: Logger;
	inspect: boolean;
}

const parameters: Parameter[] = [
	{ name: 'node', help: 'Run tests in node mode.' },
	{
		name: 'firefox',
		help: 'Run tests in firefox through puppeteer.',
	},
	// { name: 'entryFile', rest: true },
	{ name: 'baselinePath', type: 'string', help: 'Baseline Path' },
	{ name: 'updateBaselines' },
	{ name: 'ignoreCoverage', help: 'Disable coverage report.' },
	{ name: 'inspect', help: 'Enable node debugger' },
];

program({}, async ({ log }) => {
	const args = parseArgv(parameters);
	const config: TestRunner = {
		entryFile: './test.js' || args['*'],
		updateBaselines: false,
		ignoreCoverage: false,
		amd: false,
		node: false,
		firefox: false,
		log,
		...args,
	};

	const report = await (args.node ? runNode(config) : runPuppeteer(config));

	if (report) {
		printReportV2(report);
		await writeFile('test-report.json', JSON.stringify(report));
		await renderHtml(report);
	}

	if (!report.success) {
		process.exitCode = 1;
		log('Tests failed.');
	}
})();
