///<amd-module name="@cxl/ui/theme.js"/>
import {
	Styles as CssStyles,
	StyleDefinition,
	buildTheme,
	rgba,
	defaultTheme as cssTheme,
} from '@cxl/css';

export interface ColorTheme {
	primary: string;
	secondary: string;
	surface: string;
	onPrimary: string;
	onSecondary: string;
	onSurface: string;
}

export type BaseThemeAnimation = typeof baseTheme['animation'];
export interface Animation extends BaseThemeAnimation {}

export type UiTheme = typeof baseTheme & { animation: Animation };
export type Styles = CssStyles<UiTheme>;

export interface IconDef {
	id: string;
	icon: Node;
}

const baseTheme = {
	...cssTheme,
	animation: {
		none: undefined,
		flash: {
			keyframes: `from, 50%, to { opacity: 1; } 25%,75% { opacity: 0; }`,
			value: 'cxl-flash var(--cxl-speed) infinite ease-in',
		},
		spin: {
			keyframes:
				'0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-spin 2s infinite linear',
		},
		pulse: {
			keyframes:
				'0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-pulse 1s infinite steps(8)',
		},
		expand: {
			keyframes:
				'0% { transform: scale(0,0); } 100% { transform: scale(1,1); }',
			value: 'cxl-expand var(--cxl-speed) 1 ease-in',
		},
		fadeIn: {
			keyframes: '0% { opacity: 0; } 100% { opacity: 1; }',
			value: 'cxl-fadeIn var(--cxl-speed) linear forwards',
		},
		fadeOut: {
			keyframes:
				'0% { opacity: 1 } 100% { visibility:hidden; opacity: 0; }',
			value: 'cxl-fadeOut var(--cxl-speed) linear both',
		},
		fadeInUp: {
			keyframes:
				'0% { opacity: 0;transform: translate(0, 40%) } 100% { opacity: 1;transform: none }',
			value: 'cxl-fadeInUp var(--cxl-speed) linear forwards',
		},
		slideInUp: {
			keyframes:
				'0% { transform: translate(0, 40%) } 100% { transform: none }',
			value: 'cxl-slideInUp var(--cxl-speed) linear both',
		},
		wait: {
			keyframes: `
0% { transform: translateX(0) scaleX(0) }
33% { transform: translateX(0) scaleX(0.75)}
66% { transform: translateX(75%) scaleX(0.25)}
100%{ transform:translateX(100%) scaleX(0) }
			`,
			value: 'cxl-wait 1s infinite linear',
		},

		spinnerstroke: {
			keyframes: `
	0%      { stroke-dashoffset: $start;  transform: rotate(0); }
	12.5%   { stroke-dashoffset: $end;    transform: rotate(0); }
	12.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(72.5deg); }
	25%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(72.5deg); }
	25.0001%   { stroke-dashoffset: $start;  transform: rotate(270deg); }
	37.5%   { stroke-dashoffset: $end;    transform: rotate(270deg); }
	37.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(161.5deg); }
	50%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(161.5deg); }
	50.0001%  { stroke-dashoffset: $start;  transform: rotate(180deg); }
	62.5%   { stroke-dashoffset: $end;    transform: rotate(180deg); }
	62.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(251.5deg); }
	75%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(251.5deg); }
	75.0001%  { stroke-dashoffset: $start;  transform: rotate(90deg); }
	87.5%   { stroke-dashoffset: $end;    transform: rotate(90deg); }
	87.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(341.5deg); }
	100%    { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(341.5deg); }
			`
				.replace(/\$start/g, (282.743 * (1 - 0.05)).toString())
				.replace(/\$end/g, (282.743 * (1 - 0.8)).toString()),
			value: 'cxl-spinnerstroke 4s infinite cubic-bezier(.35,0,.25,1)',
		},
	},
	variables: {
		// Animation speed
		speed: '250ms',
		font: 'Roboto, Helvetica, sans-serif',
		fontSize: '16px',
		fontMonospace: 'monospace',
	},
	typography: {
		...cssTheme.typography,
		default: {
			fontWeight: 400,
			fontFamily: 'var(--cxl-font)',
			fontSize: 'var(--cxl-font-size)',
			letterSpacing: 'normal',
		},
		caption: { fontSize: '12px', letterSpacing: '0.4px' },
		h1: { fontWeight: 300, fontSize: '96px', letterSpacing: '-1.5px' },
		h2: { fontWeight: 300, fontSize: '60px', letterSpacing: '-0.5px' },
		h3: { fontSize: '48px' },
		h4: { fontSize: '34px', letterSpacing: '0.25px' },
		h5: { fontSize: '24px' },
		h6: { fontSize: '20px', fontWeight: 500, letterSpacing: '0.15px' },
		body2: {
			fontSize: '14px',
			letterSpacing: '0.25px',
			lineHeight: '20px',
		},
		subtitle: {
			letterSpacing: '0.15px',
		},
		subtitle2: {
			fontSize: '14px',
			fontWeight: 500,
			letterSpacing: '0.1px',
		},
		button: {
			fontSize: '14px',
			fontWeight: 500,
			lineHeight: '20px',
			letterSpacing: '1.25px',
			textTransform: 'uppercase',
		},
		code: { fontFamily: 'var(--cxl-font-monospace)' },
		monospace: { fontFamily: 'var(--cxl-font-monospace)' },
	},
	colors: {
		shadow: rgba(0, 0, 0, 0.26),
		primary: rgba(0x15, 0x65, 0xc0),
		link: rgba(0x15, 0x65, 0xc0),
		// 0.14 opacity will pass accessibility contrast requirements
		primaryLight: rgba(0x15, 0x65, 0xc0, 0.14),
		secondary: rgba(0xf9, 0xaa, 0x33),
		surface: rgba(0xff, 0xff, 0xff),
		error: rgba(0xb0, 0x00, 0x20),
		errorLight: rgba(0xb0, 0x00, 0x20, 0.14),
		onPrimary: rgba(0xff, 0xff, 0xff),
		onPrimaryLight: rgba(0x15, 0x65, 0xc0),
		onSecondary: rgba(0, 0, 0),
		onSurface: rgba(0, 0, 0),
		onSurface8: rgba(0, 0, 0, 0.08),
		onSurface12: rgba(0, 0, 0, 0.12),
		onSurface87: rgba(0, 0, 0, 0.87),
		onError: rgba(0xff, 0xff, 0xff),
		background: rgba(0xff, 0xff, 0xff),
		onBackground: rgba(0, 0, 0),
		headerText: rgba(0x0, 0x0, 0x0, 0.6),
		divider: rgba(0x0, 0x0, 0x0, 0.16),
	},
	imports: [
		'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap',
	],

	globalStyles: {
		'@a': { color: 'link' },
		// TODO Find a better way
		'cxl-selection,::selection': {
			backgroundColor: 'secondary',
			color: 'onSecondary',
		},
		'*': {
			boxSizing: 'border-box',
			transition:
				'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)',
		} as any,
	},
};
export const theme: UiTheme = baseTheme;
export const { applyTheme, baseColor, css } = buildTheme(theme);

