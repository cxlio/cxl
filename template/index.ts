///<amd-module name="@cxl/template"/>
import {
	AttributeObserver,
	findNextNode,
	findNextNodeBySelector,
	on,
	onAction,
	trigger,
} from '@cxl/dom';
import {
	EMPTY,
	ListEvent,
	Observable,
	Operator,
	Subject,
	defer,
	merge,
	observable,
	operatorNext,
	operator,
	of,
	tap,
} from '@cxl/rx';
import type { Bindable } from '@cxl/tsx';
import {
	AttributeEvent,
	Component,
	ComponentAttributeName,
	attributeChanged,
	get,
} from '@cxl/component';

declare module '@cxl/dom' {
	interface CustomEventMap {
		'selectable.action': void;
		'focusable.change': void;
		registable: {
			[K in keyof RegistableMap]: {
				id: K;
				controller?: RegistableMap[K];
			};
		}[keyof RegistableMap];
	}
}

export interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

export interface RegistableMap {
	selectable: SelectableTarget;
}

export interface RegistableDetail<K extends keyof RegistableMap> {
	id: K;
	controller?: RegistableMap[K];
	unsubscribe?: () => void;
}

export interface RegistableEvent<T> {
	type: 'connect' | 'disconnect';
	target: T;
	elements: Set<T>;
}

function isObservedAttribute<T extends Component>(el: T, attr: keyof T) {
	return (el.constructor as typeof Component).observedAttributes?.includes(
		attr as string
	);
}

export function sortBy<T, K extends keyof T = keyof T>(key: K) {
	return (a: T, b: T) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
}

export function getSearchRegex(term: string, flags = 'i') {
	try {
		return new RegExp(term, flags);
	} catch (e) {
		return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
	}
}

export function getAttribute<
	T extends Node,
	K extends ComponentAttributeName<T>
>(el: T, name: K) {
	const attr$ =
		el instanceof Component &&
		(el.attributes$ as Subject<AttributeEvent<T>>);
	const observer =
		attr$ && isObservedAttribute(el, name)
			? attr$.filter(ev => ev.attribute === name)
			: new AttributeObserver(el).filter(ev => ev.value === name);

	return merge<Observable<T[K]>[]>(
		observer.map(() => el[name]),
		defer(() => of(el[name]))
	);
}

export function sync<T>(
	getA: Observable<T>,
	setA: (val: T) => void,
	getB: Observable<T>,
	setB: (val: T) => void,
	value?: T
) {
	return merge(
		getA.filter(val => val !== value).tap(val => setB((value = val))),
		getB.filter(val => val !== value).tap(val => setA((value = val)))
	);
}

export type CommonKeys<T, T2> = keyof {
	[K in keyof T]: K extends ComponentAttributeName<T2> ? T[K] : never;
};

export type CommonProperties<T, T2> = {
	[K in CommonKeys<T, T2>]: K extends ComponentAttributeName<T2>
		? T[K] extends T2[K]
			? T[K]
			: never
		: never;
};

export function syncAttribute<T extends Node, T2 extends Node>(
	A: T,
	B: T2,
	attr: keyof CommonProperties<T, T2>
) {
	return sync(
		getAttribute(A, attr),
		val => (A[attr] = val),
		getAttribute(B, attr as keyof T2) as unknown as Observable<T[keyof T]>,
		val => (B[attr as keyof T2] = val as unknown as T2[keyof T2]),
		B[attr as keyof T2] as unknown as T[keyof T]
	);
}

interface NextObservable<T> extends Observable<T> {
	next(val: T): void;
}

export function syncElement<T>(
	el: ElementWithValue<T>,
	read: Observable<T>,
	write: (val: T) => void
) {
	return read.switchMap(initial => {
		el.value = initial;
		return sync(onValue(el), val => (el.value = val), read, write);
	});
}

export function model<T>(el: ElementWithValue<T>, ref: NextObservable<T>) {
	return ref.switchMap(initial => {
		el.value = initial;
		return sync(
			onValue(el),
			val => (el.value = val),
			ref,
			ref.next.bind(ref)
		);
	});
}

export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T) {
	return merge(on(el, 'input'), on(el, 'change')).map(
		ev => (ev.target as T).value
	);
	//.raf();
}

const LOG = tap(val => console.log(val));

declare module '../rx' {
	interface Observable<T> {
		is(equalTo: T): Observable<boolean>;
		log(): Observable<T>;
		raf(fn?: (val: T) => void): Observable<T>;
		select<K extends keyof T>(key: K): Observable<T[K]>;
	}
}

