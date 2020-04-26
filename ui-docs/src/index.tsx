import {
	Augment,
	Attribute,
	Component,
	getRegisteredComponents,
	render,
	attributeChanged,
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
import { store } from '@cxl/store/index.js';
import META, { ComponentMeta } from '@cxl/ui-ts/meta.js';

const COMPONENTS = getRegisteredComponents();

@Route('component/:componentName')
@Augment<DocsComponent>(
	'docs-component',
	render(host => {
		const state = store<typeof Component>();
		const meta = store<ComponentMeta>();
		return (
			<Host
				$={() =>
					attributeChanged(host, 'componentName').tap(tagName => {
						if (tagName) {
							state.next(COMPONENTS[tagName]);
							meta.next(
								META.components[tagName as keyof typeof META]
							);
						}
					})
				}
			>
				<T h5>{get(host, 'componentName')}</T>
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

/*function ComponentDemo() {}

function ComponentPage() {}*/

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
