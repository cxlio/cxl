type TestFn = (test: Test) => void | Promise<any>;
type SuiteFn<T = TestFn> = (
	suiteFn: (name: string, testFn: T, only?: boolean) => void
) => void;

declare function setTimeout(fn: () => any, n?: number): number;
declare function clearTimeout(n: number): void;
declare const document: any;
declare const console: any;

export interface Result {
	success: boolean;
	message: string;
	stack?: any;
}

interface TestConfig {
	name: string;
}

interface Element {
	parentNode: Element | null;
	removeChild(child: any): void;
	appendChild(child: any): void;
}

let lastTestId = 1;

function inspect(val: any) {
	if (typeof val === 'string') return '"' + val + '"';

	return val;
}

export class Test {
	readonly id = lastTestId++;
	name: string;
	promise?: Promise<any>;
	results: Result[] = [];
	tests: Test[] = [];
	only: Test[] = [];
	timeout = 5 * 1000;
	private domElement?: Element;

	private completed = false;

	constructor(nameOrConfig: string | TestConfig, public testFn: TestFn) {
		if (typeof nameOrConfig === 'string') this.name = nameOrConfig;
		else this.name = nameOrConfig.name;
	}

	/**
	 * Returns a connected dom element. Cleaned up after test completion.
	 */
	get dom() {
		if (this.domElement) return this.domElement;

		const el = (this.domElement = document.createElement('DIV'));
		document.body.appendChild(el);
		return el;
	}

	log(...args: any[]) {
		console.log(...args);
	}

	ok(condition: any, message = 'Assertion failed') {
		this.results.push({ success: !!condition, message });
	}

	assert(
		condition: any,
		message: string = 'Assertion Failed'
	): asserts condition {
		if (!condition) throw new Error(message);
		this.results.push({ success: condition, message });
	}

	equal<T>(a: T, b: T, desc?: string) {
		return this.ok(
			a === b,
			desc || `${inspect(a)} should equal ${inspect(b)}`
		);
	}

	ran(n: number) {
		return this.ok(
			n === this.results.length,
			`Expected ${n} assertions, instead got ${this.results.length}`
		);
	}

	protected pushError(e: Error | string) {
		this.results.push(
			e instanceof Error
				? { success: false, message: e.message, stack: e.stack }
				: { success: false, message: e }
		);
	}

	doTimeout(promise: Promise<any>, time = this.timeout) {
		return new Promise<void>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject('Async test timed out');
			}, time);

			promise.then(() => {
				if (this.completed)
					throw new Error('Test was already completed.');
				this.completed = true;
				clearTimeout(timeoutId);
				resolve();
			});
		});
	}

	async() {
		let result: () => void;
		this.promise = this.doTimeout(
			new Promise<void>(resolve => (result = resolve))
		);
		return () => result();
	}

	test(name: string, testFn: TestFn, only = false) {
		this.tests.push(new Test(name, testFn));
		if (only) this.only.push(new Test(name, testFn));
	}

	addTest(test: Test) {
		this.tests.push(test);
	}

	async run(): Promise<Result[]> {
		try {
			const result = this.testFn(this);
			const promise = result ? this.doTimeout(result) : this.promise;
			await promise;
			if (promise && this.completed === false)
				throw new Error('Never completed');
			if (this.only.length)
				await Promise.all(this.only.map(test => test.run()));
			else if (this.tests.length)
				await Promise.all(this.tests.map(test => test.run()));
		} catch (e) {
			this.pushError(e);
		}

		if (this.domElement && this.domElement.parentNode)
			this.domElement.parentNode.removeChild(this.domElement);

		return this.results;
	}
}

/**
 * special suite for Web Components
export class Spec<T extends HTMLElement> extends Test {

	constructor(public Component: T, fn: SuiteFn<Spec<T>>) {
		const tagName = (Component as any).tagName;
		super(tagName, fn);
	}

}

export function spec<T extends HTMLElement>(symbol: T, fn: SuiteFn<Spec<T>>) {
	return new Spec<T>(symbol, fn);
}
 */

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
