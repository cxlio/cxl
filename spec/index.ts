type TestFn<T = Test> = (test: T) => void | Promise<any>;
type SuiteFn<T = TestFn> = (
	suiteFn: (name: string, testFn: T, only?: boolean) => void
) => void;

export interface Result {
	success: boolean;
	message: string;
	stack?: any;
}

interface TestConfig {
	name: string;
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
	private domContainer?: Element;
	private completed = false;

	constructor(nameOrConfig: string | TestConfig, public testFn: TestFn) {
		if (typeof nameOrConfig === 'string') this.name = nameOrConfig;
		else this.name = nameOrConfig.name;
	}

	/**
	 * Returns a connected dom element. Cleaned up after test completion.
	 */
	get dom(): Element {
		const el = this.domContainer || document.createElement('DIV');
		if (!this.domContainer)
			document.body.appendChild((this.domContainer = el));

		return el;
	}

	log(...args: any[]) {
		console.log(...args);
	}

	ok(condition: any, message = 'Assertion failed') {
		this.results.push({ success: !!condition, message });
	}

	assert(condition: any, message = 'Assertion Failed'): asserts condition {
		if (!condition) throw new Error(message);
		this.results.push({ success: !!condition, message });
	}

	equal<T>(a: T, b: T, desc?: string) {
		return this.ok(
			a === b,
			`${desc ? desc + ': ' : ''}${inspect(a)} should equal ${inspect(b)}`
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
				reject(new Error('Async test timed out'));
			}, time);

			promise.then(() => {
				if (this.completed)
					reject(new Error('Test was already completed.'));
				this.completed = true;
				clearTimeout(timeoutId);
				resolve();
			}, reject);
		});
	}

	async() {
		let result: () => void;
		this.promise = this.doTimeout(
			new Promise<void>(resolve => (result = resolve))
		);
		return () => result();
	}

	/**
	 * Create a component test
	 */
	component<T extends HTMLElement>(
		tagName: string,
		testFn: TestFn<ComponentTest<T>>
	) {
		this.tests.push(new ComponentTest(tagName, testFn));
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
			if (this.domContainer && this.domContainer.parentNode)
				this.domContainer.parentNode.removeChild(this.domContainer);
		} catch (e) {
			this.pushError(e);
		} finally {
			this.domContainer = undefined;
		}

		return this.results;
	}

	toJSON(): any {
		return {
			name: this.name,
			results: this.results,
			tests: this.tests.map(r => r.toJSON()),
			only: this.only.map(r => r.toJSON()),
		};
	}
}

/**
 * special suite for Web Components
 */
export class ComponentTest<T extends HTMLElement = HTMLElement> extends Test {
	constructor(public tagName: string, fn: TestFn<ComponentTest<T>>) {
		super(tagName, fn as TestFn);
	}

	/** Returns a connected element */
	element(tagName = this.tagName): T {
		const el = document.createElement(tagName) as T;
		this.dom.appendChild(el);
		return el;
	}

	testEvent(name: string, trigger: (el: T) => void) {
		this.test(`on${name}`, a => {
			const el = this.element();
			const resolve = a.async();
			function handler(ev: Event) {
				a.equal(ev.type, name, `"${name}" event fired`);
				el.removeEventListener(name, handler);
				resolve();
			}
			el.addEventListener('change', handler);
			trigger(el);
		});
	}
}

export function spec(name: string | TestConfig, fn: TestFn) {
	return new Test(name, fn);
}

export function suite(
	nameOrConfig: string | TestConfig,
	suiteFn: SuiteFn | any[]
) {
	return new Test(nameOrConfig, context => {
		if (Array.isArray(suiteFn))
			suiteFn.forEach(test => context.addTest(test));
		else suiteFn(context.test.bind(context));
	});
}
