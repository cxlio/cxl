///<amd-module name="@cxl/ui/icon.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { role } from '@cxl/template';
import { css, pct } from '@cxl/css';
import { dom, expression } from '@cxl/tsx';
import { ButtonBase, Size, SizeAttribute, Svg } from './core.js';

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

export function PersonIcon(p: { width?: number }) {
	return (
		<Svg
			viewBox="0 0 24 24"
			width={p.width}
		>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>`}</Svg>
	);
}

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
