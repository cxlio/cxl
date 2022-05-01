///<amd-module name="@cxl/css"/>
export type StyleDefinition<T extends Theme = Theme> = Partial<
	StrictStyleDefinition<T>
>;
export type BaseColor = RGBA;
export type CSSStyle = {
	[P in keyof CSSStyleDeclaration]?: string | number;
};
export type Color<T extends Theme> =
	| keyof T['colors']
	| BaseColor
	| 'inherit'
	| 'transparent';
export type Percentage = '50%' | '100%' | CustomPercentage;
export type Length = number | Percentage | 'auto';
export type ColorVariables<T> = {
	[K in keyof T]: string;
};
export type VariableList<T extends Theme> = T['variables'] &
	ColorVariables<T['colors']>;
export type FlexAlign =
	| 'normal'
	| 'stretch'
	| 'center'
	| 'start'
	| 'end'
	| 'flex-start'
	| 'flex-end'
	| 'baseline';

export interface Variables {}
export interface Colors {}

export interface FontDefinition {
	family: string;
	url: string;
	weight?: string;
}
export interface Typography {
	default: CSSStyle;
}

export interface StrictStyleDefinition<T extends Theme> {
	alignItems: FlexAlign;
	alignSelf: FlexAlign;
	animation: keyof T['animation'];
	animationDuration: string;
	backgroundImage: string;
	backgroundColor: Color<T>;
	backgroundSize: 'cover' | 'contain';
	backgroundPosition: 'center';
	backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
	borderBottom: Length;
	borderLeft: Length;
	borderRight: Length;
	borderTop: Length;
	borderColor: Color<T>;
	borderWidth: number;
	borderRadius: Length;
	borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
	boxShadow: BoxShadow<T> | 'none';
	fill: Color<T>;
	elevation: 0 | 1 | 2 | 3 | 4 | 5;
	fontSize: number | 'inherit';
	fontStyle: 'italic';
	translateX: Length;
	translateY: Length;
	translateZ: Length;
	rowGap: Length;
	columnGap: Length;
	gridColumnEnd: string;
	gridAutoFlow: 'column';
	gridTemplateColumns: string;
	prepend: string;
	rotate: number;
	scaleX: number;
	scaleY: number;
	font: keyof T['typography'];
	color: Color<T>;
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
	listStyleImage: string;
	listStylePosition: 'inside' | 'outside';
	listStyleType: 'none' | 'inherit' | 'initial' | 'unset';
	width: Length | 'max-content' | 'min-content';
	top: Length;
	left: Length;
	right: Length;
	bottom: Length;
	filter: string;
	flexGrow: number;
	flexShrink: number;
	flexBasis: Length;
	flexDirection: string;
	flexWrap: 'wrap';
	justifyContent: string;
	pointerEvents: string;
	cursor: string;
	display:
		| 'block'
		| 'inline'
		| 'table'
		| 'flex'
		| 'grid'
		| 'table-row'
		| 'table-caption'
		| 'table-row-group'
		| 'table-cell'
		| 'contents'
		| 'none'
		| 'initial'
		| 'inline-flex'
		| 'inline-block';
	position: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
	userSelect: string;
	textAlign: string;
	textDecoration: string;
	textOverflow: 'ellipsis';
	textTransform: 'uppercase' | 'none';
	transition: 'unset';
	height: Length;
	minHeight: Length;
	minWidth: Length;
	maxHeight: Length;
	maxWidth: Length;
	variables: Partial<VariableList<T>>;
	verticalAlign:
		| 'top'
		| 'middle'
		| 'bottom'
		| 'super'
		| 'sub'
		| 'text-top'
		| 'text-bottom'
		| 'baseline';
	willChange: 'transform';
	whiteSpace: 'nowrap' | 'pre-wrap';
	wordBreak: 'break-all';
	zIndex: number;
}

export interface BoxShadow<T extends Theme = Theme> {
	offsetX: number;
	offsetY: number;
	blurRadius: number;
	spread: number;
	color: Color<T>;
}

export type StylesOnly<T extends Theme> = {
	[key: string]: StyleDefinition<T>;
};

export type Styles<T extends Theme = Theme> =
	| StylesOnly<T>
	| {
			'@small'?: StylesOnly<T>;
			'@medium'?: StylesOnly<T>;
			'@large'?: StylesOnly<T>;
			'@xlarge'?: StylesOnly<T>;
	  };

export type Breakpoint = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type CSSUnit = 'px' | 'em' | 'rem';

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
	none: undefined;
}

export interface Theme {
	animation: Animation;
	colors: Colors;
	typography: Typography;
	variables: Variables;
	breakpoints: Breakpoints;
	globalStyles?: Styles<any>;
	imports?: string[];
	unit: CSSUnit;
}

