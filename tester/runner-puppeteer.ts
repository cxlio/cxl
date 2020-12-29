import { Browser, CoverageEntry, Page, Request, launch } from 'puppeteer';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { Test } from '../spec/index.js';
import type { TestRunner } from './index.js';

import { TestCoverage, generateReport } from './report.js';

interface Output {
	path: string;
	source: string;
}

async function startTracing(page: Page) {
	await Promise.all([
		page.coverage.startJSCoverage({
			reportAnonymousScripts: true,
		}),
		page.tracing.start({ path: 'trace.json' }),
	]);
}

function handleConsole(msg: any, app: TestRunner) {
	const type = msg.type();
	const { url, lineNumber } = msg.location();
	app.log(`console ${type}: ${url}:${lineNumber}`);
	console.log(msg.text());
}

async function openPage(browser: Browser) {
	const context = await browser.createIncognitoBrowserContext();
	return await context.newPage();
}

async function respond(req: Request, sources: Output[], url: string) {
	const content = await readFile(url, 'utf8');
	sources.push({
		path: url,
		source: content,
	});

	req.respond({
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
		status: 200,
		contentType: 'application/javascript',
		body: JSON.stringify({ content, url, base: dirname(url) }),
	});
}

async function handleRequest(sources: Output[], req: Request) {
	if (req.method() !== 'POST') return req.continue();

	const { base, scriptPath } = JSON.parse(req.postData() || '');

	let url = resolve(base, scriptPath);
	if (!url.endsWith('.js')) url += '.js';

	try {
		await respond(req, sources, url);
	} catch (e) {
		if (e.code === 'ENOENT') {
			url = url.replace(/\.js$/, '/index.js');
			await respond(req, sources, url);
		} else req.continue();
	}
}

async function amdRunner(page: Page, sources: Output[]) {
	for (const source of sources) {
		await page.addScriptTag({
			content: source.source,
		});
	}

	return await (page.evaluate(`
		let suite;
		define('@tester', ['exports', 'require', 'index'], (exports, require, index) => {
			suite = index.default;
		})
		suite.run().then(() => suite);
	`) as Promise<Test>);
}

async function cjsRunner(page: Page, sources: Output[], app: TestRunner) {
	const entry = sources[0].path;
	app.log(`Running in commonjs mode`);
	await page.addScriptTag({ path: __dirname + '/require.js' });

	await app.log(
		'Setting up request interceptor',
		page.setRequestInterception(true)
	);
	page.on('request', (req: Request) => {
		try {
			handleRequest(sources, req);
		} catch (e) {
			app.log(`Error handling request ${req.method()} ${req.url()}`);
		}
	});

	return page.evaluate(async entry => {
		const r = require(entry).default as Test;
		await r.run();
		return r.toJSON();
	}, entry);
}

function Range(startOffset: number, endOffset: number, count: number) {
	return {
		startOffset,
		endOffset,
		count,
	};
}

function generateRanges(entry: CoverageEntry) {
	const result = [];
	let index = 0;

	for (const range of entry.ranges) {
		if (range.start > index) result.push(Range(index, range.start, 0));
		result.push(Range(range.start, range.end, 1));
		index = range.end;
	}

	if (index < entry.text.length) {
		result.push(Range(index, entry.text.length, 0));
	}
	return result;
}

async function generateCoverage(
	page: Page,
	sources: Output[]
): Promise<TestCoverage[]> {
	const coverage = await page.coverage.stopJSCoverage();
	return coverage.map(entry => {
		const sourceFile = sources.find(src => entry.text.includes(src.source));
		return {
			url: sourceFile?.path || entry.url,
			functions: [
				{
					functionName: '',
					ranges: generateRanges(entry),
					isBlockCoverage: true,
				},
			],
		};
	});
}

export default async function runPuppeteer(app: TestRunner) {
	const entryFile = app.entryFile;
	const browser = await launch({
		product: app.firefox ? 'firefox' : 'chrome',
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
		timeout: 5000,
		dumpio: true,
	});
	app.log(`Puppeteer ${await browser.version()}`);

	const page = await openPage(browser);
	page.on('console', msg => handleConsole(msg, app));
	page.on('pageerror', msg => app.log(msg));

	if (!app.firefox) await startTracing(page);

	app.log(`Entry file: ${entryFile}`);
	const source = await readFile(entryFile, 'utf8');
	const sources = [{ path: entryFile, source }];

	const suite = app.amd
		? await amdRunner(page, sources)
		: await cjsRunner(page, sources, app);
	if (!suite) throw new Error('Invalid suite');

	const coverage = await generateCoverage(page, sources);

	if (!app.firefox) await page.tracing.stop();

	await browser.close();

	return generateReport(suite, coverage);
}
