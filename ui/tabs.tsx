import { dom } from '@cxl/tsx';
import { Augment, Attribute, Component, get } from '@cxl/component';
import {
	on,
	onChildrenMutation,
	trigger,
	onFontsReady,
	onResize,
} from '@cxl/dom';
import { role } from '@cxl/template';
import { css, padding } from '@cxl/css';
import { merge } from '@cxl/rx';
import { Span, ripple } from './core.js';

/**
 * @example
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
 * @see Tabs
 */
@Augment<Tab>(
	'cxl-tab',
	role('tab'),
	css({
		$: {
			flexShrink: 0,
			flexGrow: 1,
			...padding(16, 16, 12, 16),
			backgroundColor: 'surface',
			font: 'button',
			color: 'onSurface',
			lineHeight: 18,
			textDecoration: 'none',
			textAlign: 'center',
			display: 'block',
			outline: 0,
			minWidth: 90,
		},
		'@small': {
			$: { display: 'inline-block' },
		},
		$focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	}),
	ripple,
	_ => <slot />,
	host =>
		get(host, 'selected').tap(val => {
			if (val) trigger(host, 'cxl-tab.selected');
		})
)
export class Tab extends Component {
	@Attribute()
	selected = false;
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
			cursor: 'pointer',
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
		}),
	host => (
		<Span
			className="selected"
			$={
				el =>
					// onLoad().switchMap(() =>
					merge(
						onChildrenMutation(host),
						onFontsReady(),
						get(host, 'selected'),
						onResize(el)
					).raf(() => {
						const sel = host.selected;
						if (!sel) return (el.style.transform = 'scaleX(0)');
						const scaleX = sel.clientWidth / 100;
						el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
						el.style.display = 'block';
					})
				// )
			}
		/>
	)
)
export class Tabs extends Component {
	@Attribute()
	selected?: Tab;
}