export interface RGBA {
	readonly a: number;
	readonly r: number;
	readonly g: number;
	readonly b: number;
	toString(): string;
}

export type CustomPercentage = { __pct: true; toString(): string };

const PSEUDO = {
	focus: ':focus',
	focusWithin: ':focus-within',
	hover: ':hover',
	empty: ':empty',
	active: ':active',
	firstChild: ':first-child',
	lastChild: ':last-child',
	'::scrollbar': '::-webkit-scrollbar',
	'::scrollbar-track': '::-webkit-scrollbar-track',
	'::scrollbar-thumb': '::-webkit-scrollbar-thumb',
};
const PSEUDO2 = {
	'$::scrollbar': ':host::-webkit-scrollbar',
	'$::scrollbar-track': ':host::-webkit-scrollbar-track',
	'$::scrollbar-thumb': ':host::-webkit-scrollbar-thumb',
};

export function boxShadow<T extends Theme>(
	offsetX: number,
	offsetY: number,
	blurRadius: number,
	spread: number,
	color: Color<T>
) {
	return { offsetX, offsetY, blurRadius, spread, color };
}

export function pct(n: number): CustomPercentage {
	return {
		__pct: true,
		toString() {
			return `${n}%`;
		},
	};
}

const SNAKE_CSS: Record<string, string> = {
		webkitOverflowScrolling: '-webkit-overflow-scrolling',
	},
	SNAKE_REGEX = /[A-Z]/g;

export const defaultTheme: Theme = {
	animation: { none: undefined },
	breakpoints: { small: 600, medium: 905, large: 1240, xlarge: 1440 },
	variables: { css: '' },
	typography: {
		default: {
			fontWeight: 400,
			fontFamily: 'var(--cxl-font)',
			fontSize: 'var(--cxl-font-size)',
			letterSpacing: 'normal',
		},
	},
	colors: {
		shadow: rgba(0, 0, 0, 0.26),
	},
	unit: 'px',
};

