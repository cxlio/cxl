import { Browser, CoverageEntry, Page, HTTPRequest } from 'puppeteer';
import * as puppeteer from 'puppeteer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import type { Test } from '@cxl/spec';
import type { TestRunner } from './index.js';
import { PNG } from 'pngjs';

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

async function respond(req: HTTPRequest, sources: Output[], url: string) {
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

async function handleRequest(sources: Output[], req: HTTPRequest) {
	if (req.method() !== 'POST') return req.continue();

	const url = new URL(req.url());
	if (url.hostname !== 'cxl-tester') return req.continue();

	const { base, scriptPath } = JSON.parse(req.postData() || '');
	const paths = [resolve(base)];

	try {
		const url = require.resolve(scriptPath, { paths });
		await respond(req, sources, url);
	} catch (e) {
		console.error(base, scriptPath, e);
		req.continue();
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
	await page.setRequestInterception(true);

	page.on('request', (req: HTTPRequest) => {
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

let figureReady: Promise<any>;
let screenshotQueue = Promise.resolve();

function parsePNG(buffer: Buffer) {
	return new Promise<Buffer>((resolve, reject) => {
		const png = new PNG();
		png.parse(buffer, (e, self) => {
			if (e) reject(e);
			else resolve(self.data);
		});
	});
}

function screenshot(page: Page, domId: string) {
	return new Promise<Buffer>((resolve, reject) => {
		const id = `#${domId}`;
		screenshotQueue = screenshotQueue.then(() => {
			return page
				.$eval(id, el => {
					(el as any).style.zIndex = 10;
				})
				.then(() => page.$(`#${domId}`))
				.then(el =>
					el?.screenshot({
						type: 'png',
						encoding: 'binary',
					})
				)
				.then(buffer => {
					if (buffer && buffer instanceof Buffer) resolve(buffer);
					else reject();
				});
		});
	});
}

async function handleFigureRequest(
	page: Page,
	data: { name: string; domId: string; baseline?: string },
	app: TestRunner
) {
	const { name, domId } = data;
	const baseline = (data.baseline = `${
		app.baselinePath || 'spec'
	}/${name}.png`);
	const filename = `spec/${name}.png`;

	await (figureReady ||
		(figureReady = page
			.waitForNavigation({ waitUntil: 'networkidle0', timeout: 500 })
			.catch(() => 1)));

	page.mouse.move(350, -100);
	await page.waitForTimeout(300);
	const [original, buffer] = await Promise.all([
		readFile(baseline).catch(() => undefined),
		screenshot(page, domId),
	]);

	if (buffer)
		mkdir('spec')
			.catch(() => false)
			.then(() => writeFile(filename, buffer));

	if ((!original || app.updateBaselines) && buffer && app.baselinePath) {
		mkdir(app.baselinePath)
			.catch(() => false)
			.then(() => writeFile(baseline, buffer));
	} else if (original && buffer && app.baselinePath) {
		const [originalData, newData] = await Promise.all([
			parsePNG(original),
			parsePNG(buffer),
		]);
		const len = originalData.length;
		let diff = 0;

		if (len !== newData.length) {
			return {
				success: false,
				message: 'Screenshot should match baseline: Different Size',
				data,
			};
		}
		for (let i = 0; i < len; i++) {
			if (originalData.readUInt8(i) !== newData.readUInt8(i)) diff++;
		}
		if (diff > 0)
			return {
				success: false,
				message: `Screenshot should match baseline: Different by ${(
					(diff / len) *
					100
				).toFixed(2)}%`,
				data,
			};
	}

	return {
		success: true,
		message: 'Screenshot should match baseline',
		data,
	};
}

export default async function runPuppeteer(app: TestRunner) {
	const entryFile = app.entryFile;
	const browser = await puppeteer.launch({
		// product: app.firefox ? 'firefox' : 'chrome',
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-gpu',
			'--font-render-hinting=none',
			'--disable-font-subpixel-positioning',
			'--animation-duration-scale=0',
		],
		timeout: 5000,
	});
	app.log(`Puppeteer ${await browser.version()}`);

	const page = await openPage(browser);

	if (app.startServer) await page.waitForTimeout(500);
	if (app.browserUrl) await page.goto(app.browserUrl);

	function cxlRunner(cmd: any) {
		if (cmd.type === 'figure') return handleFigureRequest(page, cmd, app);
	}

	page.on('console', msg => handleConsole(msg, app));
	page.on('pageerror', msg => app.log(msg));
	page.exposeFunction('__cxlRunner', cxlRunner);

	if (!app.firefox) await startTracing(page);

	app.log(`Entry file: ${entryFile}`);
	const source = await readFile(entryFile, 'utf8');
	const sources = [{ path: entryFile, source }];

	const suite = app.amd
		? await amdRunner(page, sources)
		: await cjsRunner(page, sources, app);
	if (!suite) throw new Error('Invalid suite');

	const coverage = app.ignoreCoverage
		? undefined
		: await generateCoverage(page, sources);

	if (!app.firefox) await page.tracing.stop();

	await browser.close();

	return generateReport(suite, coverage);
}
