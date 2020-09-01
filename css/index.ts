type StyleDefinition = Partial<StrictStyleDefinition>;
type BaseColor = RGBA;

export type CSSStyle = {
	[P in keyof CSSStyleDeclaration]?: string | number;
};
export type Color = keyof Colors | BaseColor | 'inherit' | 'transparent';
export type Percentage = '50%' | '100%' | CustomPercentage;
export type Length = number | Percentage | 'auto';

export interface Typography {
	default: CSSStyle;
}

export type Variables = Record<string, string | { toString(): string }>;

export interface Colors {
	elevation: BaseColor;
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
	link: BaseColor;
	headerText: BaseColor;
	divider: BaseColor;
}

export type VariableList = Colors & Variables;

interface StrictStyleDefinition {
	alignItems: string;
	alignSelf: string;
	animation: string;
	animationDuration: string;
	backgroundColor: Color;
	borderBottom: Length;
	borderLeft: Length;
	borderRight: Length;
	borderTop: Length;
	borderColor: Color;
	borderWidth: number;
	borderRadius: Length;
	borderStyle: 'solid' | 'none';
	boxShadow: BoxShadow | 'none';
	elevation: number;
	fontSize: 'inherit';
	translateX: Length;
	translateY: Length;
	translateZ: Length;
	gridColumnEnd: string;
	prepend: string;
	rotate: number;
	scaleX: number;
	scaleY: number;
	font: keyof Typography;
	color: Color;
	paddingLeft: Length;
	paddingRight: Length;
	paddingTop: Length;
	paddingBottom: Length;
	marginLeft: number | 'auto';
	marginRight: number | 'auto';
	marginTop: number | 'auto';
	marginBottom: number | 'auto';
	opacity: number;
	outline: number | string;
	overflowY: string;
	overflowX: string;
	transformOrigin: string;
	overflowScrolling: string;
	lineHeight: number;
	width: Length;
	top: Length;
	left: Length;
	right: Length;
	bottom: Length;
	filter: string;
	flexGrow: number;
	flexShrink: number;
	flexDirection: string;
	justifyContent: string;
	pointerEvents: string;
	cursor: string;
	display: string;
	position: string;
	userSelect: string;
	textAlign: string;
	textDecoration: string;
	transition: 'unset';
	height: Length;
	minHeight: Length;
	minWidth: Length;
	variables: Partial<VariableList>;
	verticalAlign:
		| 'top'
		| 'middle'
		| 'bottom'
		| 'super'
		| 'sub'
		| 'text-top'
		| 'text-bottom'
		| 'baseline';
	whiteSpace: 'nowrap' | 'pre-wrap';
	zIndex: number;
}

export interface BoxShadow {
	offsetX: number;
	offsetY: number;
	blurRadius: number;
	spread: number;
	color: Color;
}

export type Styles =
	| {
			[key: string]: StyleDefinition;
	  }
	| {
			'@small'?: Styles;
			'@medium'?: Styles;
			'@large'?: Styles;
			'@xlarge'?: Styles;
	  };

export interface StyleSheetConfiguration {
	tagName?: string;
	global?: boolean;
	styles: Styles;
}

export interface Breakpoints {
	small: number;
	large: number;
	medium: number;
	xlarge: number;
}

export interface AnimationDefinition {
	keyframes: string;
	value: string;
}

export interface Animation {
	[name: string]: AnimationDefinition;
}

export interface Theme {
	animation: Animation;
	colors: Colors;
	typography: Typography;
	variables: Variables;
	breakpoints: Breakpoints;
	globalStyles: Styles;
	imports?: string[];
}

const PSEUDO = {
	focus: ':focus',
	focusWithin: ':focus-within',
	hover: ':hover',
	empty: ':empty',
	active: ':active',
	firstChild: ':first-child',
	lastChild: ':last-child',
};

export class CustomPercentage {
	constructor(private n: number) {}
	toString() {
		return this.n + '%';
	}
}

export function boxShadow(
	offsetX: number,
	offsetY: number,
	blurRadius: number,
	spread: number,
	color: Color
) {
	return { offsetX, offsetY, blurRadius, spread, color };
}

export function pct(n: number) {
	return new CustomPercentage(n);
}