type StyleMap = {
	[key: string]: (
		def: StyleDefinition<Theme>,
		style: CSSStyle,
		prop: any,
		value: any
	) => void;
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

function parseRuleName(selector: string, name: string) {
	if (name === '$') return selector;
	if (name === '*') return `${selector},${selector} *`;
	// Style <a> tags.
	if (name === '@a') return `a`;
	if (name in PSEUDO2) return (PSEUDO2 as any)[name];

	const [className, ...states] = name.split('$');
	const sel = states.length
		? '(' + states.map(s => (PSEUDO as any)[s] || `[${s}]`).join('') + ')'
		: '';
	return `${selector}${sel}${className ? ` .${className}` : ''}`;
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

function rgbaToString(this: RGBA) {
	return `rgba(${this.r},${this.g},${this.b},${this.a})`;
}

export function rgba(r: number, g: number, b: number, a = 1): RGBA {
	r = r < 0 ? 0 : r > 255 ? 255 : r;
	g = g < 0 ? 0 : g > 255 ? 255 : g;
	b = b < 0 ? 0 : b > 255 ? 255 : b;
	a = a < 0 ? 0 : a > 1 ? 1 : a;
	return {
		r,
		g,
		b,
		a,
		toString: rgbaToString,
	};
}

export function mask({ r, g, b, a }: RGBA) {
	return `linear-gradient(rgba(${r},${g},${b},${a})`;
}

export function renderVariables(variables: Variables) {
	let result = '';
	for (const i in variables)
		result += `--cxl-${toSnake(i)}:${(variables as any)[i]};`;
	return result;
}

export function renderGlobal(theme: {
	variables?: Variables;
	colors?: Colors;
	imports?: string[];
}) {
	const { variables, colors, imports } = theme;

	let result = '';
	if (imports) imports.forEach(imp => (result += `@import url("${imp}");`));

	result += ':root{';

	for (const i in colors) {
		const name = toSnake(i);
		const value = (colors as any)[i];
		result += `--cxl-${name}:${value};--cxl--${name}:${value};`;
	}
	if (variables) result += renderVariables(variables);
	return result;
}

export const White = rgba(255, 255, 255, 1);
export const White8 = mask(rgba(255, 255, 255, 0.08));
export const White12 = mask(rgba(255, 255, 255, 0.12));
export const White87 = mask(rgba(255, 255, 255, 0.12));

export function buildTheme<T extends Theme>(theme: T) {
	const rootStyles = document.createElement('style');

	function toUnit(n: Length) {
		return `${n}${typeof n === 'number' ? theme.unit : ''}`;
	}

	function color(val: Color<T>) {
		return typeof val === 'string' && val in theme.colors
			? `var(--cxl-${toSnake(val.toString())})`
			: val.toString();
	}
	function renderColor(
		_def: StyleDefinition<Theme>,
		style: CSSStyle,
		prop: any,
		value: Color<Theme>
	) {
		style[prop] = color(value);
	}

	function renderDefault(style: CSSStyle, prop: any, value: any) {
		style[prop] = toUnit(value);
	}

	function renderTransform(v: StyleDefinition<Theme>, style: CSSStyle) {
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

	function renderNumber(
		_def: any,
		style: CSSStyle,
		prop: any,
		value: number
	) {
		style[prop] = value.toString();
	}

	function applyCSSStyle(style: CSSStyle, def: CSSStyle) {
		for (const i in def) style[i] = def[i];
	}

	const renderMap: StyleMap = {
		animation(
			def: any,
			style: CSSStyle,
			_prop: any,
			value: keyof T['animation']
		) {
			if (value === 'none') {
				style.animation = 'none';
				return;
			}

			const animation = (theme.animation as any)[value];

			if (animation) {
				style.animation = animation.value;
				def.prepend =
					(def.prepend || '') +
					`@keyframes cxl-${value}{${animation.keyframes}}`;
			} else throw new Error('Animation not defined');
		},
		backgroundColor: renderColor,
		borderColor: renderColor,
		boxShadow(_def, style, _prop, v: BoxShadow<Theme>) {
			if (typeof v === 'string') return (style.boxShadow = v);
			style.boxShadow = `${toUnit(v.offsetX)} ${toUnit(
				v.offsetY
			)} ${toUnit(v.blurRadius)} ${toUnit(v.spread)} ${color(v.color)}`;
		},
		color: renderColor,
		fill: renderColor,
		elevation(_def, style, _prop, n: number) {
			const x = toUnit(n);
			style.zIndex = n.toString();
			style.boxShadow =
				n > 0 ? `${x} ${x} ${toUnit(5 * n)} var(--cxl-shadow)` : 'none';
		},
		font(
			_def: StyleDefinition<Theme>,
			style: CSSStyle,
			_p: any,
			value: keyof Typography
		) {
			const css = {
				...theme.typography.default,
				...theme.typography[value],
			};
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
			_def: StyleDefinition<Theme>,
			style: CSSStyle,
			_p: any,
			value: VariableList<Theme>
		) {
			for (const i in value)
				(style as any)[`--cxl-${toSnake(i)}`] = (value as any)[i];
		},
		zIndex: renderNumber,
	};
	function applyStyle(style: CSSStyle, def: StyleDefinition<Theme>) {
		for (const i in def) {
			const fn = renderMap[i],
				val = (def as any)[i];
			if (fn) fn(def, style, i, val);
			else renderDefault(style, i, val);
		}
	}
	function renderMedia(media: number, style: Styles, selector: string) {
		return `@media(min-width:${toUnit(media)}){${render(style, selector)}}`;
	}

	function renderRule(
		selector: string,
		name: string,
		styles: StyleDefinition | Styles
	) {
		if (
			name === '@small' ||
			name === '@xlarge' ||
			name === '@medium' ||
			name === '@large'
		)
			return renderMedia(
				(theme.breakpoints as any)[name.slice(1)],
				styles as Styles,
				selector
			);

		return `${parseRuleName(selector, name)}{${style(
			styles as StyleDefinition
		)}}`;
	}
	function style(def: StyleDefinition) {
		const cssStyle: CSSStyle = {};
		applyStyle(cssStyle, def);
		let result = '';

		for (const i in cssStyle) result += `${toSnake(i)}:${cssStyle[i]};`;

		return result;
	}
	function render(styles: Styles, baseSelector = ':host') {
		let css = '';

		for (const i in styles) {
			const style = (styles as any)[i];
			css += renderRule(baseSelector, i, style);

			if (style.prepend) css = style.prepend + css;
		}

		return css;
	}

	function createStyleElement<T extends Theme>(
		styles: Styles,
		selector = ':host',
		global = false,
		theme: T
	) {
		const result = document.createElement('style');

		result.textContent =
			(!global && theme.globalStyles
				? render(theme.globalStyles, selector)
				: '') + render(styles, selector);

		return result;
	}

	function applyTheme(container = document.head) {
		const result = renderGlobal(theme);
		rootStyles.innerHTML = result + '}';
		container.appendChild(rootStyles);
	}

	return {
		baseColor(name: keyof T['colors']) {
			return `var(--cxl--${toSnake(name as any)})`;
		},
		style,
		render,
		applyTheme,
		css(styles: Styles<T>, selector = ':host', global = false) {
			let stylesheet: HTMLStyleElement;
			return () => {
				if (!stylesheet)
					stylesheet = createStyleElement(
						styles,
						selector,
						global,
						theme
					);
				return stylesheet.cloneNode(true) as HTMLStyleElement;
			};
		},
	};
}
