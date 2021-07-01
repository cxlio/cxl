///<amd-module name="@cxl/ui/avatar.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { role } from '@cxl/template';
import { css } from '@cxl/css';
import { dom, expression } from '@cxl/tsx';
import { Size, SizeAttribute } from './core.js';
import { PersonIcon } from './icon.js';

/**
 * Avatars are circular components that usually wrap an image or icon.
 * They can be used to represent a person or an object.
 * @example
 * <cxl-avatar></cxl-avatar>
 * <cxl-avatar size="big"></cxl-avatar>
 * <cxl-avatar size="small"></cxl-avatar>
 */
@Augment<Avatar>(
	'cxl-avatar',
	role('img'),
	css({
		$: {
			borderRadius: '100%',
			backgroundColor: 'onSurface8',
			backgroundPosition: 'center',
			backgroundSize: 'contain',
			display: 'inline-block',
			textAlign: 'center',
			overflowY: 'hidden',
			verticalAlign: 'middle',
		},

		image: {
			width: '100%',
			height: '100%',
		},
	}),
	node => (
		<>
			{() => {
				node.bind(
					get(node, 'src').tap(
						src =>
							(node.style.backgroundImage = src
								? `url('${src}')`
								: '')
					)
				);

				const el = (<PersonIcon />) as HTMLElement;
				el.setAttribute('class', 'image');
				node.bind(
					get(node, 'src').tap(
						src =>
							(el.style.display =
								src || node.text ? 'none' : 'inline-block')
					)
				);
				return el;
			}}
			{expression(node, get(node, 'text'))}
		</>
	)
)
export class Avatar extends Component {
	@SizeAttribute(size => ({
		width: 40 + size * 8,
		height: 40 + size * 8,
		lineHeight: 38 + size * 8,
		fontSize: 20 + size * 4,
	}))
	size: Size = 0;

	@Attribute()
	src = '';
	/**
	 * @example
	 * <cxl-avatar text="GB"></cxl-avatar>
	 * <cxl-avatar text="GB" size="small" primary></cxl-avatar>
	 * <cxl-avatar text="GB" size="big" secondary></cxl-avatar>
	 */
	@Attribute()
	text = '';
}
