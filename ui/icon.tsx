///<amd-module name="@cxl/ui/icon.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { css, pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { ButtonBase, Svg } from './core.js';

export function ArrowBackIcon() {
	return (
		<Svg
			viewBox="0 0 24 24"
			width={20}
		>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>`}</Svg>
	);
}

export function MenuIcon() {
	return (
		<Svg
			viewBox="0 0 24 24"
			width={20}
		>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>`}</Svg>
	);
}

export function SearchIcon() {
	return (
		<Svg
			viewBox="0 0 24 24"
			width={20}
		>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>`}</Svg>
	);
}

export function CloseIcon(p: { width?: number }) {
	return (
		<Svg
			viewBox="0 0 24 24"
			width={p.width}
		>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>`}</Svg>
	);
}

/*const defaultIcons = {
	arrow_back: 'arrow_back',
	arrow_forward: 'arrow_forward',
	arrow_upward: 'arrow_upward',
	arrow_downward: 'arrow_downward',
	arrow_drop_down: 'arrow_drop_down',
	calendar_today: 'calendar_today',
	first_page: 'first_page',
	last_page: 'last_page',
	chevron_left: 'chevron_left',
	chevron_right: 'chevron_right',
	home: 'home',
	search: 'search',
	filter_list: 'filter_list',
	menu: 'menu',
	more_vert: 'more_vert',
	'': '',
};

const icons = { ...defaultIcons };

export function registerIconSet<T extends IconSet>(
	set: T,
	typography?: CSSStyle
) {
	Object.assign(icons, set);
	if (typography) theme.typography.icon = typography;
}

@Augment(
	role('img'),
	css({
		$: {
			display: 'inline-block',
		},
		$round: {
			borderRadius: '50%',
			textAlign: 'center',
		},
		$outline: { borderWidth: 1 },
	})
)
export abstract class IconBase<IconKey> extends Component {
	protected $icon?: IconKey;
	protected iconNode?: Text;

	protected abstract getIconGlyph(name: IconKey): string;

	@Attribute()
	get icon(): IconKey | undefined {
		return this.$icon;
	}

	set icon(iconName: IconKey | undefined) {
		this.$icon = iconName;
		const icon = iconName ? this.getIconGlyph(iconName) : undefined;

		if (icon) {
			if (this.iconNode) {
				this.iconNode.data = icon;
			} else {
				const typo = theme.typography.icon;
				Object.assign(this.style, typo);
				this.iconNode = document.createTextNode(icon);
				getShadow(this).appendChild(this.iconNode);
			}

			if (!this.hasAttribute('aria-label'))
				this.setAttribute('aria-label', String(iconName));
		}
	}
}
*/

/*@Augment(
	'cxl-item-icon',
	css({
		$: { marginRight: 16 },
	})
)
export class ItemIcon extends Icon {}

@Augment(
	css({
		$: {
			paddingRight: 8,
			lineHeight: 20,
			font: 'icon_button',
			width: 24,
			textAlign: 'center',
		},
		$trailing: { paddingRight: 0, paddingLeft: 8 },
	})
)
export class FieldIcon extends Icon {
	static tagName = 'cxl-field-icon';
}*/

@Augment<IconButton>(
	'cxl-icon-button',
	css({
		$: {
			display: 'inline-flex',
			elevation: 0,
			paddingLeft: 8,
			paddingRight: 8,
			verticalAlign: 'middle',
			borderRadius: pct(100),
			overflowX: 'hidden',
		},
	}),
	() => <slot />
)
export class IconButton extends ButtonBase {}

@Augment<SvgIcon>(
	'cxl-svg-icon',
	css({
		$: {
			display: 'inline-block',
			lineHeight: 0,
		},
		icon: {
			width: '1em',
			height: '1em',
			stroke: 'currentColor',
			fill: 'currentColor',
		} as any,
	}),
	host => {
		const el = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		const use = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'use'
		);
		host.bind(
			get(host, 'icon').tap(val => {
				if (val) use.setAttribute('href', val);
				else use.removeAttribute('href');
			})
		);
		el.classList.add('icon');
		el.appendChild(use);
		return el;
	}
)
export class SvgIcon extends Component {
	@Attribute()
	icon = '';
}
