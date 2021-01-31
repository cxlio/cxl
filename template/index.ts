import {
	AttributeObserver,
	findNextNode,
	findNextNodeBySelector,
	setContent as domSetContent,
	on,
	onAction,
	trigger,
} from '@cxl/dom';
import {
	ListEvent,
	Observable,
	Operator,
	concat,
	defer,
	merge,
	observable,
	of,
	tap,
} from '@cxl/rx';
import { Bindable, NativeChildren, dom } from '@cxl/tsx';
import { Styles, StyleSheet, render as renderCSS, css } from '@cxl/css';
import {
	Component,
	attributeChanged,
	get,
	staticTemplate,
} from '@cxl/component';

interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

interface ValueElement extends Element {
	value: boolean | undefined;
}

function isObservedAttribute(el: any, attr: any) {
	return (el.constructor as any).observedAttributes?.includes(attr);
}

export function sortBy<T, K extends keyof T>(key: K) {
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
	return tap<R>((val: R) => trigger(element, event, val));
}

export function setAttribute(el: Element, attribute: string) {
	return tap(val => ((el as any)[attribute] = val));
}

export function stopEvent<T extends Event>() {
	return tap<T>((ev: T) => ev.stopPropagation());
}

export function show(el: HTMLElement) {
	return tap<boolean>(val => (el.style.display = val ? '' : 'none'));
}

export function hide(el: HTMLElement) {
	return tap<boolean>(val => (el.style.display = val ? 'none' : ''));
}

export function sync<T>(
	getA: Observable<T>,
	setA: (val: T) => void,
	getB: Observable<T>,
	setB: (val: T) => void
) {
	let value: T;
	return merge(
		getA.tap(val => val !== value && setB((value = val))),
		getB.tap(val => val !== value && setA((value = val)))
	);
}

export function syncAttribute(A: Node, B: Node, attr: string) {
	return sync(
		getAttribute(A, attr as any),
		val => ((A as any)[attr] = val),
		getAttribute(B, attr as any),
		val => ((B as any)[attr] = val)
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

export function setContent(el: Element) {
	return tap((val: any) => domSetContent(el, val));
}

const LOG = tap(val => console.log(val));

declare module '../rx' {
	interface Observable<T> {
		log(): Observable<T>;
		raf(fn?: (val: T) => void): Observable<T>;
	}
}

Observable.prototype.log = function () {
	return this.pipe(LOG);
};

Observable.prototype.raf = function (fn?: (val: any) => void) {
	return this.pipe(raf(fn));
};

/**
 * debounce using requestAnimationFrame
 */
export function raf<T>(fn?: (val: T) => void) {
	return (source: Observable<T>) => {
		let to: number,
			completed = false;

		return new Observable<T>(subscriber => {
			const subs = source.subscribe({
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
					if (to) cancelAnimationFrame(to);
					subscriber.error(e);
				},
				complete() {
					if (to) completed = true;
					else subscriber.complete();
				},
			});
			return () => subs.unsubscribe();
		});
	};
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
		portals.get(portalName)?.appendChild(el);
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
	loading?: () => Node
) {
	const marker = new Marker();
	if (loading) marker.insert(loading());

	return (host: Bindable) => {
		host.bind(
			source.tap(item => {
				marker.empty();
				marker.insert(renderFn(item));
			})
		);

		return marker.node;
	};
}

export function each<T>(
	source: Observable<T[]>,
	renderFn: (item: T) => Node,
	empty?: () => Node
) {
	const marker = new Marker();

	return (host: Bindable) => {
		host.bind(
			source.tap(arr => {
				marker.empty();
				if (arr.length)
					for (const item of arr) marker.insert(renderFn(item));
				else if (empty) marker.insert(empty());
			})
		);

		return marker.node;
	};
}

export function Style(p: { children: Styles }) {
	return renderCSS(p.children);
}

export function Static(p: { children: NativeChildren }): any {
	return staticTemplate(() => dom(dom, undefined, p.children));
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

export function aria<T extends Component>(prop: AriaProperty, value: string) {
	return (ctx: T) =>
		ctx.bind(observable(() => ctx.setAttribute(`aria-${prop}`, value)));
}

export function ariaValue(host: Element, prop: AriaProperty) {
	return tap<string | number>(val =>
		host.setAttribute('aria-' + prop, val.toString())
	);
}

export function ariaProp(host: Element, prop: AriaProperty) {
	return tap<boolean>(val =>
		host.setAttribute('aria-' + prop, val ? 'true' : 'false')
	);
}

export function ariaChecked(host: ValueElement) {
	return tap<boolean>(val =>
		host.setAttribute(
			'aria-checked',
			host.value === undefined ? 'mixed' : val ? 'true' : 'false'
		)
	);
}

export function role<T extends Component>(roleName: string) {
	return (host: T) =>
		host.bind(
			observable(() => {
				const el = host as any;
				!el.hasAttribute('role') && el.setAttribute('role', roleName);
			})
		);
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

interface FocusableComponent extends Component {
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

export const DisabledStyles = {
	cursor: 'default',
	filter: 'saturate(0)',
	opacity: 0.38,
	pointerEvents: 'none',
};

export const StateStyles = {
	$focus: { outline: 0 },
	$disabled: DisabledStyles,
};

const stateStyles = new StyleSheet({ styles: StateStyles });

const disabledCss = css({ $disabled: DisabledStyles });

interface DisableElement extends HTMLElement {
	disabled: boolean;
}

export function focusDelegate<T extends FocusableComponent>(
	host: T,
	delegate: DisableElement
) {
	host.Shadow({ children: disabledCss });
	return merge(
		disabledAttribute(host).tap(val => (delegate.disabled = val)),
		focusableEvents(host, delegate)
	);
}

/**
 * Adds focusable functionality to input components.
 */
export function Focusable(host: Bindable) {
	host.bind(focusable(host as FocusableComponent));
	return stateStyles.clone();
}

export function registable<T extends Component>(host: T, id: string) {
	return new Observable(() => {
		const detail: any = {};
		trigger(host, id + '.register', detail);
		return () => detail.unsubscribe?.();
	});
}

export function registableHost<TargetT extends EventTarget>(
	host: EventTarget,
	id: string,
	elements = new Set<TargetT>()
) {
	return new Observable<Set<TargetT>>(subs => {
		function register(ev: CustomEvent) {
			if (ev.target) {
				elements.add(ev.target as TargetT);
				subs.next(elements);
				ev.detail.unsubscribe = () => {
					elements.delete(ev.target as TargetT);
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
}

interface SelectableHost<T> extends Element {
	value: any;
	options?: Set<T>;
	selected?: T;
}

interface SelectableMultiHost<T> extends Element {
	value: any;
	options?: Set<T>;
	selected?: Set<T>;
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

			if (!options) return;

			for (const o of options) {
				const isFound = value.indexOf(o.value) !== -1;
				if (isFound) {
					if (!o.selected) setSelected(o);
				} else o.selected = false;
			}
		}

		const subscription = merge(
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

			if (!options || (selected && selected.value === value)) return;

			for (const o of options)
				if (o.parentNode && o.value === value) return setSelected(o);
				else o.selected = false;

			setSelected(undefined);
		}

		const subscription = merge(
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
		get(host, 'selected').pipe(ariaProp(host, 'selected'))
	);
}

/**
 * Adds nodes to head on component rendering
 */
export function head(...nodes: Node[]) {
	return (host: Node) => {
		const head = host.ownerDocument?.head || document.head;
		nodes.forEach(child => head.appendChild(child));
	};
}
