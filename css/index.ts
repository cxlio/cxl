type StyleDefinition = Partial<StrictStyleDefinition>;
type CSSStyle = {
	[P in keyof CSSStyleDeclaration]?: string | number;
};
type BaseColor = RGBA;
type Color = keyof Colors | BaseColor | 'inherit';
export type Media = 'medium' | 'large' | 'xlarge';

interface Typography {
	default: CSSStyle;
	[name: string]: CSSStyle;
}

interface Variables {
	[name: string]: any;
}

interface Colors {
	elevation: BaseColor;
	primary: BaseColor;
	primaryLight: BaseColor;
	secondary: BaseColor;
	surface: BaseColor;
	error: BaseColor;
	onPrimary: BaseColor;
	onPrimaryLight: BaseColor;
	onSecondary: BaseColor;
	onSurface: BaseColor;
	onSurface12: BaseColor;
	onError: BaseColor;
	background: BaseColor;
	link: BaseColor;
	headerText: BaseColor;
	divider: BaseColor;
}

interface StrictStyleDefinition {
	animation: string;
	elevation: number;
	translateX: number;
	translateY: number;
	translateZ: number;
	prepend: string;
	rotate: number;
	scaleX: number;
	scaleY: number;
	font: keyof Typography;
	color: Color;
	backgroundColor: Color;
	borderColor: Color;
	borderRadius: number;
	paddingLeft: number;
	paddingRight: number;
	paddingTop: number;
	paddingBottom: number;
	marginLeft: number | 'auto';
	marginRight: number | 'auto';
	marginTop: number | 'auto';
	marginBottom: number | 'auto';
	opacity: number;
	width: number;
	filter: string;
	pointerEvents: string;
	cursor: string;
	display: string;
	position: string;
	userSelect: string;
	textAlign: string;
	height: number;
	verticalAlign:
		| 'top'
		| 'middle'
		| 'bottom'
		| 'super'
		| 'sub'
		| 'text-top'
		| 'text-bottom'
		| 'baseline';
}

export interface Styles {
	[key: string]: StyleDefinition;
}

export interface StyleSheetConfiguration {
	tagName?: string;
	global?: boolean;
	styles: Styles;
	media?: Media;
}

export interface Breakpoints {
	small: number;
	large: number;
	medium: number;
	xlarge: number;
}

interface AnimationDefinition {
	keyframes: string;
	value: string;
}

interface Animation {
	[name: string]: AnimationDefinition;
}

export interface Theme {
	animation: Animation;
	colors: Colors;
	typography: Typography;
	variables: Variables;
	breakpoints: Breakpoints;
}

const PSEUDO = {
	focus: ':focus',
	hover: ':hover',
	empty: ':empty',
	active: ':active',
	firstChild: ':first-child',
	lastChild: ':last-child'
};

class RGBA {
	r: number;
	g: number;
	b: number;
	a: number;

	constructor(r: number, g: number, b: number, a?: number) {
		this.r = r < 0 ? 0 : r > 255 ? 255 : r;
		this.g = g < 0 ? 0 : g > 255 ? 255 : g;
		this.b = b < 0 ? 0 : b > 255 ? 255 : b;
		this.a = a === undefined ? 1 : a < 0 ? 0 : a > 1 ? 1 : a;
	}

	luminance() {
		return (0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b) / 255;
	}

	blend(rgba: RGBA) {
		const a = 1 - (1 - rgba.a) * (1 - this.a),
			r =
				a === 0
					? 0
					: (rgba.r * rgba.a) / a +
					  (this.r * this.a * (1 - rgba.a)) / a,
			g =
				a === 0
					? 0
					: (rgba.g * rgba.a) / a +
					  (this.g * this.a * (1 - rgba.a)) / a,
			b =
				a === 0
					? 0
					: (rgba.b * rgba.a) / a +
					  (this.b * this.a * (1 - rgba.a)) / a;
		return new RGBA(r, g, b, a);
	}

	multiply(p: number) {
		return new RGBA(this.r * p, this.g * p, this.b * p, this.a);
	}

	alpha(a: number) {
		return new RGBA(this.r, this.g, this.b, a);
	}

	toString() {
		return (
			'rgba(' +
			(this.r | 0) +
			',' +
			(this.g | 0) +
			',' +
			(this.b | 0) +
			',' +
			this.a +
			')'
		);
	}
}

