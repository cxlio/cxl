///<amd-module name="@cxl/ui/appbar-menu.js"/>
import { dom } from '@cxl/tsx';
import { Augment, Component } from '@cxl/component';
import { each, registable, registableHost } from '@cxl/template';
import { be } from '@cxl/rx';
import { css } from './theme.js';
import { Tabs } from './tabs.js';
import { Item } from './item.js';
import { MenuToggle } from './menu.js';

/**
 * @beta
 */
@Augment<AppbarMenu>(
	'cxl-appbar-menu',
	css({
		$: { display: 'block', flexShrink: 0 },
		tabs: { display: 'none', overflowX: 'hidden' },
		'@medium': {
			tabs: { display: 'block' },
			menu: { display: 'none' },
		},
	}),
	$ => {
		const elements$ = be(new Set<AppbarItem>());
		$.bind(
			registableHost<AppbarItem>($, AppbarMenu.tagName)
				.raf()
				.tap(els => elements$.next(els))
		);

		return (
			<>
				<Tabs className="tabs">
					<slot />
				</Tabs>
				<MenuToggle className="menu" right>
					{each(elements$, item => (
						<Item>{item.cloneNode(true)}</Item>
					))}
				</MenuToggle>
			</>
		);
	}
)
export class AppbarMenu extends Component {}

@Augment('cxl-appbar-item', $ => registable($, AppbarMenu.tagName))
export class AppbarItem extends Component {}