export const BaseColors: ColorTheme = {
	surface: baseColor('surface'),
	onSurface: baseColor('onSurface'),
	primary: baseColor('primary'),
	onPrimary: baseColor('onPrimary'),
	secondary: baseColor('secondary'),
	onSecondary: baseColor('onSecondary'),
};

export const PrimaryColors: ColorTheme = {
	...BaseColors,
	surface: baseColor('primary'),
	onSurface: baseColor('onPrimary'),
	primary: baseColor('surface'),
	onPrimary: baseColor('onSurface'),
};

export const SecondaryColors: ColorTheme = {
	...BaseColors,
	surface: baseColor('secondary'),
	onSurface: baseColor('onSecondary'),
	secondary: baseColor('surface'),
	onSecondary: baseColor('onSurface'),
};

export const ErrorColors: ColorTheme = {
	...BaseColors,
	surface: baseColor('error'),
	onSurface: baseColor('onError'),
};

type ColorKey = 'surface' | 'primary' | 'secondary' | 'error' | 'inherit';

export const ColorStyles: Record<ColorKey, StyleDefinition<UiTheme>> = {
	surface: {
		variables: BaseColors,
		color: 'onSurface',
		backgroundColor: 'surface',
	},
	primary: { variables: PrimaryColors },
	secondary: { variables: SecondaryColors },
	error: { variables: ErrorColors },
	inherit: { color: 'inherit', backgroundColor: 'inherit' },
};

export const DisabledStyles = {
	cursor: 'default',
	filter: 'saturate(0)',
	opacity: 0.38,
	pointerEvents: 'none',
};

export const FocusStyles = {
	filter: 'invert(0.2) saturate(2) brightness(1.1)',
};

export const HoverStyles = {
	filter: 'invert(0.15) saturate(1.5) brightness(1.1)',
};

export const StateStyles = {
	$focus: { outline: 0 },
	$disabled: DisabledStyles,
};

export function scrollbarStyles(prefix = '$') {
	return {
		[prefix + '::scrollbar']: { width: 8, height: 8 },
		[prefix + '::scrollbar-track']: { backgroundColor: 'transparent' },
		[prefix + '::scrollbar-thumb']: { backgroundColor: 'divider' },
		[prefix + '::-webkit-scrollbar']: { width: 8, height: 8 },
		[prefix + '::-webkit-scrollbar-track']: {
			backgroundColor: 'transparent',
		},
		[prefix + '::-webkit-scrollbar-thumb']: { backgroundColor: 'divider' },
	};
}

export function delayTheme(): void {
	cancelAnimationFrame(loadingId);
}

const loadingId = requestAnimationFrame(() => applyTheme());

const icons: Record<string, IconDef> = {};

export function registerIcon(icon: IconDef) {
	icons[icon.id] = icon;
}

export function getIcon(id: string) {
	return icons[id]?.icon.cloneNode(true);
}
