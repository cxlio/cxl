import { Result, Test } from '@cxl/spec';
import type { TestResult } from './report';

let output = '';

function group(title: string) {
	output += `<dl><dt>${title}</dt><dd><ul>`;
}

function groupEnd() {
	output += '</ul></dd></dl>';
}

function error(msg: string | Error) {
	output += '<li style="background-color:#ffcdd2">';
	if (msg instanceof Error) {
		output += `
			<cxl-t subtitle>${msg.message}</cxl-t>
			<pre>${msg.stack}</pre>
		`;
	} else output += `<cxl-t subtitle>${msg}</cxl-t>`;
	output += '</li>';
}

function success(): string {
	return '&check;';
}

function failure(): string {
	return '&times;';
}

function printError(fail: Result) {
	console.error(fail.message);
	if (fail.stack) console.error(fail.stack);
	const msg = fail.message;
	error(msg);
}

function printResult(result: Result) {
	output += result.success ? success() : failure(); //success(); //`${result.message} ${result.success ? success() : failure()}`;
}

function renderTestReport(test: Test) {
	let failureCount = 0;
	const failures: TestResult[] = [];

	const results: TestResult[] = test.results.map(r => {
		if (r.success === false) {
			failureCount++;
			failures.push(r);
		}

		return {
			message: r.message,
			success: r.success,
			stack: r.stack,
		};
	});

	if (
		results.length === 0 &&
		test.tests.length === 0 &&
		test.only.length === 0
	) {
		failureCount++;
		results.push({ success: false, message: 'No assertions found' });
	}

	group(
		`${test.name}${failureCount > 0 ? ` (${failureCount} failures)` : ''}`
	);
	results.forEach(r => {
		printResult(r);
		if (!r.success) printError(r);
	});
	if (test.only.length)
		test.only.forEach((test: Test) => renderTestReport(test));
	else test.tests.forEach((test: Test) => renderTestReport(test));
	groupEnd();
}

const browserRunner = {
	async runSuite(suite: Test) {
		await suite.run();
		renderTestReport(suite);
	},

	async run(suites: Test[]) {
		await Promise.all(suites.map(suite => this.runSuite(suite)));
		const container = document.createElement('cxl-content');
		container.innerHTML = output;
		document.body.appendChild(container);
	},
};

export default browserRunner;
