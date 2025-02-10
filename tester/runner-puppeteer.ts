import { Browser, CoverageEntry, Page, HTTPRequest } from 'puppeteer';
import * as puppeteer from 'puppeteer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve, join } from 'path';
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

async function handleConsole(msg: puppeteer.ConsoleMessage, app: TestRunner) {
	const type = msg.type();
	const { url, lineNumber } = msg.location();
	const lineText = lineNumber !== undefined ? ` (${lineNumber})` : '';
	app.log(`console ${type}: ${url}${lineText}`);
	for (const arg of msg.args())
		try {
			console.log(
				await arg.evaluate(v => {
					if (v instanceof Error) {
						return { message: v.message, stack: v.stack };
					}

					return JSON.stringify(v, null, 2);
				}),
			);
			//console.log(await arg.jsonValue());
		} catch (e) {
			console.log(arg.toString());
		}
}

async function openPage(browser: Browser) {
	const context = await browser.createBrowserContext();
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

function virtualFileServer(app: TestRunner, page: Page) {
	const root = resolve(app.vfsRoot ?? process.cwd());
	app.log(`Starting virtual file server on "${root}"`);

	async function handle(req: HTTPRequest, url: URL) {
		let body: string | Buffer = '';
		let status = 200;
		try {
			body =
				url.pathname === '/'
					? ''
					: await readFile(join(root, url.pathname));
		} catch (e) {
			if (
				e &&
				typeof e === 'object' &&
				'code' in e &&
				e.code === 'ENOENT'
			)
				status = 404;
		}
		app.log(`[vfs] ${url.pathname} ${status}`);

		req.respond({
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			status,
			contentType: url.pathname.endsWith('.js')
				? 'application/javascript'
				: 'text/plain',
			body,
		});
	}

	page.on('request', req => {
		const url = new URL(req.url());
		if (url.origin !== 'http://localhost:9999') return;
		return handle(req, url);
	});
}

async function handleRequest(sources: Output[], req: HTTPRequest) {
	const url = new URL(req.url());

	if (req.method() !== 'POST') return req.continue();
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

function getCxlPath(pathname: string) {
	const [, , lib, file] = pathname.split('/');
	const actualFile = file
		? `${file}${file.endsWith('js') ? '' : '.js'}`
		: 'index.js';
	return `../../node_modules/@cxl/${lib}/mjs/${actualFile}`;
}

async function mjsRunner(page: Page, sources: Output[], app: TestRunner) {
	const entry = sources[0].path;
	app.log(`Running in mjs mode`);
	await page.setRequestInterception(true);
	page.on('request', async (req: HTTPRequest) => {
		try {
			const url = new URL(req.url());
			if (req.method() === 'GET' && url.hostname === 'cxl-tester') {
				const pathname = url.pathname.startsWith('/@cxl/')
					? getCxlPath(url.pathname)
					: join(process.cwd(), url.pathname);
				const body =
					url.pathname === '/'
						? ''
						: await readFile(pathname, 'utf8');
				if (
					pathname.endsWith('.js') &&
					!sources.find(s => s.source === body)
				)
					sources.push({
						path: pathname,
						source: body,
					});
				req.respond({
					status: 200,
					contentType: pathname.endsWith('.js')
						? 'application/javascript'
						: 'text/plain',
					body,
				});
			} else req.continue();
		} catch (e) {
			app.log(`Error handling request ${req.method()} ${req.url()}`);
		}
	});
	await page.goto('https://cxl-tester');
	await page.addScriptTag({
		type: 'importmap',
		content: `{
    "imports": {
		"@cxl/": "https://cxl-tester/@cxl/"
    }
  }`,
	});

	return page.evaluate(
		`(async entry => {
		const r = (await import(entry)).default;
		await r.run();
		return r.toJSON();
	})('${entry}')`,
	) as Promise<Test>;
}

async function cjsRunner(page: Page, sources: Output[], app: TestRunner) {
	const entry = sources[0].path;
	app.log(`Running in commonjs mode`);

	await page.setRequestInterception(true);

	page.on('request', (req: HTTPRequest) => {
		if (req.isInterceptResolutionHandled()) return;
		try {
			handleRequest(sources, req);
		} catch (e) {
			app.log(`Error handling request ${req.method()} ${req.url()}`);
		}
	});

	await page.addScriptTag({ path: __dirname + '/require.js' });

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

async function parsePNG(buffer: Uint8Array) {
	const PNG = (await import('pngjs')).PNG;
	return new Promise<PNG>((resolve, reject) => {
		const png = new PNG();
		png.parse(Buffer.from(buffer), (e, self) => {
			if (e) reject(e);
			else resolve(self);
		});
	});
}

function screenshot(page: Page, domId: string) {
	return new Promise<Uint8Array>((resolve, reject) => {
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
						if (ArrayBuffer.isView(buffer)) resolve(buffer);
						else reject(`Invalid value returned by screenshot()`);
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
			.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 })
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
	const args = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-gpu',
		'--font-render-hinting=none',
		'--disable-font-subpixel-positioning',
		'--animation-duration-scale=0',
	];
	if (app.disableSecurity) args.push('--disable-web-security');

	const browser = await puppeteer.launch({
		// product: app.firefox ? 'firefox' : 'chrome',
		headless: true,
		args,
		timeout: 5000,
	});
	app.log(`Puppeteer ${await browser.version()}`);

	const page = await openPage(browser);

	//if (app.startServer) await new Promise(resolve => setTimeout(resolve, 500));

	function cxlRunner(cmd: FigureData): Promise<Result> | Result {
		if (cmd.type === 'figure') {
			try {
				return handleFigureRequest(page, cmd, app);
			} catch (e) {
				return {
					success: false,
					message: String(e) || 'Unknown Error',
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

	if (app.vfsRoot) {
		await page.setRequestInterception(true);
		virtualFileServer(app, page);
	}

	if (app.browserUrl) {
		app.log(`Navigating to ${app.browserUrl}`);
		await page.goto(app.browserUrl);
	}

	// Prevent unexpected focus behavior
	await page.bringToFront();
	const suite = app.amd
		? await amdRunner(page, sources)
		: app.mjs
		? await mjsRunner(page, sources, app)
		: await cjsRunner(page, sources, app);
	if (!suite) throw new Error('Invalid suite');

	const coverage = app.ignoreCoverage
		? undefined
		: await generateCoverage(page, sources);

	if (!app.firefox) await page.tracing.stop();

	await browser.close();

	return generateReport(suite, coverage);
}
