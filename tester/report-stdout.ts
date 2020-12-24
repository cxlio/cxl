import { colors } from '../server/colors.js';

import { Report, TestReport, TestResult } from './report.js';

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

export default function generate(report: Report) {
	return printTest(report.testReport);
}
