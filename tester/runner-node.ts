import { resolve } from 'path';
import * as inspector from 'inspector';

import { Application } from '../server/index.js';
import { Test } from '../spec/index.js';

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

export default async function runNode(entryFile: string, app: Application) {
	const session = new inspector.Session();
	app.log(`Node ${process.version}`);
	const suitePath = resolve(entryFile);
	app.log(`Suite: ${suitePath}`);
	session.connect();

	let result!: Test;

	const coverage = await recordCoverage(session, () => {
		const suite = (result = require(suitePath).default as Test);
		return suite.run();
	});

	return generateReport(result, coverage);
}
