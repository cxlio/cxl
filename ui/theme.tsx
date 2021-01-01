import { Colors, Theme, setTheme, rgba } from '../css/index.js';

declare module '../css/index.js' {
	interface Animation {
		spinnerstroke: AnimationDefinition;
	}

	interface Typography {
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
}

export const defaultTheme: Theme = {
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
	breakpoints: { small: 480, medium: 960, large: 1280, xlarge: 1600 },
	variables: {
		// Animation speed
		speed: '0.3s',
		font: 'Roboto, sans-serif',
		fontMonospace: 'monospace',
	},
	typography: {
		default: {
			fontWeight: 400,
			fontFamily: 'var(--cxl-font)',
			fontSize: '16px',
			letterSpacing: 'normal',
		},
		caption: { fontSize: '12px', letterSpacing: '0.4px' },
		h1: { fontWeight: 300, fontSize: '96px', letterSpacing: '-1.5px' },
		h2: { fontWeight: 300, fontSize: '60px', letterSpacing: '-0.5px' },
		h3: { fontSize: '48px' },
		h4: { fontSize: '34px', letterSpacing: '0.25px' },
		h5: { fontSize: '24px' },
		h6: { fontSize: '20px', fontWeight: 500, letterSpacing: '0.15px' },
		body2: { fontSize: '14px', letterSpacing: '0.25px' },
		subtitle: {
			fontSize: '16px',
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
		elevation: rgba(0, 0, 0, 0.26),
		primary: rgba(0x15, 0x65, 0xc0),
		// 0.14 opacity will pass accessibility contrast requirements
		get primaryLight() {
			return this.primary.alpha(0.14);
		},

		secondary: rgba(0xf9, 0xaa, 0x33),
		surface: rgba(0xff, 0xff, 0xff),
		error: rgba(0xb0, 0x00, 0x20),
		get errorLight() {
			return this.error.alpha(0.14);
		},

		onPrimary: rgba(0xff, 0xff, 0xff),
		get onPrimaryLight() {
			return this.primary;
		},
		onSecondary: rgba(0, 0, 0),
		onSurface: rgba(0, 0, 0),

		get onSurface8() {
			return this.onSurface.alpha(0.08);
		},
		get onSurface12() {
			return this.onSurface.alpha(0.12);
		},
		get onSurface87() {
			return this.onSurface.alpha(0.87);
		},
		onError: rgba(0xff, 0xff, 0xff),

		get background() {
			return this.surface;
		},
		get link() {
			return this.primary;
		},
		get headerText() {
			return this.onSurface.alpha(0.6);
		},
		get divider() {
			return this.onSurface.alpha(0.16);
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

const {
	surface,
	onSurface,
	primary,
	onPrimary,
	error,
	onError,
} = defaultTheme.colors;

export const ResetSurface = {
	variables: {
		surface: surface,
		onSurface: onSurface,
		primary: primary,
		onPrimary: onPrimary,
		link: onSurface,
		error: error,
		onError: onError,
	},
};

export const InversePrimary = {
	variables: {
		surface: primary,
		onSurface: onPrimary,
		primary: surface,
		onPrimary: onSurface,
		link: onPrimary,
		error: rgba(0xff, 0x6e, 0x40),
		onError: rgba(0, 0, 0),
		divider: rgba(0xff, 0xff, 0xff, 0.48),
	},
};

export const DarkColors: Partial<Colors> = {
	background: rgba(0x12, 0x12, 0x12),
	surface: rgba(0x12, 0x12, 0x12),
	onSurface: rgba(0xff, 0xff, 0xff),
	error: rgba(0xcf, 0x66, 0x79),
	onError: rgba(0, 0, 0),
	primary: rgba(0xbb, 0x86, 0xfc),
	secondary: rgba(0x03, 0xda, 0xc6),
	onPrimary: rgba(0, 0, 0),
	onSecondary: rgba(0, 0, 0),
};

setTheme(defaultTheme);
