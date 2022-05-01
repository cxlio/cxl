///<amd-module name="@cxl/ui/icon.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { ButtonBase, Size, SizeAttribute, Svg, Path } from './core.js';
import { css } from './theme.js';

export function ArrowBackIcon() {
	return (
		<Svg viewBox="0 0 24 24" width={20}>
			<Path d="M0 0h24v24H0z" fill="none" />
			<Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
		</Svg>
	);
}

export function MenuIcon() {
	return (
		<Svg viewBox="0 0 24 24" width={20}>
			<Path d="M0 0h24v24H0z" fill="none" />
			<Path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
		</Svg>
	);
}

export function MoreVertIcon() {
	return (
		<Svg viewBox="0 0 24 24" width={20}>
			<Path d="M12 15.984q0.797 0 1.406 0.609t0.609 1.406-0.609 1.406-1.406 0.609-1.406-0.609-0.609-1.406 0.609-1.406 1.406-0.609zM12 9.984q0.797 0 1.406 0.609t0.609 1.406-0.609 1.406-1.406 0.609-1.406-0.609-0.609-1.406 0.609-1.406 1.406-0.609zM12 8.016q-0.797 0-1.406-0.609t-0.609-1.406 0.609-1.406 1.406-0.609 1.406 0.609 0.609 1.406-0.609 1.406-1.406 0.609z" />
		</Svg>
	);
}

export function SearchIcon() {
	return (
		<Svg viewBox="0 0 24 24" width={20}>
			<Path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
		</Svg>
	);
}

export function CloseIcon(p: { width?: number }) {
	return (
		<Svg viewBox="0 0 24 24" width={p.width || 24}>
			<Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
		</Svg>
	);
}

export function PersonIcon(p: { width?: number }) {
	return (
		<Svg viewBox="0 0 24 24" width={p.width}>
			<Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
		</Svg>
	);
}

/**
 * Round Button for Icons
 * @example
 * <cxl-icon-button><svg viewBox="0 0 24 24" width="24">
			<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
		</svg></cxl-icon-button>
 */
@Augment<IconButton>(
	'cxl-icon-button',
	css({
		$: {
			display: 'inline-flex',
			elevation: 0,
			verticalAlign: 'middle',
			borderRadius: pct(100),
			overflowX: 'hidden',
		},
	}),
	() => <slot />
)
export class IconButton extends ButtonBase {
	@SizeAttribute(s => ({
		fontSize: 14 + s * 4,
		lineHeight: 20 + s * 8,
		paddingRight: 8 + s * 4,
		paddingLeft: 8 + s * 4,
		paddingTop: 8 + s * 4,
		paddingBottom: 8 + s * 4,
	}))
	size: Size = 0;
}

/**
 * Use with SVG Sprites.
 */
@Augment<SvgIcon>(
	'cxl-svg-icon',
	css({
		$: {
			display: 'inline-block',
			lineHeight: 0,
		},
		icon: {
			//stroke: 'currentColor',
			fill: 'currentColor',
			verticalAlign: 'text-bottom',
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
		host.bind(
			get(host, 'width').tap(val => {
				el.style.width = val === undefined ? '' : `${val}px`;
			})
		);
		host.bind(
			get(host, 'height').tap(val => {
				el.style.height = val === undefined ? '' : `${val}px`;
			})
		);
		el.classList.add('icon');
		el.appendChild(use);
		return el;
	}
)
export class SvgIcon extends Component {
	/**
	 * Icon name or href to an svg sprite. The sprite must exist in the document.
	 */
	@Attribute()
	icon = '';

	@Attribute()
	width?: number;

	@Attribute()
	height?: number;
}
