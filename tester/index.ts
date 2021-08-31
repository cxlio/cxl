#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
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
	browserUrl: string;
	amd: boolean;
	node: boolean;
	firefox: boolean;
	log: Logger;
	inspect: boolean;
	startServer?: string;
}

const parameters: Parameter[] = [
	{ name: 'node', type: 'boolean', help: 'Run tests in node mode.' },
	{
		name: 'firefox',
		help: 'Run tests in firefox through puppeteer.',
	},
	// { name: 'entryFile', rest: true },
	{ name: 'baselinePath', type: 'string', help: 'Baseline Path' },
	{ name: 'updateBaselines' },
	{ name: 'ignoreCoverage', help: 'Disable coverage report.' },
	{ name: 'inspect', help: 'Enable node debugger' },
	{ name: 'browserUrl', type: 'string', help: 'Browser runner initial URL' },
	{
		name: 'startServer',
		type: 'string',
		help: 'Start a server application while the tests are running',
	},
];

program({}, async ({ log }) => {
	const args = parseArgv(parameters);
	const config: TestRunner = {
		entryFile: args.$ || './test.js',
		updateBaselines: false,
		ignoreCoverage: false,
		amd: false,
		node: false,
		firefox: false,
		log,
		...args,
	};

	const server = config.startServer && exec(args.startServer);
	if (server) log(`"${args.startServer}" started`);

	const report = await (args.node ? runNode(config) : runPuppeteer(config));

	try {
		if (server) process.kill(server.pid);
	} catch (e) {
		//
	}

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
