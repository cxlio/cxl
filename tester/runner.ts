import { Result, Test } from './index';
import '../dom/virtual';

declare function require(moduleName: string): any;
declare const process: any;

class TestReport {
	constructor(private suite: Test) {}

	printTest(test: Test) {
		let out = '',
			failures = test.results.filter(result => {
				out += result.success ? '.' : 'X';
				return result.success === false;
			});
		console.group(`${test.name} ${out}`);
		failures.forEach(fail => this.printError(fail));
		test.tests.forEach((test: Test) => this.printTest(test));
		console.groupEnd();
	}

	printError(fail: Result) {
		console.error(`    FAIL ${fail.message}`);
	}

	print() {
		this.printTest(this.suite);
	}
}

async function main() {
	const cwd = process.cwd();

	const suite = await require(cwd + '/test');

	await suite.run();
	const report = new TestReport(suite);
	report.print();
}

main().catch(e => {
	console.error(e);
});
