import { subject, toPromise } from '@cxl/rx';

export type Measurements = Record<string, any>;

type EventType = 'afterAll' | 'afterEach' | 'beforeAll' | 'beforeEach';
type TestEvent = { type: EventType; promises: Promise<any>[] };

type TestFn<T = TestApi> = (test: T) => void | Promise<any>;
type SuiteFn<T = TestFn> = (
	suiteFn: (name: string, testFn: T, only?: boolean) => void
) => void;

type FunctionsOf<T> = {
	[K in keyof T]: T[K] extends (...args: any) => any ? T[K] : never;
};

type ParametersOf<T, K extends keyof T> = Parameters<FunctionsOf<T>[K]>;

interface Spy<EventT> {
	lastEvent?: EventT;
	destroy(): void;
	then(
		resolve: (ev: EventT) => void,
		reject: (e: any) => void
	): Promise<EventT>;
}

interface SpyFn<ParametersT, ResultT> {
	/// Number of times the function was called.
	called: number;
	arguments: ParametersT;
	result: ResultT;
}

interface SpyProp<T> {
	setCount: number;
	getCount: number;
	value: T;
}

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

export class TestApi {
	readonly id = lastTestId++;

	constructor(private $test: Test) {}

	/**
	 * Returns a connected dom element. Cleaned up after test completion.
	 */
	get dom() {
		const el = this.$test.domContainer || document.createElement('DIV');
		if (!this.$test.domContainer)
			document.body.appendChild((this.$test.domContainer = el));

		return el;
	}

	afterAll(fn: () => Promise<any> | void) {
		this.$test.events.subscribe(ev => {
			if (ev.type === 'afterAll') {
				const result = fn();
				if (result) ev.promises.push(result);
			}
		});
	}

	ok(condition: any, message = 'Assertion failed') {
		this.$test.results.push({ success: !!condition, message });
	}

	assert(condition: any, message = 'Assertion Failed'): asserts condition {
		if (!condition) throw new Error(message);
		this.$test.results.push({ success: !!condition, message });
	}

	equal<T>(a: T, b: T, desc?: string) {
		return this.ok(
			a === b,
			`${desc ? desc + ': ' : ''}${inspect(a)} should equal ${inspect(b)}`
		);
	}

	ran(n: number) {
		const results = this.$test.results;
		return this.ok(
			n === results.length,
			`Expected ${n} assertions, instead got ${results.length}`
		);
	}

	async() {
		let result: () => void;
		let called = false;
		if (this.$test.promise)
			throw new Error('async() called multiple times');

		this.$test.promise = this.$test.doTimeout(
			new Promise<void>(resolve => (result = resolve))
		);
		return () => {
			if (called)
				this.$test.pushError(new Error('Test was already completed.'));
			result();
			called = true;
		};
	}

	measure(measurements: Measurements) {
		for (const selector in measurements) {
			const elements = this.dom.querySelectorAll(selector);
			if (elements.length === 0)
				throw new Error(
					`Measurement failed. Could not find elements matching "${selector}".`
				);

			elements.forEach(el => {
				const styles = getComputedStyle(el);
				const compare = measurements[selector];
				for (const styleName in compare) {
					this.equal(
						(styles as any)[styleName],
						compare[styleName],
						`"${styleName} should be "${compare[styleName]}"`
					);
				}
			});
		}
	}

	/**
	 * You can use testOnly instead of test to specify which tests are the only ones
	 * you want to run in that test file.
	 */
	testOnly(name: string, testFn: TestFn) {
		this.$test.tests.push(new Test(name, testFn));
		this.$test.only.push(new Test(name, testFn));
	}

	test(name: string, testFn: TestFn) {
		this.$test.tests.push(new Test(name, testFn));
	}

	spyFn<T, K extends keyof FunctionsOf<T>>(object: T, method: K) {
		const spy = spyFn(object, method);
		this.$test.events.subscribe({
			complete: spy.destroy,
		});
		return spy;
	}