Observable.prototype.log = function () {
	return this.pipe(LOG);
};

Observable.prototype.raf = function (fn?: (val: unknown) => void) {
	return this.pipe(raf(fn));
};

Observable.prototype.is = function (equalTo: unknown) {
	return this.pipe(is(equalTo));
};

export function is<T>(equalTo: T) {
	return operatorNext<T, boolean>(
		subs => (val: T) => subs.next(val === equalTo)
	);
}

/**
 * debounce using requestAnimationFrame
 */
export function raf<T>(fn?: (val: T) => void) {
	return operator<T>(subscriber => {
		let to: number,
			completed = false;

		return {
			next(val: T) {
				if (to) cancelAnimationFrame(to);
				to = requestAnimationFrame(() => {
					if (fn) fn(val);
					subscriber.next(val);
					to = 0;
					if (completed) subscriber.complete();
				});
			},
			error(e) {
				subscriber.error(e);
			},
			complete() {
				if (to) completed = true;
				else subscriber.complete();
			},
			unsubscribe() {
				if (to) cancelAnimationFrame(to);
			},
		};
	});
}

export function log<T>() {
	return LOG as Operator<T>;
}

/*
 * Portal
 */
const portals = new Map<string, HTMLElement>();

export function portal(id: string) {
	return (el: HTMLElement) => {
		portals.set(id, el);
		return new Observable(() => () => portals.delete(id));
	};
}

export function teleport(el: Node, portalName: string) {
	return new Observable<HTMLElement>(subs => {
		requestAnimationFrame(() => {
			const portal = portals.get(portalName);
			if (!portal)
				throw new Error(`Portal "${portalName}" does not exist`);
			portal.appendChild(el);
			subs.next(portal);
		});
		return () => el.parentElement?.removeChild(el);
	});
}

class Marker {
	private children: Node[] = [];
	node = document.createComment('marker');

	insert(content: Node, nextNode: Node = this.node) {
		if (content instanceof DocumentFragment) {
			this.children.push(...content.childNodes);
		} else this.children.push(content);
		this.node.parentNode?.insertBefore(content, nextNode);
	}

	remove(node: Node) {
		const index = this.children.indexOf(node);
		if (index === -1) throw new Error('node not found');
		this.children.splice(index, 1);
		const parent = this.node.parentNode;
		if (!parent) return;
		parent.removeChild(node);
	}

	empty() {
		const parent = this.node.parentNode;
		if (!parent) return;
		this.children.forEach(snap => parent.removeChild(snap));
		this.children.length = 0;
	}
}

export function list<T, K>(
	source: Observable<ListEvent<T, K>>,
	renderFn: (item: T) => Node
) {
	return (host: Bindable) => {
		const marker = new Marker();
		const map = new Map<K, Node | Node[]>();
		host.bind(
			source.tap(ev => {
				if (ev.type === 'insert') {
					const node = renderFn(ev.item);
					map.set(
						ev.key,
						node instanceof DocumentFragment
							? Array.from(node.childNodes)
							: node
					);
					marker.insert(node);
				} else if (ev.type === 'remove') {
					const node = map.get(ev.key);
					if (Array.isArray(node))
						node.forEach(n => marker.remove(n));
					else if (node) marker.remove(node);
				} else if (ev.type === 'empty') marker.empty();
			})
		);
		return marker.node;
	};
}

export function render<T>(
	source: Observable<T>,
	renderFn: (item: T) => Node,
	loading?: () => Node,
	error?: (e: unknown) => Node
) {
	return (host: Bindable) => {
		const marker = new Marker();
		if (loading)
			host.bind(
				observable(() => {
					marker.insert(loading());
				})
			);

		host.bind(
			source
				.tap(item => {
					marker.empty();
					marker.insert(renderFn(item));
				})
				.catchError(e => {
					if (error) {
						marker.empty();
						marker.insert(error(e));
						return EMPTY;
					}
					throw e;
				})
		);

		return marker.node;
	};
}

export function each<T>(
	source: Observable<Iterable<T>>,
	renderFn: (item: T, index: number, source: Iterable<T>) => Node | undefined,
	empty?: () => Node
) {
	const marker = new Marker();

	return (host: Bindable) => {
		host.bind(
			source.tap(arr => {
				marker.empty();
				let len = 0;
				for (const item of arr) {
					const node = renderFn(item, len, arr);
					if (node) {
						marker.insert(node);
						len++;
					}
				}
				if (empty && len === 0) marker.insert(empty());
			})
		);

		return marker.node;
	};
}

