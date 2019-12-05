type StyleDefinition = Partial<StrictStyleDefinition>;
type CSSStyle = Partial<CSSStyleDeclaration>;
type BaseColor = RGBA;
type Color = keyof Colors | string | BaseColor;
type StyleValue = string | number | undefined;

interface Typography {
	default: Style;
	[name: string]: Style;
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
	// animation: AnimationKey;
	elevation: number;
	translateX: number;
	translateY: number;
	translateZ: number;
	rotate: number;
	scaleX: number;
	scaleY: number;
	font: keyof Typography;
	[name: string]: StyleValue;
}

export interface Styles {
	[key: string]: StyleDefinition;
}

export interface StyleSheetConfiguration {
	tagName: string;
	global?: boolean;
	styles: Styles;
}

export interface Theme {
	colors: Colors;
	typography: Typography;
	variables: Variables;
}

export interface Style {
	[prop: string]: any;
}

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
		caption: { fontSize: 12, letterSpacing: 0.4 },
		h1: { fontWeight: 300, fontSize: 96, letterSpacing: -1.5 },
		h2: { fontWeight: 300, fontSize: 60, letterSpacing: -0.5 },
		h3: { fontSize: 48 },
		h4: { fontSize: 34, letterSpacing: 0.25 },
		h5: { fontSize: 24 },
		h6: { fontSize: 20, fontWeight: 400, letterSpacing: 0.15 },
		title: { fontSize: 18, lineHeight: 24 },
		subtitle: { fontSize: 16, lineHeight: 22, letterSpacing: 0.15 },
		subtitle2: { fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
		button: {
			fontSize: 14,
			lineHeight: 20,
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
const theme = defaultTheme;

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
	style[prop] = typeof value === 'number' ? `${value}px` : value;
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

const renderMap: StyleMap = {
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
		const font = theme.typography[value];
		for (let i in font) style[i as any] = font[i];
	},
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

function renderStyle(def: Style) {
	const style: CSSStyle = {};
	let result = '';

	for (let i in def) {
		const fn = renderMap[i];
		if (fn) fn(def, style, i, def[i]);
		else renderDefault(style, i, def[i]);
	}

	for (let i in style) result += `${toSnake(i)}:${style[i]};`;

	return result;
}

function parseRuleName(selector: string, name: string) {
	if (name === '$') return `${selector}`;
	const [className, ...states] = name.split('$');
	const sel =
		(className ? `.${className}` : '') + states.map(s => `[${s}]`).join('');
	return `${selector}(${sel})`;
}

function renderRule(selector: string, name: string, style: Style) {
	return `${parseRuleName(selector, name)}{${renderStyle(style)}}`;
}

const variableStyle = document.createElement('STYLE');

function applyTheme({ variables, colors }: Theme) {
	let result = '';

	for (let i in colors) result += `--cxl-${i}:${(colors as any)[i]}`;
	for (let i in variables) result += `--cxl-${i}:${variables[i]};`;

	variableStyle.innerHTML = result;
}

applyTheme(defaultTheme);

export class StyleSheet {
	tagName: string;
	styles: Styles;
	global: boolean;

	private native?: Element;

	constructor(config: StyleSheetConfiguration) {
		this.tagName = config.tagName;
		this.styles = config.styles;
		this.global = config.global || false;
	}

	cloneTo(parent: DocumentFragment | Element) {
		const native = this.native || this.render();
		parent.appendChild(native.cloneNode(true));
	}

	render() {
		const native = (this.native = document.createElement('style'));
		const selector = this.global ? this.tagName : ':host';

		let css = '';

		for (let i in this.styles)
			css += renderRule(selector, i, this.styles[i]);

		native.innerHTML = css;

		return native;
	}
}
