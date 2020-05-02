import {
	Augment,
	Attribute,
	Component,
	getRegisteredComponents,
	render,
	get,
} from '@cxl/component/index.js';
import { dom, Host } from '@cxl/xdom/index.js';
import {
	Appbar,
	AppbarTitle,
	C,
	Hr,
	Item,
	Meta,
	Navbar,
	T,
} from '@cxl/ui-ts/index.js';
import { Route, Router, RouterTitle, DefaultRoute } from '@cxl/ui-ts/router.js';
import { onHashChange } from '@cxl/template/index.js';
import { Store, store } from '@cxl/store/index.js';
import { Observable, map } from '@cxl/rx/index.js';
import META, { ComponentMeta } from '@cxl/ui-ts/meta.js';

const COMPONENTS = getRegisteredComponents();

function ComponentDemo({ component }: { component: Store<Component> }) {
	return <div>DEMO {component.select('tagName')}</div>;
}

function ComponentAttributes({
	component,
}: {
	component: Observable<Component>;
}) {
	return (
		<div>
			<T h6>Attributes</T>
			{component.pipe(
				map(c => (c.constructor as typeof Component).observedAttributes)
			)}
		</div>
	);
}

function ComponentA11y({ component }: { component: Store<Component> }) {
	return (
		<div>
			<T h6>Accessibility</T>
			<ul>
				<li>
					ARIA Role:
					{component.pipe(map(c => c.getAttribute('role')))}
				</li>
			</ul>
		</div>
	);
}

@Route('component/:componentName')
@Augment<DocsComponent>(
	'docs-component',
	render(host => {
		const state = store<typeof Component>();
		const meta = store<ComponentMeta>();
		const instance = new Store<Component>();

		return (
			<Host
				$={() =>
					get(host, 'componentName').tap(tagName => {
						if (tagName) {
							state.next(COMPONENTS[tagName]);
							meta.next(
								META.components[tagName as keyof typeof META]
							);
							const el = document.createElement(
								tagName
							) as Component;
							el.view.connect();
							instance.next(el);
						}
					})
				}
			>
				<T h5>{get(host, 'componentName')}</T>
				<ComponentDemo component={instance} />
				<ComponentA11y component={instance} />
				<ComponentAttributes component={instance} />
			</Host>
		);
	})
)
export class DocsComponent extends Component {
	@Attribute()
	componentName?: string;
}

@DefaultRoute()
@Augment('docs-home', <Host>Hello</Host>)
export class DocsHome extends Component {}

function DocsNavbar() {
	const list: any[] = [];

	Object.keys(COMPONENTS)
		.sort()
		.forEach(key => {
			if (key.indexOf('cxl-') === 0)
				list.push(<Item href={`#component/${key}`}>{key}</Item>);
		});

	return (
		<Navbar>
			<C pad16>
				<T h6>@cxl/ui</T>
			</C>
			<Hr />
			<Item>Home</Item>
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

@Router(onHashChange())
@Augment(
	'docs-root',
	<Host>
		<Meta />
		<Appbar>
			<DocsNavbar />
			<AppbarTitle>
				<RouterTitle />
			</AppbarTitle>
		</Appbar>
		<slot />
	</Host>
)
export class DocsRoot extends Component {}