type AriaProperties = {
	atomic: string;
	autocomplete: string;
	busy: string;
	checked: string;
	controls: string;
	current: string;
	describedby: string;
	details: string;
	disabled: string;
	dropeffect: string;
	errormessage: string;
	expanded: string;
	flowto: string;
	grabbed: string;
	haspopup: string;
	hidden: string;
	invalid: string;
	keyshortcuts: string;
	label: string;
	labelledby: string;
	level: string;
	live: string;
	orientation: string;
	owns: string;
	placeholder: string;
	pressed: string;
	readonly: string;
	required: string;
	selected: string;
	sort: string;
	valuemax: string;
	valuemin: string;
	valuenow: string;
	valuetext: string;
	modal: string;
	multiline: string;
	multiselectable: string;
	relevant: string;
	roledescription: string;
};

type AriaProperty = keyof AriaProperties;
export type AriaAttributeName = `aria-${AriaProperty}`;

function attrInitial<T extends Component>(name: string, value: string) {
	return (ctx: T) =>
		observable(() => {
			if (!ctx.hasAttribute(name)) ctx.setAttribute(name, value);
		});
}

export function aria<T extends Component>(prop: AriaProperty, value: string) {
	return attrInitial<T>(`aria-${prop}`, value);
}

export function ariaValue(host: Element, prop: AriaProperty) {
	return tap<string | number | boolean>(val =>
		host.setAttribute(
			'aria-' + prop,
			val === true ? 'true' : val === false ? 'false' : val.toString()
		)
	);
}

export function ariaChecked(host: Element) {
	return tap<boolean | undefined>(val =>
		host.setAttribute(
			'aria-checked',
			val === undefined ? 'mixed' : val ? 'true' : 'false'
		)
	);
}

export function role<T extends Component>(roleName: string) {
	return attrInitial<T>('role', roleName);
}

type SelectableNode = HTMLElement;
//interface SelectableNode extends ParentNode, EventTarget {}

function handleListArrowKeys(
	{ getNext, getPrevious }: NavigationOptions,
	//el: Element | null,
	//selector: string,
	ev: KeyboardEvent
) {
	let el: Element | null;
	const key = ev.key;
	if (key === 'ArrowDown' || key === 'ArrowRight') {
		el = getNext();
	} else if (key === 'ArrowUp' || key === 'ArrowLeft') {
		el = getPrevious();
	} else return null;
	if (el) ev.preventDefault();

	return el;
}

export interface NavigationOptions {
	host: HTMLElement;
	getNext(): Element | null;
	getPrevious(): Element | null;
}

export interface NavigationMenuOptions extends NavigationOptions {
	getFirst(): Element | null;
	getLast(): Element | null;
	escape?(): void;
}

function buildNavigationOptions(
	host: SelectableNode,
	selector: string,
	startSelector = selector
) {
	let el = host.querySelector(startSelector);
	return {
		host,
		getNext() {
			if (el) el = findNextNodeBySelector(host, el, selector) || el;
			else {
				const first = host.querySelector(selector);

				if (first)
					el = first.matches(selector)
						? first
						: findNextNodeBySelector(host, first, selector);
			}
			return el;
		},
		getPrevious() {
			if (el) el = findNextNodeBySelector(host, el, selector, -1) || el;
			else {
				const all = host.querySelectorAll(selector);
				const first = all[all.length - 1];

				if (first)
					el = first.matches(selector)
						? first
						: findNextNodeBySelector(host, first, selector, -1);
			}
			return el;
		},
	};
}

export function navigationMenu(options: NavigationMenuOptions) {
	return on(options.host, 'keydown')
		.map(ev => {
			/*if (ev.key === 'Tab') {
				const el = ev.shiftKey
					? options.getPrevious() || options.getLast()
					: options.getNext() || options.getFirst();
				if (el) return ev.preventDefault(), el;
			} else*/ if (ev.key === 'Escape') {
				options.escape?.();
			} else if (ev.key === 'Home') {
				return options.getFirst();
			} else if (ev.key === 'End') {
				return options.getLast();
			} else return handleListArrowKeys(options, ev);
		})
		.filter(el => !!el);
}

/**
 * Handles list keyboard navigation (up and down only), emits the next selected item.
 */
export function navigationListUpDown(
	host: SelectableNode,
	selector: string,
	startSelector = selector,
	input: EventTarget = host
) {
	return on(input, 'keydown')
		.map(ev =>
			handleListArrowKeys(
				buildNavigationOptions(host, selector, startSelector),
				ev
			)
		)
		.filter(el => !!el);
}

