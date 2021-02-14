import { Attribute, Augment, Component, get } from '@cxl/component';
import { role } from '@cxl/template';
import { CSSStyle, css } from '@cxl/css';
import { getShadow } from '@cxl/dom';
import { theme } from '@cxl/ui/theme.js';
import { dom } from '@cxl/tsx';
import { ButtonBase } from './core.js';

type IconKey = keyof IconSet;
type DefaultIconSet = typeof defaultIconSet;

export interface IconSet extends DefaultIconSet {
	'': string;
}

export interface Icons {
	icon: IconSet;
}

const defaultIconSet = {
	arrow_back: 'arrow_back',
	arrow_forward: 'arrow_forward',
	arrow_upward: 'arrow_upward',
	arrow_downward: 'arrow_downward',
	first_page: 'first_page',
	last_page: 'last_page',
	chevron_left: 'chevron_left',
	chevron_right: 'chevron_right',
	search: 'search',
	filter_list: 'filter_list',
	menu: 'menu',
	'': '',
};

const icons: Icons = {
	icon: defaultIconSet,
};

export function registerIconSet<K extends keyof Icons>(
	name: K,
	set: Icons[K],
	typography?: CSSStyle
) {
	icons[name] = set;

	if (typography) theme.typography[name] = typography;
}

@Augment(
	'cxl-icon',
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
export class Icon extends Component {
	protected $icon: IconKey = '';
	protected iconNode?: Text;

	@Attribute()
	iconset: keyof Icons = 'icon';

	@Attribute()
	get icon(): IconKey {
		return this.$icon;
	}

	set icon(iconName: IconKey) {
		this.$icon = iconName;
		const iconset = this.iconset;
		const icon = iconName && icons[iconset][iconName];

		if (icon) {
			if (this.iconNode) {
				this.iconNode.data = icon;
			} else {
				const typo = theme.typography[iconset];
				Object.assign(this.style, typo);
				this.iconNode = document.createTextNode(icon);
				getShadow(this).appendChild(this.iconNode);
			}

			if (!this.hasAttribute('aria-label'))
				this.setAttribute('aria-label', iconName);
		}
	}
}

@Augment(
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
			width: 24,
			textAlign: 'center',
		},
		$trailing: { paddingRight: 0, paddingLeft: 8 },
	})
)
export class FieldIcon extends Icon {
	static tagName = 'cxl-field-icon';
}

@Augment<IconButton>(
	'cxl-icon-button',
	css({
		$: {
			elevation: 0,
			paddingLeft: 8,
			paddingRight: 8,
			font: 'icon_button',
			verticalAlign: 'middle',
		},
	}),
	$ => <Icon icon={get($, 'icon')} />
)
export class IconButton extends ButtonBase {
	@Attribute()
	icon: IconKey = '';
}

theme.imports?.push(`https://fonts.googleapis.com/icon?family=Material+Icons`);
/*theme.imports?.push(
	`https://fonts.googleapis.com/icon?family=Material+Icons&text=${Object.values(
		defaultIconSet
	).join('')}`
);*/
