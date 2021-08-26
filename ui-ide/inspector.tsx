import { Augment, Attribute, Component, get } from '@cxl/component';
import { css } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { Checkbox, InputBase, Field, Input, Label, C, T } from '@cxl/ui';
import { render, sortBy } from '@cxl/template';
import { combineLatest } from '@cxl/rx';
import { on } from '@cxl/dom';

const Cache = new Map<any, Property[]>();

type PropertyType = 'events' | 'attribute' | 'a11y';

interface Property {
	name: string;
	descriptor: PropertyDescriptor;
	type: 'boolean' | 'string';
}

const sortByName = sortBy('name');
const sortByType = sortBy('type');

function isIgnored(name: string) {
	return (
		name === 'style' ||
		// name === 'innerText' ||
		name === 'outerText' ||
		name === 'contentEditable' ||
		name === 'classList' ||
		name === 'innerHTML' ||
		name === 'outerHTML' ||
		name === 'scrollTop' ||
		name === 'scrollLeft' ||
		name === 'elementTiming' ||
		name === 'hidden'
	);
}

function filterProperties<T>(proto: T, el: Element) {
	const cached = Cache.get(proto);
	if (cached) return cached;
	const props = Object.getOwnPropertyDescriptors(proto);
	const result: Property[] = [];

	for (const name in props) {
		const descriptor = props[name];
		if (
			descriptor.writable !== false &&
			descriptor.enumerable !== false &&
			((descriptor.value !== undefined &&
				typeof descriptor.value !== 'function') ||
				descriptor.set)
		) {
			const value = (el as any)[name];
			const type =
				value === false || value === true ? 'boolean' : 'string';
			result.push({ name, descriptor, type });
		}
	}
	Cache.set(proto, result.sort(sortByName).sort(sortByType));
	return result;
}

export type PropertyRenderer = (prop: Property, value: any) => Node;
export const PropertyRendererMap: Record<Property['type'], PropertyRenderer> = {
	boolean({ name }, value) {
		return (
			<Checkbox name={name} value={value}>
				{name}
			</Checkbox>
		);
	},

	string({ name }, value) {
		return (
			<Field className="input">
				<Label>{name}</Label>
				<Input name={name} value={value ?? ''} />
			</Field>
		);
	},
};

function renderProperties(el: Element | undefined, propertyType: PropertyType) {
	if (!el)
		return (
			<T h6 center>
				No Element Selected
			</T>
		);

	const result = <C></C>;
	let proto = el;
	const win = el.ownerDocument.defaultView;

	while (el && (proto = Object.getPrototypeOf(proto))) {
		if (win && proto.constructor === win.HTMLElement) break;
		const props = filterProperties(proto, el);
		if (props.length === 0) continue;

		result.appendChild(
			<T className="title" subtitle>
				{proto.constructor.name}
			</T>
		);
		props.forEach(prop => {
			const { name, type } = prop;
			if (isIgnored(name)) return;
			if (
				propertyType === 'events' &&
				(name === 'on' || !name.startsWith('on'))
			)
				return;
			if (propertyType === 'a11y' && !name.startsWith('aria')) return;

			if (
				(name !== 'on' && name.startsWith('on')) ||
				name.startsWith('aria')
			)
				return;

			const value = (el as any)[name];

			result.appendChild(PropertyRendererMap[type](prop, value));
		});
	}

	return result;
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
						combineLatest(get($, 'value'), get($, 'type')),
						([el, type]) => renderProperties(el, type)
					)}
				</C>
			</>
		);
	}
)
export class Inspector extends Component {
	@Attribute()
	value?: Element;

	@Attribute()
	docs?: string;

	@Attribute()
	type: PropertyType = 'attribute';
}
