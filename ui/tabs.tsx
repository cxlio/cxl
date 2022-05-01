///<amd-module name="@cxl/ui/tabs.js"/>
import { dom } from '@cxl/tsx';
import { Augment, Attribute, Component, get } from '@cxl/component';
import {
	isHidden,
	on,
	onChildrenMutation,
	trigger,
	onResize,
	onAction,
} from '@cxl/dom';
import { role } from '@cxl/template';
import { padding } from '@cxl/css';
import { EMPTY, be, merge } from '@cxl/rx';
import { Span, ripple } from './core.js';
import { css } from './theme.js';

/**
 * @see Tabs
 */
@Augment<Tab>(
	'cxl-tab',
	role('tab'),
	css({
		$: {
			flexShrink: 0,
			flexGrow: 1,
			...padding(4, 16, 0, 16),
			backgroundColor: 'surface',
			minHeight: 46,
			font: 'button',
			color: 'onSurface',
			textDecoration: 'none',
			justifyContent: 'center',
			display: 'inline-flex',
			alignItems: 'center',
			outline: 0,
			cursor: 'pointer',
			minWidth: 90,
			// Needed for ripple in Safari
			position: 'relative',
		},
		'@small': {
			$: { display: 'inline-flex' },
		},
		$focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	}),
	$ =>
		onResize($).tap(() => {
			if (!isHidden($)) trigger($, 'tabs.resize');
		}),
	ripple,
	_ => <slot />,
	host =>
		get(host, 'selected').tap(val => {
			if (val) trigger(host, 'cxl-tab.selected');
		}),
	host =>
		get(host, 'name').switchMap(name => {
			host.tabIndex = name ? 0 : -1;
			return name
				? onAction(host).tap(() => (host.selected = true))
				: EMPTY;
		})
)
export class Tab extends Component {
	@Attribute()
	selected = false;

	/**
	 * Assign a name to the tab. If set the tab will be focusable.
	 */
	@Attribute()
	name?: string;
}

/**
 * Tabs organize content across different screens, data sets, and other interactions.
 * @example
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
 * @see Tab
 */
@Augment<Tabs>(
	'cxl-tabs',
	role('tablist'),
	css({
		$: {
			backgroundColor: 'surface',
			color: 'onSurface',
			display: 'block',
			flexShrink: 0,
			position: 'relative',
			overflowX: 'auto',
		},
		selected: {
			transformOrigin: 'left',
			backgroundColor: 'secondary',
			height: 2,
			width: 100,
			scaleX: 0,
			display: 'none',
		},
		content: { display: 'flex' },
		'@small': {
			content: { display: 'block' },
		},
	}),
	() => (
		<div className="content">
			<slot />
		</div>
	),
	el =>
		on(el, 'cxl-tab.selected').tap(ev => {
			if (el.selected) el.selected.selected = false;
			if (ev.target instanceof Tab) el.selected = ev.target;
			else if ((ev as any).detail instanceof Tab)
				el.selected = (ev as any).detail;
			ev.stopPropagation();
			if (el.selected?.name && el.selected !== activeTab$.value)
				activeTab$.next(el.selected);
		}),
	host => (
		<Span
			className="selected"
			$={el =>
				merge(
					onChildrenMutation(host),
					get(host, 'selected'),
					on(host, 'tabs.resize'),
					onResize(el)
				).raf(() => {
					if (isHidden(host)) return;
					const sel = host.selected;
					if (!sel) return (el.style.transform = 'scaleX(0)');
					const scaleX = sel.clientWidth / 100;
					el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
					el.style.display = 'block';
				})
			}
		/>
	)
)
export class Tabs extends Component {
	@Attribute()
	selected?: Tab;
}

const activeTab$ = be<Tab | undefined>(undefined);

@Augment<TabPanel>('cxl-tab-panel', $ =>
	activeTab$.raf(tab => {
		if (tab && $.name && tab.name === $.name) {
			$.style.display = 'contents';
			($ as any).visible = true;
		} else {
			$.style.display = 'none';
			($ as any).visible = false;
		}
	})
)
export class TabPanel extends Component {
	@Attribute()
	readonly visible = false;

	@Attribute()
	name?: string;
}