/**
 * Handles keyboard navigation, emits the next selected item.
 */
export function navigationList(
	host: SelectableNode,
	selector: string,
	startSelector: string,
	input: HTMLElement | Window = host
): Observable<HTMLElement> {
	return on(input, 'keydown')
		.map(ev => {
			let el = host.querySelector(startSelector);
			const key = ev.key;

			function findByFirstChar(item: Element) {
				return (
					item.matches?.(selector) &&
					item.textContent?.[0].toLowerCase() === key
				);
			}

			const newEl = handleListArrowKeys(
				buildNavigationOptions(host, selector, startSelector),
				ev
			);
			if (newEl) return newEl;

			if (/^\w$/.test(key)) {
				const first = host.firstElementChild;
				el =
					(el && findNextNode(el, findByFirstChar)) ||
					(first && findNextNode(first, findByFirstChar)) ||
					null;
				ev.preventDefault();
			}
			return el;
		})
		.filter(el => !!el);
}
export interface FocusableComponent extends Component {
	disabled: boolean;
	touched: boolean;
}

export function focusableEvents<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return merge(
		on(element, 'blur').tap(() => (host.touched = true)),
		attributeChanged(host, 'disabled').tap(() =>
			trigger(host, 'focusable.change', {})
		),
		attributeChanged(host, 'touched').tap(() =>
			trigger(host, 'focusable.change', {})
		)
	);
}

export function disabledAttribute(host: Component & { disabled: boolean }) {
	return get(host, 'disabled').tap(value =>
		value
			? host.setAttribute('aria-disabled', 'true')
			: host.removeAttribute('aria-disabled')
	);
}

export function focusableDisabled<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return disabledAttribute(host).tap(value => {
		if (value) element.removeAttribute('tabindex');
		else element.tabIndex = 0;
	});
}

export function focusable<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return merge(
		focusableDisabled(host, element),
		focusableEvents(host, element)
	);
}

export function registable<K extends keyof RegistableMap>(
	id: K,
	host: RegistableMap[K]
): Observable<never>;
export function registable<K extends keyof RegistableMap>(
	id: K,
	host: HTMLElement,
	controller: RegistableMap[K]
): Observable<never>;
export function registable<K extends keyof RegistableMap>(
	id: K,
	host: HTMLElement,
	controller?: RegistableMap[K]
) {
	return observable<never>(() => {
		const detail: RegistableDetail<K> = { id, controller };
		trigger(host, 'registable', { detail, bubbles: true });
		return () => detail.unsubscribe?.();
	});
}

export function debounceImmediate<A extends unknown[], R>(fn: (...a: A) => R) {
	let to: boolean;
	return function (this: unknown, ...args: A) {
		if (to) return;
		to = true;
		queueMicrotask(() => {
			fn.apply(this, args);
			to = false;
		});
	};
}

export function registableHost<K extends keyof RegistableMap>(
	id: K,
	host: EventTarget,
	elements = new Set<RegistableMap[K]>()
) {
	return observable<RegistableEvent<RegistableMap[K]>>(subs => {
		function register(ev: CustomEvent) {
			if (ev.target) {
				const detail = ev.detail;
				const target = (detail.controller ||
					ev.target) as RegistableMap[K];
				elements.add(target);
				ev.detail.unsubscribe = () => {
					elements.delete(target);
					subs.next({ type: 'disconnect', target, elements });
				};
				subs.next({ type: 'connect', target, elements });
			}
		}

		const inner = on(host, 'registable')
			.filter(ev => ev.detail.id === id)
			.subscribe(register);
		return () => inner.unsubscribe();
	});
}

export interface SelectableTarget extends Component {
	value: unknown;
	selected: boolean;
	view?: typeof Component;
}

interface SelectableBase<T> extends Element {
	options: Set<T>;
	optionView: typeof Component;
}

interface SelectableHost<T> extends SelectableBase<T> {
	selected?: T;
}

interface SelectableMultiHost<T> extends SelectableBase<T> {
	selected: Set<T>;
}

