type TestFn = (test: Test) => void;
type SuiteFn = (suiteFn: (name: string, testFn: TestFn) => void) => void;

declare function setTimeout(fn: () => any, n?: number): number;
declare function clearTimeout(n: number): void;

export interface Result {
	success: boolean;
	message: string | Error;
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
	private domElement?: Element;

	private completed = false;

	constructor(nameOrConfig: string | TestConfig, public testFn: TestFn) {
		if (typeof nameOrConfig === 'string') this.name = nameOrConfig;
		else this.name = nameOrConfig.name;
	}

	get dom() {
		if (this.domElement) return this.domElement;

		const el = (this.domElement = document.createElement('DIV'));
		document.body.appendChild(el);
		return el;
	}

	ok(condition: any, message = '') {
		this.results.push({ success: !!condition, message });
	}

	equal<T>(a: T, b: T, desc?: string) {
		return this.ok(a === b, desc || `${a} should equal ${b}`);
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
				this.results.push({
					success: false,
					message: 'Async test timed out'
				});
				reject();
			}, this.timeout);
		});
		return () => {
			if (this.completed) throw new Error('Test was already completed.');
			this.completed = true;
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
			if (this.promise && this.completed === false)
				throw new Error('Never completed');
			await Promise.all(this.tests.map(test => test.run()));

			if (this.domElement && this.domElement.parentNode)
				this.domElement.parentNode.removeChild(this.domElement);
		} catch (message) {
			this.results.push({ success: false, message });
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
