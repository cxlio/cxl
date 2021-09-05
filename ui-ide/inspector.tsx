///<amd-module name="@cxl/ui-ide/inspector.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { css } from '@cxl/ui/theme.js';
import { dom } from '@cxl/tsx';
import { Checkbox, InputBase, Field, Input, Label, C, T } from '@cxl/ui';
import { render, sortBy } from '@cxl/template';
import { combineLatest } from '@cxl/rx';
import { on } from '@cxl/dom';

const Cache = new Map<any, Property[]>();

export type PropertyFilter = (
	prototype: any,
	key: string,
	desc: PropertyDescriptor
) => boolean;

export type PropertyRenderer = (el: any, prop: Property) => Node;

export interface Property {
	name: string;
	descriptor: PropertyDescriptor;
	value: any;
}

const sortByName = sortBy('name');

function filterProperties<T>(proto: T, el: Element, filter: PropertyFilter) {
	const cached = Cache.get(proto);
	if (cached) return cached;
	const props = Object.getOwnPropertyDescriptors(proto);
	const result: Property[] = [];

	for (const name in props) {
		const descriptor = props[name];
		if (filter(proto, name, descriptor)) {
			const value = (el as any)[name];
			result.push({ name, descriptor, value });
		}
	}
	Cache.set(proto, result.sort(sortByName));
	return result;
}

export function attributeFilter(
	proto: any,
	name: string,
	descriptor: PropertyDescriptor
): boolean {
	return (
		descriptor.writable !== false &&
		descriptor.enumerable !== false &&
		((descriptor.value !== undefined &&
			typeof descriptor.value !== 'function') ||
			!!descriptor.set) &&
		!eventFilter(proto, name)
	);
}

export function eventFilter(_proto: any, name: string): boolean {
	return name.startsWith('on');
}

function renderProperties(
	el: any | undefined,
	filter: PropertyFilter,
	render: PropertyRenderer
) {
	if (!el)
		return (
			<T h6 center>
				No Element Selected
			</T>
		);

	const result = <C></C>;
	let proto = el;

	while (el && (proto = Object.getPrototypeOf(proto))) {
		const props = filterProperties(proto, el, filter);
		if (props.length === 0) continue;

		result.appendChild(
			<T className="title" subtitle>
				{proto.constructor.name}
			</T>
		);
		props.forEach(prop => result.appendChild(render(el, prop)));
	}

	return result;
}

export function defaultRender(_el: any, { name, value }: Property): Node {
	if (value === true || value === false)
		return (
			<Checkbox name={name} value={value}>
				{name}
			</Checkbox>
		);

	return (
		<Field className="input">
			<Label>{name}</Label>
			<Input name={name} value={value ?? ''} />
		</Field>
	);
}

@Augment<Inspector>(
	'ide-inspector',
	css({
		$: { display: 'block', overflowY: 'auto' },
		title: { marginTop: 16, marginBottom: 16 },
		input: { marginTop: 8, marginBottom: 8 },
	}),
	$ => {
		return (
			<>
				<C
					pad={16}
					$={el =>
						on(el, 'change').tap(ev => {
							const target = ev.target as InputBase;
							if (target && $.value && target.name)
								($.value as any)[target.name] = target.value;
						})
					}
				>
					{render(
						combineLatest(get($, 'value'), get($, 'filter')),
						([el, type]) => renderProperties(el, type, $.renderer)
					)}
				</C>
			</>
		);
	}
)
export class Inspector extends Component {
	@Attribute()
	value?: any;

	@Attribute()
	filter: PropertyFilter = attributeFilter;

	renderer: PropertyRenderer = defaultRender;
}
