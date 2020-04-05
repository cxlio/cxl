import { Result, Test } from '../spec/index.js';

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

class TestReport {
	failures: Result[] = [];
	constructor(public suite: Test) {}

	printTest(test: Test) {
		let out = '';

		const failures = test.results.filter(result => {
			out += result.success ? success() : failure();
			return result.success === false;
		});

		if (test.results.length === 0 && test.tests.length === 0) {
			out = failure();
			failures.push({ success: false, message: 'No assertions found' });
		}

		group(`${test.name} ${out}`);
		failures.forEach(fail => this.printError(fail));
		test.tests.forEach((test: Test) => this.printTest(test));
		groupEnd();

		return failures;
	}

	printError(fail: Result) {
		console.error(fail.message, fail.stack);
		this.failures.push(fail);
		const msg = fail.message;
		error(msg);
	}

	print() {
		this.printTest(this.suite);
		return this.failures;
	}
}

const browserRunner = {
	async runSuite(suite: Test) {
		await suite.run();
		new TestReport(suite).print();
	},

	async run(suites: Test[]) {
		await Promise.all(suites.map(suite => this.runSuite(suite)));
		const container = document.createElement('cxl-content');
		container.innerHTML = output;
		document.body.appendChild(container);
	}
};

export default browserRunner;
