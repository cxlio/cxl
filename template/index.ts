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
	concat,
	defer,
	merge,
	observable,
	operatorNext,
	operator,
	of,
	tap,
	map,
} from '@cxl/rx';
import type { Bindable } from '@cxl/tsx';
import { Component, attributeChanged, get } from '@cxl/component';

export type ValidateFunction<T> = (val: T) => string | true;

export interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

function isObservedAttribute(el: any, attr: any) {
	return (el.constructor as any).observedAttributes?.includes(attr);
}

export function sortBy<T = any, K extends keyof T = any>(key: K) {
	return (a: T, b: T) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
}

export function getSearchRegex(term: string) {
	try {
		return new RegExp(term, 'i');
	} catch (e) {
		return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
	}
}

export function getAttribute<T extends Node, K extends keyof T>(
	el: T,
	name: K
) {
	const attr$ = (el as any).attributes$;
	const observer =
		attr$ && isObservedAttribute(el, name)
			? attr$.filter((ev: any) => ev.attribute === name)
			: new AttributeObserver(el).filter(ev => ev.value === name);
	return concat<Observable<T[K]>[]>(
		defer(() => of(el[name])),
		observer.map(() => el[name])
	);
}

export function triggerEvent<R>(element: EventTarget, event: string) {
	return tap<R>(trigger.bind(null, element, event));
}

