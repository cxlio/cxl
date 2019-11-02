type TestFn = (test: Test) => void;
type SuiteFn = (suiteFn: (name: string, testFn: TestFn) => void) => void;

class Result {
	constructor(
		public success: boolean,
		public message: (() => string) | string
	) {}
}

interface TestConfig {
	name: string;
}

class Test {
	name: string;
	promise?: Promise<any>;
	results: Result[] = [];
	tests: Test[] = [];
	timeout = 5 * 1000;

	constructor(nameOrConfig: string | TestConfig, public testFn: TestFn) {
		if (typeof nameOrConfig === 'string') this.name = nameOrConfig;
		else this.name = nameOrConfig.name;
	}

	ok(condition: any, msg: string = '') {
		this.results.push(new Result(!!condition, msg));
	}

	equal<T>(a: T, b: T) {
		return this.ok(a === b, `${a} should equal ${b}`);
	}

	async() {
		let result: () => void, timeout: number;

		this.promise = new Promise<void>((resolve, reject) => {
			result = resolve;
			timeout = setTimeout(reject, this.timeout);
		});
		return () => {
			result();
			clearTimeout(timeout);
		};
	}

	test(name: string, testFn: TestFn) {
		this.tests.push(new Test(name, testFn));
	}

	async run(): Promise<Result[]> {
		this.testFn(this);
		return Promise.all(this.tests.map(test => test.run())).then(
			() => this.results
		);
	}
}

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

export async function suite(
	nameOrConfig: string | TestConfig,
	suiteFn: SuiteFn
) {
	const suite = new Test(nameOrConfig, context => {
		suiteFn(context.test.bind(context));
	});

	await suite.run();
	const report = new TestReport(suite);
	report.print();
}
