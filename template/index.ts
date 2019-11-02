import {
	Operator,
	Subject,
	Observable,
	filter,
	map,
	tap,
	of,
	concat,
	Subscription
} from '../rx';
import {
	VirtualElement,
	SlotManager,
	AttributeObserver,
	ChildrenObserver
} from '../dom';
import { StoreBase } from '../store';

type Directive<T> = (
	element: Element,
	parameter: string,
	owner: View<T>
) => Operator<T>;

type Source<T> = (
	element: Element,
	parameter: string,
	owner: View<T>
) => Observable<T>;

type Binding = ParsedMatch[];
type MapFn<T, T2> = (value: T, element: Element) => T2;

const BINDING_REGEX = /\s*([:|])?([^\w])?([^\(:\s>"'=\|]+)(?:\(([^\)]+)\))?(:|\|)?/g;

export class ComponentConstructor<T> {
	constructor(private view: View<T>) {}

	connectedCallback() {
		this.view.connected.next(true);
	}

	disconnectedCallback() {
		this.view.connected.next(false);
	}
}

export class View<StateT> {
	private $slots?: SlotManager;
	private $attributes?: AttributeObserver;
	private $children?: ChildrenObserver;
	private subscriptions: Subscription<any>[] = [];

	connected = new Subject<boolean>();

	get attributes() {
		return (
			this.$attributes ||
			(this.$attributes = new AttributeObserver(this.element))
		);
	}

	get children() {
		return (
			this.$children ||
			(this.$children = new ChildrenObserver(this.element))
		);
	}

	get slots() {
		return this.$slots || (this.$slots = new SlotManager());
	}

	store: StoreBase<StateT>;

	addSubscription(binding: Subscription<any>) {
		this.subscriptions.push(binding);
	}

	constructor(public element: Element, public readonly state: StateT) {
		this.store = new StoreBase(state);
	}
}

class ParsedMatch {
	twoWay: boolean;
	once: boolean;
	name: string;
	parameter: string;

	constructor([, twoWayOrOnce, shortcut, name, parameter]: string[]) {
		this.twoWay = twoWayOrOnce === ':';
		this.once = twoWayOrOnce === '|';
		this.name = shortcut || name;
		this.parameter = shortcut ? name : parameter;
	}
}

/**
 * Creates References and Bindings.
 */
class Compiler {
	directives: { [key: string]: Directive<any> } = {
		'@': setAttribute,
		'=': setState,
		'#': mapDirective,
		map: mapDirective,
		setAttribute,
		log
	};
	sources: { [key: string]: Source<any> } = {
		'@': getAttribute,
		'=': select,
		select,
		getAttribute
	};

	directiveNotFound(directive: string) {
		throw new Error('Directive "' + directive + '" not found.');
	}

	getDirective(parsed: ParsedMatch, element: Element, owner: View<any>) {
		return this.directives[parsed.name](element, parsed.parameter, owner);
	}

	getSource(parsed: ParsedMatch, element: Element, owner: View<any>) {
		return this.sources[parsed.name](element, parsed.parameter, owner);
	}

	parseBinding(element: VirtualElement) {
		let match,
			index,
			bindingText = element.attributes.$,
			binding: Binding = [],
			result: Binding[] = (element.bindings = []);

		BINDING_REGEX.lastIndex = 0;

		while ((match = BINDING_REGEX.exec(bindingText))) {
			index = BINDING_REGEX.lastIndex;
			const parsed = new ParsedMatch(match);
			binding.push(parsed);

			if (!match[5]) {
				result.push(binding);
				binding = [];
			}

			BINDING_REGEX.lastIndex = index;
		}
		return result;
	}

	createBindings<T>(node: Element, binding: ParsedMatch[], owner: View<T>) {
		let source = this.getSource(binding[0], node, owner);

		for (let i = 1; i < binding.length; i++)
			source = source.pipe(this.getDirective(binding[i], node, owner));

		owner.addSubscription(source.subscribe());
	}

	createNode(element: VirtualElement): HTMLElement {
		const result = document.createElement(element.tagName);

		for (const i in element.attributes)
			(result as any)[i] = element.attributes[i];

		return result;
	}

	compile<T>(element: VirtualElement, owner: View<T>): HTMLElement {
		const bindings =
				element.bindings ||
				(element.attributes &&
					element.attributes.$ &&
					this.parseBinding(element)),
			node = this.createNode(element);

		if (bindings)
			for (const binding of bindings)
				this.createBindings(node, binding, owner);

		if (element.children)
			for (const child of element.children)
				node.appendChild(
					child instanceof VirtualElement
						? this.compile(child, owner)
						: document.createTextNode(child)
				);

		return node;
	}
}

const compiler = new Compiler();

export function compile<T>(template: VirtualElement, state: T): View<T> {
	const host = document.createElement('DIV'),
		view = new View(host, state),
		nodes = compiler.compile(template, view);
	host.appendChild(nodes);
	return view;
}

function select<T>(_element: Element, selector: keyof T, view: View<T>) {
	return view.store.select(selector);
}

function setState<T, T2 extends keyof T>(
	_element: Element,
	selector: T2,
	view: View<T>
) {
	return tap((value: T[T2]) => view.store.set(selector, value));
}

function getAttribute(element: Element, property: string) {
	const observer = new AttributeObserver(element);
	return concat(
		of((element as any)[property]),
		observer.pipe(
			filter(
				event => event.type === 'attribute' && event.value === property
			),
			map(event => event.value)
		)
	);
}

function setAttribute<T>(element: Element, property: string): Operator<T> {
	return map((value: T) => ((element as any)[property] = value));
}

function log<T>(): Operator<T> {
	return tap(value => console.log(value));
}

function mapDirective<T, K extends keyof T, T2>(
	element: Element,
	property: K,
	view: View<T>
): Operator<T, T2> {
	return map((value: T) => {
		const fn = (view.store.state[property] as any) as MapFn<T, T2>;
		return fn(value, element);
	});
}

/*function observe<T>(_element: Element, property: keyof T, view: View<T>) {
	return view.store.select(property).pipe(mergeMap((value: any) => value));
}*/
