import type { Result, Test } from '@cxl/spec';
import type { TestResult } from './report';

let output = '';

function group(testId: number, title: string) {
	output += `<dl><dt><a data-test="${testId}" href="#">${title}</a></dt><dd><ul>`;
}

function groupEnd() {
	output += '</ul></dd></dl>';
}

function error(msg: string | Error) {
	output += '<li style="background-color:#ffcdd2">';
	if (msg instanceof Error) {
		output += `
			<p style="white-space:pre">${msg.message}</p>
			<pre>${msg.stack}</pre>
		`;
	} else output += `<p style="white-space:pre">${msg}</p>`;
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
	output += result.success ? success() : failure();
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
		test.id,
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

function findTest(tests: Test[], id: number): Test | void {
	for (const test of tests) {
		if (test.id === id) return test;
		const childTest = findTest(test.tests, id);
		if (childTest) return childTest;
	}
}

async function onClick(suite: Test[], ev: Event) {
	const testId = (ev.target as HTMLElement)?.dataset.test;
	if (testId) {
		const test = findTest(suite, +testId);

		if (test) {
			console.log(`Running test "${test.name}"`);
			test.results = [];
			await test.run();
			console.log(test.results);
		}
		ev.stopPropagation();
		ev.preventDefault();
	}
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
		container.addEventListener('click', ev => onClick(suites, ev));
		document.body.appendChild(container);
	},
};

export default browserRunner;
