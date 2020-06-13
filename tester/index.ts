import { Result, Test } from '../spec/index.js';
import { colors } from '../server/colors.js';
import { Application } from '../server/index.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import * as path from 'path';

import { Browser, Page, Request, launch } from 'puppeteer';

interface Output {
	path: string;
	source: string;
}

class TestReport {
	failures: Result[] = [];
	constructor(private suite: Test) {}

	printTest(test: Test) {
		let out = '';

		const failures = test.results.filter(result => {
			out += result.success ? colors.green('.') : colors.red('X');
			return result.success === false;
		});

		if (test.results.length === 0 && test.tests.length === 0) {
			out = colors.red('X');
			failures.push({ success: false, message: 'No assertions found' });
		}

		console.group(`${test.name} ${out}`);
		failures.forEach(fail => this.printError(test, fail));
		if (test.only.length)
			test.only.forEach((test: Test) => this.printTest(test));
		else test.tests.forEach((test: Test) => this.printTest(test));
		console.groupEnd();

		return failures;
	}

	printError(test: Test, fail: Result) {
		this.failures.push(fail);
		const msg = fail.message;
		console.error(test.name, colors.red(msg));
		if (fail.stack) console.error(fail.stack);
	}

	print() {
		this.printTest(this.suite);
		return this.failures;
	}
}

function generateCoverageReport([js]: any, sources: Output[]) {
	const report: any = {};

	for (const entry of js) {
		const total = entry.text.length;
		const sourceFile = sources.find(src => entry.text.includes(src.source));

		if (!sourceFile) continue;

		const url = sourceFile ? sourceFile.path : entry.url;
		let used = 0;

		report[url] = entry.ranges;

		for (const range of entry.ranges) used += range.end - range.start - 1;

		console.log(`${url}: ${((used / total) * 100).toFixed(2)}%`);
	}

	return report;
}

export interface Report {
	metrics: any;
	coverage: any;
}

async function generateReport(page: Page, sources: Output[]) {
	const report: Report = {
		metrics: await page.metrics(),
		coverage: generateCoverageReport(
			await Promise.all([
				page.coverage.stopJSCoverage(),
				page.coverage.stopCSSCoverage(),
			]),
			sources
		),
	};

	writeFileSync('report.json', JSON.stringify(report), 'utf8');
}

function printReport(suite: Test) {
	const report = new TestReport(suite);
	const failures = report.print();
	if (failures.length) process.exit(1);
}

function handleRequest(sources: Output[], req: Request) {
	if (req.method() !== 'POST') return req.continue();

	const { base, scriptPath } = JSON.parse(req.postData() || '');

	let url = path.resolve(base, scriptPath);
	if (!url.endsWith('.js')) url += '.js';
	if (!existsSync(url)) url = url.replace(/\.js$/, '/index.js');

	if (existsSync(url)) {
		const content = readFileSync(url, 'utf8');

		sources.push({
			path: path.relative(process.cwd(), url),
			source: content,
		});

		req.respond({
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			status: 200,
			contentType: 'application/javascript',
			body: JSON.stringify({ content, url, base: path.dirname(url) }),
		});
	} else req.continue();
}

async function cjsRunner(page: Page, sources: Output[]) {
	const entry = sources[0].path;
	await page.addScriptTag({ path: __dirname + '/require.js' });

	page.setRequestInterception(true);
	page.on('request', (req: Request) => {
		try {
			handleRequest(sources, req);
		} catch (e) {
			app.log(`Error handling request ${req.method()} ${req.url()}`);
		}
	});

	return page.evaluate(`
		const suite = require('${entry}').default;
		suite.run().then(() => suite);
	`);
}

async function amdRunner(page: Page, sources: Output[]) {
	for (const source of sources) {
		await page.addScriptTag({
			content: source.source,
		});
	}

	return page.evaluate(`
		let suite;
		define('@tester', ['exports', 'require', 'index'], (exports, require, index) => {
			suite = index.default;
		})
		suite.run().then(() => suite);
	`);
}

class TestRunner extends Application {
	version = '0.0.1';
	name = '@cxl/tester';
	entryFile = 'test.js';

	amd = false;
	node = false;

	setup() {
		this.parameters.register(
			{ name: 'node', help: 'Run tests in node mode.' },
			{ name: 'entryFile', rest: true }
		);
	}

	private handleConsole(msg: any) {
		const type = msg.type();
		const { url, lineNumber } = msg.location();
		this.log(`Console: ${url}:${lineNumber}`);
		Promise.all(
			msg
				.args()
				.map((arg: any) =>
					typeof arg === 'string' ? arg : arg.toString()
				)
		).then(out => {
			out.forEach(arg => (console as any)[type](arg));
		});
	}

	private async openPage(browser: Browser) {
		try {
			return await browser.newPage();
		} catch (e) {
			// Try again
			return await browser.newPage();
		}
	}

	private runNode() {
		this.log(`Node ${process.version}`);
		const suite = require(path.resolve(this.entryFile)).default as Test;
		suite.run();
		return suite;
	}

	private async runPuppeteer() {
		const browser = await launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		this.log(`Puppeteer ${await browser.version()}`);

		const page = await this.openPage(browser);

		await Promise.all([
			page.coverage.startJSCoverage({
				reportAnonymousScripts: true,
			}),
			page.coverage.startCSSCoverage(),
		]);
		page.on('console', msg => this.handleConsole(msg));
		page.on('pageerror', msg => this.log(msg));

		const source = readFileSync(this.entryFile, 'utf8');
		const sources = [{ path: this.entryFile, source }];

		await page.tracing.start({ path: 'trace.json' });
		const suite = this.amd
			? await amdRunner(page, sources)
			: await cjsRunner(page, sources);
		await page.tracing.stop();

		this.log('Generating report.json');
		await generateReport(page, sources);
		await browser.close();

		return suite;
	}

	async run() {
		const suite = await (this.node ? this.runNode() : this.runPuppeteer());
		printReport(suite as Test);
	}
}

const app = new TestRunner();
app.start();
