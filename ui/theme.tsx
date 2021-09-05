///<amd-module name="@cxl/ui/theme.js"/>
import {
	Animation as CssAnimation,
	AnimationDefinition,
	Colors as CssColors,
	BaseColor,
	CSSStyle,
	Styles as CssStyles,
	Theme,
	Typography as CssTypography,
	StyleDefinition,
	applyTheme,
	buildTheme,
	rgba,
	defaultTheme as cssTheme,
} from '@cxl/css';

export interface UiTheme extends Theme {
	animation: Animation;
	colors: Colors;
	typography: Typography;
	variables: Variables;
}

export interface Animation extends CssAnimation {
	spinnerstroke: AnimationDefinition;
}

export interface Colors extends CssColors {
	shadow: BaseColor;
	primary: BaseColor;
	primaryLight: BaseColor;
	secondary: BaseColor;
	surface: BaseColor;
	error: BaseColor;
	errorLight: BaseColor;
	onPrimary: BaseColor;
	onPrimaryLight: BaseColor;
	onSecondary: BaseColor;
	onSurface: BaseColor;
	onSurface8: BaseColor;
	onSurface12: BaseColor;
	onSurface87: BaseColor;
	onError: BaseColor;
	background: BaseColor;
	onBackground: BaseColor;
	link: BaseColor;
	headerText: BaseColor;
	divider: BaseColor;
}

export interface Typography extends CssTypography {
	caption: CSSStyle;
	h1: CSSStyle;
	h2: CSSStyle;
	h3: CSSStyle;
	h4: CSSStyle;
	h5: CSSStyle;
	h6: CSSStyle;
	body2: CSSStyle;
	subtitle: CSSStyle;
	subtitle2: CSSStyle;
	button: CSSStyle;
	code: CSSStyle;
	monospace: CSSStyle;
}

export interface ColorTheme {
	primary: string;
	secondary: string;
	surface: string;
	onPrimary: string;
	onSecondary: string;
	onSurface: string;
}

export interface Variables {
	speed: string;
	font: string;
	fontSize: string;
	fontMonospace: string;
}

export type Styles = CssStyles<UiTheme>;

export const theme: UiTheme = {
	...cssTheme,
	animation: {
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
			keyframes:
				'0% { display: block; opacity: 0; } 100% { opacity: 1; }',
			value: 'cxl-fadeIn var(--cxl-speed) linear forwards',
		},
		fadeOut: {
			keyframes:
				'0% { opacity: 1 } 100% { visibility:hidden; opacity: 0; }',
			value: 'cxl-fadeOut var(--cxl-speed) linear both',
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
		speed: '0.3s',
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
		// 0.14 opacity will pass accessibility contrast requirements
		get primaryLight() {
			return { ...this.primary, a: 0.14 };
		},

		secondary: rgba(0xf9, 0xaa, 0x33),
		surface: rgba(0xff, 0xff, 0xff),
		error: rgba(0xb0, 0x00, 0x20),
		get errorLight() {
			return { ...this.error, a: 0.14 };
		},

		onPrimary: rgba(0xff, 0xff, 0xff),
		get onPrimaryLight() {
			return this.primary;
		},
		onSecondary: rgba(0, 0, 0),
		onSurface: rgba(0, 0, 0),

		get onSurface8() {
			return { ...this.onSurface, a: 0.08 };
		},
		get onSurface12() {
			return { ...this.onSurface, a: 0.12 };
		},
		get onSurface87() {
			return { ...this.onSurface, a: 0.87 };
		},
		onError: rgba(0xff, 0xff, 0xff),

		get background() {
			return this.surface;
		},
		get onBackground() {
			return this.onSurface;
		},
		get link() {
			return this.primary;
		},
		get headerText() {
			return { ...this.onSurface, a: 0.6 };
		},
		get divider() {
			return { ...this.onSurface, a: 0.16 };
		},
	},
	imports: [
		'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap',
	],

	globalStyles: {
		'@a': { color: 'link' },
		'*': {
			boxSizing: 'border-box',
			transition:
				'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)',
		} as any,
	},
};

export const { baseColor, css } = buildTheme(theme);

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

type ColorKey = 'surface' | 'primary' | 'secondary';

export const ColorStyles: Record<ColorKey, StyleDefinition<UiTheme>> = {
	surface: {
		variables: BaseColors,
		color: 'onSurface',
		backgroundColor: 'surface',
	},
	primary: { variables: PrimaryColors },
	secondary: { variables: SecondaryColors },
};

export const DisabledStyles = {
	cursor: 'default',
	filter: 'saturate(0)',
	opacity: 0.38,
	pointerEvents: 'none',
};

export const StateStyles = {
	$focus: { outline: 0 },
	$disabled: DisabledStyles,
};

export function delayTheme(): void {
	cancelAnimationFrame(loadingId);
}

const loadingId = requestAnimationFrame(() => applyTheme(theme));