function rgba(r: number, g: number, b: number, a?: number) {
	return new RGBA(r, g, b, a);
}

const SNAKE_CSS: Record<string, string> = {
		webkitOverflowScrolling: '-webkit-overflow-scrolling'
	},
	SNAKE_REGEX = /[A-Z]/g;

const defaultTheme: Theme = {
	animation: {
		spin: {
			keyframes:
				'0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-spin 2s infinite linear'
		},
		pulse: {
			keyframes:
				'0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-pulse 1s infinite steps(8)'
		},
		expand: {
			keyframes:
				'0% { transform: scale(0,0); } 100% { transform: scale(1,1); }',
			value: 'cxl-expand var(--cxl-speed) 1 ease-in'
		},
		fadeIn: {
			keyframes:
				'0% { display: block; opacity: 0; } 100% { opacity: 1; }',
			value: 'cxl-fadeIn var(--cxl-speed) linear'
		},
		wait: {
			keyframes: `
0% { transform: translateX(0) scaleX(0) }
33% { transform: translateX(0) scaleX(0.75)}
66% { transform: translateX(75%) scaleX(0.25)}
100%{ transform:translateX(100%) scaleX(0) }
			`,
			value: 'cxl-wait 1s infinite linear'
		}
	},
	breakpoints: { small: 480, medium: 960, large: 1280, xlarge: 1600 },
	variables: {
		// Animation speed
		speed: '0.2s',
		font: 'Roboto, sans-serif',
		fontSize: '16px',
		fontMonospace: 'monospace'
	},
	typography: {
		default: {
			fontWeight: 400,
			fontSize: 'var(--cxl-fontSize)',
			letterSpacing: 'normal'
		},
		caption: { fontSize: '12px', letterSpacing: 0.4 },
		h1: { fontWeight: 300, fontSize: '96px', letterSpacing: -1.5 },
		h2: { fontWeight: 300, fontSize: '60px', letterSpacing: -0.5 },
		h3: { fontSize: '48px' },
		h4: { fontSize: '34px', letterSpacing: 0.25 },
		h5: { fontSize: '24px' },
		h6: { fontSize: '20px', fontWeight: 400, letterSpacing: 0.15 },
		title: { fontSize: '18px', lineHeight: '24px' },
		subtitle: { fontSize: '16px', lineHeight: 1.375, letterSpacing: 0.15 },
		subtitle2: { fontSize: '14px', lineHeight: '18px', letterSpacing: 0.1 },
		button: {
			fontSize: '14px',
			lineHeight: '20px',
			letterSpacing: 1.25,
			textTransform: 'uppercase'
		},
		code: { fontFamily: 'var(--fontMonospace)' }
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

		onPrimary: rgba(0xff, 0xff, 0xff),
		get onPrimaryLight() {
			return this.primary;
		},
		onSecondary: rgba(0, 0, 0),
		onSurface: rgba(0, 0, 0),
		// TOFO better name?
		get onSurface12() {
			return this.onSurface.alpha(0.12);
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
		}
	}
};

type StyleMap = {
	[key: string]: (
		def: StyleDefinition,
		style: CSSStyle,
		prop: any,
		value: any
	) => void;
};

function toUnit(n: number) {
	return `${n}${UNIT}`;
}

const UNIT = 'px';
export let theme: Theme;

function renderColor(
	_def: StyleDefinition,
	style: CSSStyle,
	prop: any,
	value: Color
) {
	style[prop] =
		value in theme.colors ? `var(--cxl-${value})` : value.toString();
}

function renderDefault(style: CSSStyle, prop: any, value: string | number) {
	style[prop] = typeof value === 'number' ? toUnit(value) : value;
}

function renderTransform(v: StyleDefinition, style: CSSStyle) {
	style.transform =
		style.transform ||
		(v.translateX !== undefined || v.translateY !== undefined
			? `translate(${toUnit(v.translateX || 0)},${toUnit(
					v.translateY || 0
			  )})`
			: '') +
			(v.translateZ !== undefined
				? `translateZ(${toUnit(v.translateZ)})`
				: '') +
			(v.scaleX !== undefined || v.scaleY !== undefined
				? 'scale(' +
				  (v.scaleX === undefined ? 1 : v.scaleX) +
				  ',' +
				  (v.scaleY === undefined ? 1 : v.scaleY) +
				  ')'
				: '') +
			(v.rotate !== undefined ? 'rotate(' + v.rotate + ')' : '');
}

