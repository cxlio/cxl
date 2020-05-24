import {
	Augment,
	Attribute,
	Component,
	getRegisteredComponents,
	get,
} from '@cxl/component/index.js';
import { dom, Host } from '@cxl/xdom/index.js';
import {
	Appbar,
	C,
	Chip,
	Hr,
	Item,
	Page,
	Meta,
	Navbar,
	T,
	Table,
	Td,
	Tr,
	Th,
} from '@cxl/ui-ts/index.js';
import { Icon } from '@cxl/ui-ts/icons.js';
import { Route, Router, RouterTitle, DefaultRoute } from '@cxl/ui-ts/router.js';
import { onHashChange, list, tpl } from '@cxl/template/index.js';
import { Store } from '@cxl/store/index.js';
import { Observable, map, tap, to } from '@cxl/rx/index.js';
import META from '@cxl/ui-ts/meta.js';

const COMPONENTS = getRegisteredComponents();

function ComponentDemo({ component }: { component: Store<Component> }) {
	return (
		<div>
			<T h5>DEMO {component.select('tagName')}</T>
		</div>
	);
}

function AttributeTable({ attributes }: { attributes: Observable<string[]> }) {
	return (
		<Table>
			<Tr>
				<Th>Name</Th>
				<Th>Description</Th>
			</Tr>
			{list(attributes, item => (
				<Tr>
					<Td>{item}</Td>
					<Td>{META.attributes[item]?.summary}</Td>
				</Tr>
			))}
		</Table>
	);
}

function ComponentEvents({ component }: { component: Observable<Component> }) {
	const attributes = to(
		component,
		c => (c.constructor as typeof Component).observedAttributes || []
	);

	return (
		<div>
			<T h6>Events</T>
			<AttributeTable attributes={attributes} />
		</div>
	);
}

function ComponentMethods({ component }: { component: Observable<Component> }) {
	const attributes = to(
		component,
		c => (c.constructor as typeof Component).observedAttributes || []
	);

	return (
		<div>
			<T h6>Methods</T>
			<AttributeTable attributes={attributes} />
		</div>
	);
}

function ComponentAttributes({
	component,
}: {
	component: Observable<Component>;
}) {
	const attributes = to(
		component,
		c => (c.constructor as typeof Component).observedAttributes || []
	);

	return (
		<div>
			<T h6>Attributes</T>
			<AttributeTable attributes={attributes} />
		</div>
	);
}

function getRoleLink(roleName: string) {
	return 'https://www.w3.org/TR/wai-aria-1.1/#' + roleName;
}

function ComponentA11y({ component }: { component: Store<Component> }) {
	const role = component.pipe(map(c => c.getAttribute('role') || ''));

	return (
		<div>
			<T h6>Accessibility</T>
			<ul>
				<li>
					ARIA Role:
					<a href={to(role, getRoleLink)}>{role}</a>
				</li>
			</ul>
		</div>
	);
}

function getComponentTags(component: Component) {
	const meta = META.components[component.tagName.toLowerCase()];

	if (meta) {
		const tags = meta?.tags || [];
		if (meta.beta) tags.push('beta');
		if (meta.added) tags.push(`added ${meta.added}`);
		return tags;
	}

	return [];
}

function ComponentTags({ component }: { component: Store<Component> }) {
	return list(
		to(component, c => getComponentTags(c)),
		tag => <Chip>{tag}</Chip>
	);
}

@Route('component/:componentName')
@Augment<DocsComponent>(
	'docs-component',
	tpl(() => {
		const instance = new Store<Component>();
		const tagName$ = instance
			.select('tagName')
			.pipe(map(tagName => tagName?.toLowerCase()));

		function init(host: DocsComponent) {
			return get(host, 'componentName').pipe(
				tap(tagName => {
					if (tagName) {
						const el = document.createElement(tagName) as Component;
						el.view.connect();
						instance.next(el);
					}
				})
			);
		}
		return (
			<Host $={init}>
				<Page>
					<ComponentTags component={instance} />
					<T h5>
						{tagName$.pipe(
							map(tagName => META.components[tagName]?.summary)
						)}
					</T>
					<ComponentDemo component={instance} />
					<ComponentA11y component={instance} />
					<ComponentAttributes component={instance} />
					<ComponentEvents component={instance} />
					<ComponentMethods component={instance} />
				</Page>
			</Host>
		);
	})
)
export class DocsComponent extends Component {
	@Attribute()
	componentName?: string;

	routeTitle = get(this, 'componentName');
}

@DefaultRoute()
@Augment('docs-home', <Host>Hello</Host>)
export class DocsHome extends Component {}

function DocsNavbar() {
	const list: any[] = [];

	Object.keys(COMPONENTS)
		.sort()
		.forEach(key => {
			const icon = META.components[key]?.icon as any;

			if (key.indexOf('cxl-') === 0)
				list.push(
					<Item href={`#component/${key}`}>
						<Icon icon={icon} /> {key}
					</Item>
				);
		});

	return (
		<Navbar>
			<C pad16>
				<T h6>@cxl/ui</T>
			</C>
			<Hr />
			<Item href="#">Home</Item>
			<Item>Getting Started</Item>
			<Hr />
			<C pad16>
				<T subtitle2>Guides</T>
			</C>
			<Item>Core Concepts</Item>
			<Item>Forms</Item>
			<C pad16>
				<T subtitle2>Components</T>
			</C>
			{list}
		</Navbar>
	);
}

@Augment(
	'docs-root',
	<Host>
		<Meta />
		<Appbar>
			<DocsNavbar />
			<RouterTitle />
		</Appbar>
		<slot />
	</Host>
)
@Router(onHashChange())
export class DocsRoot extends Component {}
