import { Result, Test } from './index.js';
import { colors } from '../server/colors.js';
import { Application, ApplicationArguments } from '../server/index.js';
import { writeFileSync, readFileSync } from 'fs';

import { launch, Page } from 'puppeteer';
require('source-map-support').install();

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
			console.log(test);
			out = colors.red('X');
			failures.push({ success: false, message: 'No assertions found' });
		}

		console.group(`${test.name} ${out}`);
		failures.forEach(fail => this.printError(fail));
		test.tests.forEach((test: Test) => this.printTest(test));
		console.groupEnd();

		return failures;
	}

	printError(fail: Result) {
		this.failures.push(fail);
		const msg = fail.message;
		console.error(colors.red(msg));
		if (fail.stack) console.error(fail.stack);
	}

	print() {
		this.printTest(this.suite);
		return this.failures;
	}
}

function generateCoverageReport([js]: any, { path, source }: Output) {
	const report: any = {};

	for (const entry of js) {
		const total = entry.text.length;
		const url = entry.text === source ? path : entry.url;
		let used = 0;

		report[url] = entry.ranges;

		for (const range of entry.ranges) used += range.end - range.start - 1;

		console.log(`${url}: ${((used / total) * 100).toFixed(2)}%`);
	}

	return report;
}

async function generateReport(page: Page, entrySource: Output) {
	const report = {
		metrics: await page.metrics(),
		coverage: generateCoverageReport(
			await Promise.all([
				page.coverage.stopJSCoverage(),
				page.coverage.stopCSSCoverage()
			]),
			entrySource
		)
	};

	writeFileSync('report.json', JSON.stringify(report), 'utf8');
}

function printReport(suite: Test) {
	const report = new TestReport(suite);
	const failures = report.print();
	if (failures.length) process.exit(1);
}

/*private async handleRequire(page) {
			page.setRequestInterception(true);
				let url = req.url().slice(7);

				if (!existsSync(url)) url = url.replace(/\.js$/, '/index.js');

				if (existsSync(url)) {
					this.log(`Loading "${url}"`);
					const content = readFileSync(url, 'utf8');
					req.respond({
						headers: {
							'Access-Control-Allow-Origin': '*'
						},
						status: 200,
						contentType: 'application/javascript',
						body: content
					});
				} else req.continue();
	}*/

/*async function moduleRunner(page: Page, sources: Output[]) {

	for (const src of sources) {
		await page.addScriptTag({
			type: 'module',
			content: src.source
		});
	}
	
	return page.evaluate(`
		let suite;
		define('@tester', ['exports', 'require', 'index'], (exports, require, index) => {
			suite = index.default;
		})
		suite.run().then(() => suite);
	`);
}*/

async function amdRunner(page: Page, sources: Output[]) {
	for (const source of sources) {
		await page.addScriptTag({
			content: source.source
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

	private handleArguments(args?: ApplicationArguments) {
		if (!args) return this.runVirtualDom();

		const result = [];

		if (args.virtual) {
			result.push(this.runVirtualDom());
		}
		if (args.browser) result.push(this.runPuppeteer());

		if (args.files.length) this.entryFile = args.files[0];

		return result.length ? Promise.all(result) : this.runVirtualDom();
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

	private async runPuppeteer() {
		const browser = await launch();
		this.log(`Puppeteer enabled. ${await browser.version()}`);
		const page = await browser.newPage();
		try {
			await Promise.all([
				page.coverage.startJSCoverage({
					reportAnonymousScripts: true
				}),
				page.coverage.startCSSCoverage()
			]);
			page.on('console', msg => this.handleConsole(msg));
			page.on('pageerror', msg => {
				this.log(msg);
			});

			const source = readFileSync(this.entryFile, 'utf8');
			const sources = [{ path: this.entryFile, source }];

			page.tracing.start({ path: 'trace.json' });
			const suite = await amdRunner(page, sources);
			await page.tracing.stop();

			this.log('Generating report.json');
			await generateReport(page, { path: this.entryFile, source });
			printReport(suite as Test);
		} catch (e) {
			this.log(e);
			process.exit(1);
		}
		await browser.close();
	}

	private async runVirtualDom() {
		require('../dom/virtual.js');
		this.log(`Virtual DOM enabled`);
		const cwd = process.cwd();
		const suite = (await import(`${cwd}/${this.entryFile}`)).default;
		await suite.run();
		printReport(suite);
	}

	async run() {
		await this.handleArguments(this.arguments);
	}
}

new TestRunner().start();