function renderNumber(_def: any, style: CSSStyle, prop: any, value: number) {
	style[prop] = value.toString();
}

const renderMap: StyleMap = {
	animation(def: any, style: CSSStyle, _prop: any, value: string) {
		const animation = theme.animation[value];

		if (animation) {
			style.animation = animation.value;
			def.prepend =
				(def.prepend || '') +
				`@keyframes cxl-${value}{${animation.keyframes}}`;
		}
	},
	backgroundColor: renderColor,
	borderColor: renderColor,
	color: renderColor,
	elevation(_def, style, _prop, n: number) {
		const x = toUnit(n);
		style.zIndex = n.toString();
		style.boxShadow = `${x} ${x} ${toUnit(3 * n)} var(--cxl-elevation)`;
	},
	font(
		_def: StyleDefinition,
		style: CSSStyle,
		_p: any,
		value: keyof Typography
	) {
		applyCSSStyle(style, theme.typography[value]);
	},
	opacity: renderNumber,
	translateX: renderTransform,
	translateY: renderTransform,
	translateZ: renderTransform,
	scaleX: renderTransform,
	scaleY: renderTransform,
	rotate: renderTransform
};

function toSnake(name: string) {
	return (
		SNAKE_CSS[name] ||
		(SNAKE_CSS[name] = name.replace(
			SNAKE_REGEX,
			m => '-' + m.toLowerCase()
		))
	);
}

function applyCSSStyle(style: CSSStyle, def: CSSStyle) {
	for (const i in def) style[i] = def[i];
}

function applyStyle(style: CSSStyle, def: StyleDefinition) {
	for (const i in def) {
		const fn = renderMap[i],
			val = (def as any)[i];
		if (fn) fn(def, style, i, val);
		else renderDefault(style, i, val);
	}
}

function renderStyle(def: StyleDefinition) {
	const style: CSSStyle = {};
	applyStyle(style, def);
	let result = '';

	for (const i in style) result += `${toSnake(i)}:${style[i]};`;

	return result;
}

function parseRuleName(selector: string, name: string) {
	if (name === '$') return selector;
	if (name === '*') return `${selector},${selector} *`;
	const [className, ...states] = name.split('$');
	const sel = states.length
		? '(' + states.map(s => (PSEUDO as any)[s] || `[${s}]`).join('') + ')'
		: '';
	return `${selector}${sel}${className ? ` .${className}` : ''}`;
}

function renderRule(selector: string, name: string, style: StyleDefinition) {
	return `${parseRuleName(selector, name)}{${renderStyle(style)}}`;
}

export function applyTheme(newTheme: Theme) {
	theme = newTheme;
	const { variables, colors } = theme;
	const variableStyle = document.createElement('STYLE');

	let result = ':root{';
	for (const i in colors) result += `--cxl-${i}:${(colors as any)[i]};`;
	for (const i in variables) result += `--cxl-${i}:${variables[i]};`;

	variableStyle.innerHTML = result + '}';
	document.head.appendChild(variableStyle);
}

export class StyleSheet {
	tagName?: string;
	styles: Styles;
	global: boolean;
	media?: Media;

	private native?: Element;

	constructor(config: StyleSheetConfiguration) {
		this.tagName = config.tagName;
		this.styles = config.styles;
		this.global = config.global || false;
		this.media = config.media;
	}

	cloneTo(parent: DocumentFragment | Element) {
		if (!theme) applyTheme(defaultTheme);
		const native = this.native || this.render();
		parent.appendChild(native.cloneNode(true));
	}

	private render() {
		const native = (this.native = document.createElement('style'));
		const selector = this.global ? this.tagName || 'body' : ':host';

		let css = '';

		for (const i in this.styles) {
			const style = this.styles[i];
			css += renderRule(selector, i, style);

			if (style.prepend) css = style.prepend + css;
		}

		if (this.media)
			css = `@media(min-width:${toUnit(
				theme.breakpoints[this.media]
			)}){${css}}`;

		native.innerHTML = css;

		return native;
	}
}

export const globalStyles = new StyleSheet({
	styles: {
		$: {
			// reset: '-webkit-tap-highlight-color:transparent;',
			font: 'default',
			verticalAlign: 'middle'
		},
		'*': {
			boxSizing: 'border-box',
			transition:
				'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)'
		} as any
	}
});
