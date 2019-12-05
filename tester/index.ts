type TestFn = (test: Test) => void;
type SuiteFn = (suiteFn: (name: string, testFn: TestFn) => void) => void;

declare function setTimeout(fn: () => any, n?: number): number;
declare function clearTimeout(n: number): void;

export class Result {
	constructor(public success: boolean, public message: string | Error) {}
}

interface TestConfig {
	name: string;
}

export class Test {
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

	ran(n: number) {
		return this.ok(
			n === this.results.length,
			`Expected ${n} assertions, instead got ${this.results.length}`
		);
	}

	async() {
		let result: () => void, timeout: number;

		this.promise = new Promise<void>((resolve, reject) => {
			result = resolve;
			timeout = setTimeout(() => {
				this.results.push(new Result(false, 'Async test timed out'));
				reject();
			}, this.timeout);
		});
		return () => {
			result();
			clearTimeout(timeout);
		};
	}

	test(name: string, testFn: TestFn) {
		this.tests.push(new Test(name, testFn));
	}

	addTest(test: Test) {
		this.tests.push(test);
	}

	async run(): Promise<Result[]> {
		try {
			this.testFn(this);
			await this.promise;
			await Promise.all(this.tests.map(test => test.run())).then(
				() => this.results
			);
		} catch (e) {
			this.results.push(new Result(false, e));
		}

		return this.results;
	}
}

export function suite(
	nameOrConfig: string | TestConfig,
	suiteFn: SuiteFn | any[]
) {
	const suite = new Test(nameOrConfig, context => {
		if (Array.isArray(suiteFn))
			suiteFn.forEach(test => context.addTest(test));
		else suiteFn(context.test.bind(context));
	});
	return suite;
}