export function stopEvent<T extends Event>() {
	return tap<T>((ev: T) => ev.stopPropagation());
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

export function syncAttribute(A: Node, B: Node, attr: string) {
	return sync(
		getAttribute(A, attr as any),
		val => ((A as any)[attr] = val),
		getAttribute(B, attr as any),
		val => ((B as any)[attr] = val),
		(B as any)[attr]
	);
}

interface NextObservable<T> extends Observable<T> {
	next(val: T): void;
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
	return merge(on(el, 'input'), on(el, 'change'))
		.map(ev => (ev.target as T).value)
		.raf();
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

Observable.prototype.raf = function (fn?: (val: any) => void) {
	return this.pipe(raf(fn));
};

Observable.prototype.is = function (equalTo: any) {
	return this.pipe(is(equalTo));
};

Observable.prototype.select = function (key: any) {
	return this.pipe(select(key));
};

export function select<T, K extends keyof T>(key: K) {
	return map((val: T) => val[key]);
}

export function is<T>(equalTo: T) {
	return operatorNext<T, boolean>(subs => (val: T) =>
		subs.next(val === equalTo)
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
	return new Observable<void>(() => {
		requestAnimationFrame(() => {
			const portal = portals.get(portalName);
			if (!portal)
				throw new Error(`Portal "${portalName}" does not exist`);
			portal.appendChild(el);
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

export function loading(source: Observable<any>, renderFn: () => Node) {
	return (host: Bindable) => {
		const marker = new Marker();
		host.bind(
			observable(() => {
				marker.insert(renderFn());
			})
		);
		host.bind(source.tap(() => marker.empty()));
	};
}

export function render<T>(
	source: Observable<T>,
	renderFn: (item: T) => Node,
	loading?: () => Node,
	error?: (e: any) => Node
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
	renderFn: (item: T, index: number) => Node,
	empty?: () => Node
) {
	const marker = new Marker();

	return (host: Bindable) => {
		host.bind(
			source.tap(arr => {
				marker.empty();
				let len = 0;
				for (const item of arr) {
					marker.insert(renderFn(item, len));
					len++;
				}
				if (empty && len === 0) marker.insert(empty());
			})
		);

		return marker.node;
	};
}

/*export function Style(p: { children: Styles }) {
	return renderCSS(p.children);
}

export function Static(p: { children: NativeChildren }): any {
	return staticTemplate(() => dom(dom, undefined, p.children));
}*/

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

interface SelectableNode extends ParentNode, EventTarget {}

/**
 * Handles keyboard navigation, emits the next selected item.
 */
export function navigationList(
	host: SelectableNode,
	selector: string,
	startSelector: string
) {
	return on(host, 'keydown')
		.map(ev => {
			let el = host.querySelector(startSelector);
			const key = ev.key;

			function findByFirstChar(item: Element) {
				return (
					item.matches(selector) &&
					item.textContent?.[0].toLowerCase() === key
				);
			}

			switch (key) {
				case 'ArrowDown':
					if (el) el = findNextNodeBySelector(el, selector) || el;
					else {
						const first = host.firstElementChild;

						if (first)
							el = first.matches(selector)
								? first
								: findNextNodeBySelector(first, selector);
					}
					if (el) ev.preventDefault();

					break;
				case 'ArrowUp':
					if (el)
						el =
							findNextNodeBySelector(
								el,
								selector,
								'previousElementSibling'
							) || el;
					else {
						const first = host.lastElementChild;

						if (first)
							el = first.matches(selector)
								? first
								: findNextNodeBySelector(
										first,
										selector,
										'previousElementSibling'
								  );
					}
					if (el) ev.preventDefault();
					break;
				default:
					if (/^\w$/.test(key)) {
						const first = host.firstElementChild;
						el =
							(el && findNextNode(el, findByFirstChar)) ||
							(first && findNextNode(first, findByFirstChar)) ||
							null;
						ev.preventDefault();
					}
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
		on(element, 'focus').pipe(triggerEvent(host, 'focusable.focus')),
		on(element, 'blur').tap(() => {
			host.touched = true;
			trigger(host, 'focusable.blur');
		}),
		attributeChanged(host, 'disabled').pipe(
			triggerEvent(host, 'focusable.change')
		),
		attributeChanged(host, 'touched').pipe(
			triggerEvent(host, 'focusable.change')
		)
	);
}

export function disabledAttribute<T extends FocusableComponent>(host: T) {
	return get(host, 'disabled').tap(value =>
		host.setAttribute('aria-disabled', value ? 'true' : 'false')
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

export function registable<T extends Component, ControllerT>(
	host: T,
	id: string,
	controller?: ControllerT
) {
	return observable<never>(() => {
		const detail: any = { controller };
		trigger(host, id + '.register', detail);
		return () => detail.unsubscribe?.();
	});
}

export function registableHost<ControllerT>(
	host: EventTarget,
	id: string,
	elements = new Set<ControllerT>()
) {
	return observable<Set<ControllerT>>(subs => {
		function register(ev: CustomEvent) {
			if (ev.target) {
				const detail = ev.detail;
				const target = (detail.controller || ev.target) as ControllerT;
				elements.add(target);
				subs.next(elements);
				ev.detail.unsubscribe = () => {
					elements.delete(target);
					subs.next(elements);
				};
			}
		}

		const inner = on(host, id + '.register').subscribe(register);
		return () => inner.unsubscribe();
	});
}

interface SelectableComponent extends Component {
	selected: boolean;
}

interface SelectableTarget extends Node {
	value: any;
	selected: boolean;
	multiple?: boolean;
}

interface SelectableHost<T> extends Element {
	value?: any;
	options: Set<T>;
	selected?: T;
}

interface SelectableMultiHost<T> extends Element {
	value: any[];
	options: Set<T>;
	selected: Set<T>;
}

export function selectableHostMultiple<TargetT extends SelectableTarget>(
	host: SelectableMultiHost<TargetT>
) {
	return new Observable<TargetT>(subscriber => {
		function setSelected(option: TargetT) {
			subscriber.next(option);
		}

		function onChange() {
			const { value, options } = host;

			for (const o of options) {
				if (value.indexOf(o.value) !== -1) {
					if (!o.selected) setSelected(o);
				} else o.selected = false;
			}
		}

		function setOptions() {
			const { value, options, selected } = host;

			options.forEach(o => (o.multiple = true));

			for (const o of options) {
				if (
					(o.selected && !selected.has(o)) ||
					(!o.selected && value.indexOf(o.value) !== -1)
				)
					setSelected(o);
			}
		}

		const subscription = merge(
			registableHost<TargetT>(host, 'selectable', host.options).tap(
				setOptions
			),
			getAttribute(host, 'value').tap(onChange),
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
	host: SelectableHost<TargetT>
) {
	return new Observable<TargetT | undefined>(subscriber => {
		function setSelected(option: TargetT | undefined) {
			subscriber.next(option);
		}

		function onChange() {
			const { value, options, selected } = host;

			if (selected && selected.value === value) return;

			for (const o of options)
				if (o.parentNode && o.value === value) return setSelected(o);
				else o.selected = false;

			setSelected(undefined);
		}

		function setOptions() {
			const { value, options, selected } = host;

			if (selected && options.has(selected)) return;

			let first: TargetT | null = null;
			for (const o of options) {
				first = first || o;

				if (value === o.value) return setSelected(o);
			}

			if (value === undefined && !selected && first) setSelected(first);
			else if (selected && !selected.parentNode) setSelected(undefined);
		}

		const subscription = merge(
			registableHost<TargetT>(host, 'selectable', host.options)
				.tap(setOptions)
				.raf(setOptions),
			getAttribute(host, 'value').tap(onChange),
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

export function selectable<T extends SelectableComponent>(host: T) {
	return merge(
		registable(host, 'selectable'),
		onAction(host).pipe(
			triggerEvent(host, 'selectable.action'),
			stopEvent()
		),
		get(host, 'selected').pipe(ariaValue(host, 'selected'))
	);
}

interface CheckedComponent extends Component {
	value: any;
	checked: boolean;
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

export function stopChildrenEvents(target: EventTarget, event: string) {
	return on(target, event).tap(ev => {
		if (ev.target !== target) {
			ev.stopPropagation();
			ev.stopImmediatePropagation();
		}
	});
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

interface FormElement<T> extends ElementWithValue<T> {
	setCustomValidity(msg: string): void;
}

export function validateValue<T>(
	el: FormElement<T>,
	...validators: ValidateFunction<T>[]
) {
	return getAttribute(el, 'value').tap(value => {
		let message: string | boolean = true;
		validators.find(validateFn => {
			message = validateFn(value);
			return message !== true;
		});
		el.setCustomValidity(message === true ? '' : (message as any));
	});
}
