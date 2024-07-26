import { Browser, CoverageEntry, Page, HTTPRequest } from 'puppeteer';
import * as puppeteer from 'puppeteer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import type { FigureData, Test, Result } from '@cxl/spec';
import type { TestRunner } from './index.js';
import type { PNG } from 'pngjs';

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

function handleConsole(msg: puppeteer.ConsoleMessage, app: TestRunner) {
	const type = msg.type();
	const { url, lineNumber } = msg.location();
	const lineText = lineNumber !== undefined ? ` (${lineNumber})` : '';
	app.log(`console ${type}: ${url}${lineText}`);
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

function resolveImport(path: string) {
	return path
		.replace(
			/^@j5g3\/(.+)/,
			(str, p1) =>
				`../../../j5g3/dist/${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}`,
		)
		.replace(
			/^@cxl\/workspace\.(.+)/,
			(str, p1) =>
				`../../../cxl.app/dist/${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}`,
		)
		.replace(
			/^@cxl\/gbc\.(.*)/,
			(str, p1) =>
				`../../../gbc/dist/${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}`,
		)
		.replace(
			/^@cxl\/(ui.*)/,
			(str, p1) =>
				`../../../ui/dist/${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}`,
		)
		.replace(
			/^@cxl\/(.+)/,
			(str, p1) =>
				`../../../cxl/dist/${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}`,
		);
}

async function handleRequest(sources: Output[], req: HTTPRequest) {
	if (req.method() !== 'POST') return req.continue();
	const url = new URL(req.url());
	if (url.hostname !== 'cxl-tester') return req.continue();

	const { base, scriptPath } = JSON.parse(req.postData() || '');
	const paths = [resolve(base)];
	const resolvedUrl = resolveImport(scriptPath);
	if (resolvedUrl !== scriptPath) {
		return respond(req, sources, resolvedUrl);
	}

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
	sources: Output[],
): Promise<TestCoverage[]> {
	const coverage = await page.coverage.stopJSCoverage();
	return coverage.map(entry => {
		const sourceFile = sources.find(src => entry.text.includes(src.source));
		return {
			url: sourceFile?.path ? resolve(sourceFile?.path) : entry.url,
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

let figureReady: Promise<void>;
let screenshotQueue = Promise.resolve();

async function parsePNG(buffer: Buffer) {
	const PNG = (await import('pngjs')).PNG;
	return new Promise<PNG>((resolve, reject) => {
		const png = new PNG();
		png.parse(buffer, (e, self) => {
			if (e) reject(e);
			else resolve(self);
		});
	});
}

function screenshot(page: Page, domId: string) {
	return new Promise<Buffer>((resolve, reject) => {
		const id = `#${domId}`;
		screenshotQueue = screenshotQueue.then(() => {
			return page
				.$eval(id, el => {
					(el as HTMLElement).style.zIndex = '10';
					(
						((el as HTMLElement).getRootNode() as Document)
							?.activeElement as HTMLElement
					)?.blur?.();
				})
				.then(() => page.$(id))
				.then(el => {
					return el?.screenshot({
						type: 'png',
						encoding: 'binary',
					});
				})
				.then(
					buffer => {
						if (buffer && buffer instanceof Buffer) resolve(buffer);
						else reject();
					},
					e => reject(e),
				);
		});
	});
}

async function handleFigureRequest(
	page: Page,
	data: FigureData,
	app: TestRunner,
): Promise<Result> {
	const { name, domId } = data;
	const baseline = (data.baseline = `${
		app.baselinePath || 'spec'
	}/${name}.png`);
	const filename = `spec/${name}.png`;

	await page.waitForFunction(() => document.fonts?.ready);
	await (figureReady ||
		(figureReady = page
			.waitForNavigation({ waitUntil: 'networkidle0', timeout: 250 })
			.then(
				() => void 0,
				() => void 0,
			)));

	page.mouse.move(350, -100);
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
		const [oPng, newPng] = await Promise.all([
			parsePNG(original),
			parsePNG(buffer),
		]);
		const originalData = oPng.data;
		const newData = newPng.data;
		const len = originalData.length;

		if (len !== newData.length) {
			return {
				success: false,
				message: `Screenshot should match baseline: Different Size (${oPng.width}x${oPng.height} vs ${newPng.width}x${newPng.height})`,
				data,
			};
		}
		for (let i = 0; i < len; i++) {
			if (originalData.readUInt8(i) !== newData.readUInt8(i))
				return {
					success: false,
					message: `Screenshot should match baseline`,
					data,
				};
		}
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

	function cxlRunner(cmd: FigureData): Promise<Result> | Result {
		if (cmd.type === 'figure') {
			try {
				return handleFigureRequest(page, cmd, app);
			} catch (e) {
				return {
					success: false,
					message: String(e),
				};
			}
		}
		return {
			success: false,
			message: `Feature not supported: ${cmd.type}`,
		};
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