	spyProp<T, K extends keyof T>(object: T, prop: K) {
		const spy = spyProp(object, prop);
		this.$test.events.subscribe({
			complete: spy.destroy,
		});
		return spy;
	}

	/** Returns a connected element */
	element<K extends keyof HTMLElementTagNameMap>(
		tagName: K
	): HTMLElementTagNameMap[K];
	element(tagName: string): HTMLElement;
	element(tagName: string) {
		const el = document.createElement(tagName);
		this.dom.appendChild(el);
		return el;
	}

	testEvent<T extends HTMLElement>(
		el: T,
		name: string,
		trigger: (el: T) => void
	) {
		this.test(`on${name}`, a => {
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

export class Test {
	name: string;
	promise?: Promise<any>;
	results: Result[] = [];
	tests: Test[] = [];
	only: Test[] = [];
	timeout = 5 * 1000;
	domContainer?: Element;
	events = subject<TestEvent>();
	completed = false;

	constructor(nameOrConfig: string | TestConfig, public testFn: TestFn) {
		if (typeof nameOrConfig === 'string') this.name = nameOrConfig;
		else this.name = nameOrConfig.name;
	}

	pushError(e: Error | string) {
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
				this.completed = true;
				clearTimeout(timeoutId);
				resolve();
			}, reject);
		});
	}

	addTest(test: Test) {
		this.tests.push(test);
	}

	async emit(type: EventType) {
		const ev: TestEvent = { type, promises: [] };
		this.events.next(ev);
		if (ev.promises) await Promise.all(ev.promises);
	}

	async run(): Promise<Result[]> {
		try {
			const testApi = new TestApi(this);
			const result = this.testFn(testApi);
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
			await this.emit('afterAll');
		}

		this.events.complete();
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

function spyFn<T, K extends keyof FunctionsOf<T>>(object: T, method: K) {
	const sub = subject<SpyFn<ParametersOf<T, K>, T[K]>>();
	const originalFn: T[K] = object[method];
	const spy: Spy<SpyFn<ParametersOf<T, K>, T[K]>> = {
		destroy() {
			object[method] = originalFn;
			sub.complete();
		},
		then(resolve: any, reject: any) {
			return toPromise(sub.first()).then(ev => {
				resolve(ev);
				return ev;
			}, reject);
		},
	};
	let called = 0;

	const spyFn: T[K] = function (this: any, ...args: any) {
		called++;
		const result = (originalFn as any).apply(this, args);
		sub.next((spy.lastEvent = { called, arguments: args, result }));
		return result;
	} as any;
	object[method] = spyFn;

	return spy;
}

function spyProp<T, K extends keyof T>(object: T, prop: K) {
	let value: T[K] = object[prop];
	let setCount = 0;
	let getCount = 0;
	const sub = subject<SpyProp<T[K]>>();
	const result: Spy<SpyProp<T[K]>> = {
		destroy() {
			sub.complete();
			Object.defineProperty(object, prop, { configurable: true, value });
		},
		then(resolve: any, reject: any) {
			return toPromise(sub.first()).then(ev => {
				resolve(ev);
				return ev;
			}, reject);
		},
	};

	Object.defineProperty(object, prop, {
		configurable: true,
		get() {
			getCount++;
			sub.next((result.lastEvent = { setCount, getCount, value }));
			return value;
		},
		set(newValue: T[K]) {
			setCount++;
			value = newValue;
			sub.next((result.lastEvent = { setCount, getCount, value }));
		},
	});

	return result;
}

export function spec(name: string | TestConfig, fn: TestFn) {
	return new Test(name, fn);
}

/**
 * @deprecated Use spec instead.
 */
export function suite(
	nameOrConfig: string | TestConfig,
	suiteFn: SuiteFn | any[]
) {
	if (Array.isArray(suiteFn)) {
		const result = new Test(nameOrConfig, () => {
			/* nop */
		});
		suiteFn.forEach(test => result.addTest(test));
		return result;
	} else return new Test(nameOrConfig, ctx => suiteFn(ctx.test.bind(ctx)));
}