export class RGBA {
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

const SNAKE_CSS: Record<string, string> = {
		webkitOverflowScrolling: '-webkit-overflow-scrolling',
	},
	SNAKE_REGEX = /[A-Z]/g;

let theme: Theme;

type StyleMap = {
	[key: string]: (
		def: StyleDefinition,
		style: CSSStyle,
		prop: any,
		value: any
	) => void;
};

const UNIT = 'px';

function toUnit(n: Length) {
	return `${n}${typeof n === 'number' ? UNIT : ''}`;
}

function color(val: Color) {
	return val in theme.colors
		? `var(--cxl-${toSnake(val.toString())})`
		: val.toString();
}

function renderColor(
	_def: StyleDefinition,
	style: CSSStyle,
	prop: any,
	value: Color
) {
	style[prop] = color(value);
}

function renderDefault(style: CSSStyle, prop: any, value: any) {
	style[prop] = toUnit(value);
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
			(v.rotate !== undefined ? 'rotate(' + v.rotate + 'deg)' : '');
}

function renderNumber(_def: any, style: CSSStyle, prop: any, value: number) {
	style[prop] = value.toString();
}

function applyCSSStyle(style: CSSStyle, def: CSSStyle) {
	for (const i in def) style[i] = def[i];
}

const renderMap: StyleMap = {
	animation(def: any, style: CSSStyle, _prop: any, value: string) {
		if (value === 'none') {
			style.animation = 'none';
			return;
		}

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
	boxShadow(_def, style, _prop, v: BoxShadow) {
		if (typeof v === 'string') return (style.boxShadow = v);
		style.boxShadow = `${toUnit(v.offsetX)} ${toUnit(v.offsetY)} ${toUnit(
			v.blurRadius
		)} ${toUnit(v.spread)} ${color(v.color)}`;
	},
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
		const css = { ...theme.typography.default, ...theme.typography[value] };
		applyCSSStyle(style, css);
	},
	flexGrow: renderNumber,
	flexShrink: renderNumber,
	opacity: renderNumber,
	translateX: renderTransform,
	translateY: renderTransform,
	translateZ: renderTransform,
	scaleX: renderTransform,
	scaleY: renderTransform,
	rotate: renderTransform,
	variables(
		_def: StyleDefinition,
		style: CSSStyle,
		_p: any,
		value: VariableList
	) {
		for (const i in value)
			(style as any)[`--cxl-${toSnake(i)}`] = (value as any)[i];
	},
	zIndex: renderNumber,
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

export function style(def: StyleDefinition) {
	return renderStyle(def);
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

const rootStyles = document.createElement('STYLE');

export function setTheme(newTheme: Theme) {
	const { variables, colors, imports } = newTheme;

	let result = '';
	if (imports) imports.forEach(imp => (result += `@import url("${imp}");`));

	result += ':root{background-color:var(--cxl-background);';

	for (const i in colors)
		result += `--cxl-${toSnake(i)}:${(colors as any)[i]};`;
	for (const i in variables)
		result += `--cxl-${toSnake(i)}:${(variables as any)[i]};`;

	rootStyles.innerHTML = result + '}';
	document.head.appendChild(rootStyles);
	theme = newTheme;
}

function renderStyles(styles: Styles, selector = 'body') {
	let css = '';

	for (const i in styles) {
		const style = (styles as any)[i];
		css += renderRule(selector, i, style);

		if (style.prepend) css = style.prepend + css;
	}

	return css;
}

function renderMedia(media: number, style: Styles, selector: string) {
	return `@media(min-width:${toUnit(media)}){${renderStyles(
		style,
		selector
	)}}`;
}

function renderRule(
	selector: string,
	name: string,
	style: StyleDefinition | Styles
) {
	if (name === '@small')
		return renderMedia(theme.breakpoints.small, style as Styles, selector);
	if (name === '@xlarge')
		return renderMedia(theme.breakpoints.xlarge, style as Styles, selector);
	if (name === '@medium')
		return renderMedia(theme.breakpoints.medium, style as Styles, selector);
	if (name === '@large')
		return renderMedia(theme.breakpoints.large, style as Styles, selector);

	return `${parseRuleName(selector, name)}{${renderStyle(
		style as StyleDefinition
	)}}`;
}

export class StyleSheet {
	selector: string;
	styles: Styles;
	global: boolean;

	private native?: Element;

	constructor(config: StyleSheetConfiguration) {
		this.styles = config.styles;
		this.global = config.global || false;
		this.selector = config.tagName || (config.global ? 'body' : ':host');
	}

	clone() {
		const native = this.native || this.render();
		return native.cloneNode(true);
	}

	cloneTo(parent: DocumentFragment | Element) {
		parent.appendChild(this.clone());
	}

	private render() {
		const native = (this.native = document.createElement('style'));

		native.innerHTML =
			(this.global
				? ''
				: renderStyles(theme.globalStyles, this.selector)) +
			renderStyles(this.styles, this.selector);

		return native;
	}
}

export function css(styles: Styles, global = false) {
	let stylesheet: StyleSheet;
	return () => {
		if (!stylesheet) stylesheet = new StyleSheet({ styles, global });
		return stylesheet.clone();
	};
}

export interface FontDefinition {
	family: string;
	url: string;
	weight?: string;
}

export function registerFont(def: FontDefinition) {
	const style = document.createElement('STYLE');

	style.innerHTML = `@font-face{font-family:"${def.family}"${
		def.weight ? ';font-weight:' + def.weight : ''
	};src:url("${def.url}");}`;

	document.head.appendChild(style);

	return style;
}

export function Style(p: { children: Styles }) {
	return css(p.children);
}

export function padding(
	paddingTop: number | 'auto',
	paddingRight = paddingTop,
	paddingBottom = paddingTop,
	paddingLeft = paddingTop
) {
	return { paddingTop, paddingRight, paddingBottom, paddingLeft };
}

export function margin(
	marginTop: number | 'auto',
	marginRight = marginTop,
	marginBottom = marginTop,
	marginLeft = marginTop
) {
	return { marginTop, marginRight, marginBottom, marginLeft };
}

export function border(
	borderTop: number | 'auto',
	borderRight = borderTop,
	borderBottom = borderTop,
	borderLeft = borderTop
) {
	return { borderTop, borderRight, borderBottom, borderLeft };
}

export function rgba(r: number, g: number, b: number, a?: number) {
	return new RGBA(r, g, b, a);
}