export function selectableHostMultiple<TargetT extends SelectableTarget>(
	host: SelectableMultiHost<TargetT>,
	getInput: Observable<HTMLElement & { value: unknown }>
) {
	return new Observable<TargetT>(subscriber => {
		let value: unknown[] | undefined;
		function setSelected(option: TargetT) {
			subscriber.next(option);
		}

		function onChange() {
			const { options, selected } = host;

			for (const o of options) {
				if (o.hidden || !o.parentNode) continue;
				if (value === undefined) {
					if (o.selected && !selected.has(o)) setSelected(o);
				} else if (value.indexOf(o.value) !== -1) {
					if (!selected.has(o)) setSelected(o);
				} else {
					o.selected = false;
					if (selected.has(o)) setSelected(o);
				}
			}
		}

		const subscription = merge(
			registableHost('selectable', host, host.options).tap(ev => {
				if (ev.type === 'connect') {
					const o = ev.target as TargetT;
					o.view = host.optionView;
					if (o.selected && !host.selected.has(o)) setSelected(o);
				}
			}),
			getInput
				.switchMap(input =>
					getAttribute(input, 'value').tap(v => {
						if (!Array.isArray(v))
							return (input.value = Array.from(host.selected).map(
								o => o.value
							));
						value = v as unknown[];
					})
				)
				.tap(onChange),
			on(host, 'selectable.action').tap(ev => {
				if (ev.target && host.options?.has(ev.target as TargetT)) {
					ev.stopImmediatePropagation();
					ev.stopPropagation();
					setSelected(ev.target as TargetT);
				}
			})
		).subscribe();

		return () => subscription.unsubscribe();
	});
}

/**
 * Handles element selection events. Emits everytime a new item is selected.
 */
export function selectableHost<TargetT extends SelectableTarget>(
	host: SelectableHost<TargetT>,
	input: Observable<HTMLElement & { value: unknown }>,
	op?: { force: boolean }
) {
	return new Observable<TargetT | undefined>(subscriber => {
		let inputEl: HTMLElement & { value: unknown };
		function setSelected(option: TargetT | undefined) {
			if (option !== host.selected) subscriber.next(option);
		}

		function onChange() {
			const { options, selected } = host;
			let first;
			const value = inputEl?.value;

			if (!inputEl || (selected && selected.value === value)) return;

			for (const o of options) {
				if (o.hidden || !o.parentNode) continue;
				first ||= o;
				if (o.value === value) return setSelected(o);
				else o.selected = false;
			}

			if (op?.force !== false && value === undefined && first)
				setSelected(first);
			else setSelected(undefined);
		}

		const subscription = merge(
			input.switchMap(input => {
				inputEl = input;
				return getAttribute(input, 'value').tap(onChange);
			}),
			registableHost('selectable', host, host.options)
				.tap(ev => {
					if (ev.type === 'connect') ev.target.view = host.optionView;
					onChange();
				})
				.debounceTime(0)
				.tap(onChange),
			on(host, 'selectable.action').tap(ev => {
				if (ev.target && host.options?.has(ev.target as TargetT)) {
					ev.stopImmediatePropagation();
					ev.stopPropagation();
					setSelected(ev.target as TargetT);
				}
			})
		).subscribe();

		return () => subscription.unsubscribe();
	});
}

export function selectable<T extends SelectableTarget>(host: T) {
	return merge(
		registable('selectable', host),
		onAction(host).tap(() =>
			trigger(host, 'selectable.action', { bubbles: true })
		),
		get(host, 'selected').pipe(ariaValue(host, 'selected'))
	);
}

export interface CheckedComponent extends Component {
	value: unknown;
	checked: boolean | undefined;
}

export function checkedBehavior<T extends CheckedComponent>(host: T) {
	let first = true;
	return merge(
		get(host, 'value')
			.tap(val => {
				if (first) {
					if (val === true) host.checked = true;
					first = false;
				} else host.checked = val === true;
			})
			.filter(() => false),
		get(host, 'checked').pipe(ariaChecked(host))
	);
}

export function $onAction<T extends Element>(
	cb: (ev: KeyboardEvent | MouseEvent) => void
) {
	return (el: T) => onAction(el).tap(cb);
}

export function staticTemplate(template: () => Node) {
	let rendered: Node;
	return () => {
		return (rendered || (rendered = template())).cloneNode(true);
	};
}

export function setClassName(el: HTMLElement) {
	let className: string;
	return tap<string>(newClass => {
		if (className !== newClass) {
			el.classList.remove(className);
			className = newClass;
			if (className) el.classList.add(className);
		}
	});
}

const ENTITIES_REGEX = /[&<>]/g,
	ENTITIES_MAP = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
	};

export function escapeHtml(str: string) {
	return (
		str &&
		str.replace(
			ENTITIES_REGEX,
			e => ENTITIES_MAP[e as keyof typeof ENTITIES_MAP] || ''
		)
	);
}
