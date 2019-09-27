// import * as puppeteer from 'puppeteer';

class Result {
	constructor(
		public success: boolean,
		public message: (() => string) | string
	) {}
}

export class TestContext {
	results: Result[] = [];

	constructor(public name: string) {}

	ok(condition: any, msg: string = '') {
		this.results.push(new Result(!!condition, msg));
	}

	equal<T>(a: T, b: T) {
		return this.ok(a === b, `${a} should equal ${b}`);
	}
}

class Suite {
	tests: TestContext[] = [];
	constructor(public name: string) {}

	addTest(test: TestContext) {
		this.tests.push(test);
	}
}

class TestReport {
	constructor(private suite: Suite) {}

	printTest(test: TestContext) {
		let out = '',
			failures = test.results.filter(result => {
				out += result.success ? '.' : 'X';
				return result.success === false;
			});
		console.log(`   ${test.name} ${out}`);
		failures.forEach(fail => this.printError(fail));
	}

	printError(fail: Result) {
		console.error(`    FAIL ${fail.message}`);
	}

	print() {
		console.log(this.suite.name);
		this.suite.tests.forEach(test => this.printTest(test));
	}
}

type TestFn = (context: TestContext) => void;
type SuiteFn = (test: (name: string, testFn: TestFn) => void) => void;

export function suite(name: string, suiteFn: SuiteFn) {
	const suite = new Suite(name);

	function test(name: string, testFn: TestFn) {
		const test = new TestContext(name);
		suite.addTest(test);
		testFn(test);
	}

	suiteFn(test);
	const report = new TestReport(suite);
	report.print();
}
