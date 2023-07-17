import { colors } from '@cxl/program';

import {
	Report,
	TestReport,
	TestResult,
	TestCoverageReport,
} from './report.js';

function printError(name: string, fail: TestResult) {
	const msg = fail.message;
	console.error(name, colors.red(msg));
	if (fail.stack) console.error(fail.stack);
}

function printTest(test: TestReport) {
	let out = '';

	const failures = test.results.filter(result => {
		out += result.success ? colors.green('.') : colors.red('X');
		return result.success === false;
	});

	console.group(`${test.name} ${out}`);
	failures.forEach(fail => printError(test.name, fail));
	test.tests.forEach(printTest);
	console.groupEnd();

	return failures;
}

function printCoverage(coverage: TestCoverageReport[]) {
	console.log('Coverage Report:');
	for (const cov of coverage) {
		const pct = ((cov.blockCovered / cov.blockTotal) * 100).toFixed(2);
		console.log(
			`${cov.url}: ${pct}% (${cov.blockTotal}/${cov.blockCovered})`
		);
	}
}

export default function generate(report: Report) {
	if (report.coverage) printCoverage(report.coverage);
	printTest(report.testReport);
}
