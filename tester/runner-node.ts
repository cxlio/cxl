import { resolve } from 'path';
import * as inspector from 'inspector';

import type { Test } from '@cxl/spec';
import type { TestRunner } from './index.js';

import { Coverage, generateReport } from './report.js';

function post(session: inspector.Session, msg: string, params = {}) {
	return new Promise((resolve, reject) => {
		session.post(msg, params, (err: any, result: any) =>
			err ? reject(err) : resolve(result)
		);
	});
}

async function recordCoverage(
	session: inspector.Session,
	cb: () => Promise<any>
) {
	await post(session, 'Profiler.enable');
	await post(session, 'Profiler.startPreciseCoverage', { detailed: true });
	await cb();
	const coverage: any = await post(session, 'Profiler.takePreciseCoverage');
	await post(session, 'Profiler.stopPreciseCoverage');
	await post(session, 'Profiler.disable');
	return coverage.result as Coverage;
}

function runSuite(suitePath: string) {
	const suite = require(suitePath).default as Test;
	return suite.run().then(() => suite);
}

export default async function runNode(app: TestRunner) {
	const entryFile = app.entryFile;
	const session = new inspector.Session();
	app.log(`Node ${process.version}`);
	const suitePath = resolve(entryFile);
	app.log(`Suite: ${suitePath}`);

	if (app.inspect) {
		inspector.open();
		console.log(`Waiting for debugger (${inspector.url()})`);
		inspector.waitForDebugger();
	}

	session.connect();

	let result!: Test;

	require('source-map-support').install();

	if (app.ignoreCoverage) {
		const suite = await runSuite(suitePath);
		return generateReport(suite);
	} else {
		const coverage = await recordCoverage(session, () => {
			const suite = (result = require(suitePath).default as Test);
			return suite.run();
		});
		return generateReport(result, coverage);
	}
}
