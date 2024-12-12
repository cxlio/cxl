///<amd-module name="@cxl/css"/>
export type StyleDefinition<T extends Theme = Theme> = {
	[K in keyof StrictStyleDefinition<T>]?:
		| StrictStyleDefinition<T>[K]
		| Variable<StrictStyleDefinition<T>[K]>;
};

export type BaseColor = RGBA;
export type CSSStyle = {
	[P in keyof CSSStyleDeclaration]?: string | number;
};
export type Color<T extends Theme> =
	| keyof T['colors']
	| BaseColor
	| 'currentColor'
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
export type StyleKey<T extends Theme> = keyof StrictStyleDefinition<T>;
type CSSStyleKey = Exclude<keyof CSSStyle, 'length' | 'parentRule'>;

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
	backgroundClip: 'content-box';
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
	boxSizing: 'border-box';
	clipPath: string;
	fill: Color<T>;
	stroke: Color<T>;
	elevation: 0 | 1 | 2 | 3 | 4 | 5;
	fontSize: number | 'inherit';
	fontStyle: 'italic';
	touchAction: 'none' | 'pan-y' | 'pan-x';
	translateX: Length;
	translateY: Length;
	//translateZ: Length;
	rowGap: Length;
	columnGap: Length;
	gridAutoColumns: string;
	gridColumnEnd: string;
	gridAutoFlow: 'column' | 'row';
	gridTemplateColumns: string;
	gridTemplateRows: string;
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
	outlineOffset: number;
	order: number;
	overflowY: 'hidden' | 'visible' | 'auto';
	overflowX: 'hidden' | 'visible' | 'auto';
	transformOrigin: string;
	overflowScrolling: string;
	lineHeight: number | 'unset';
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
		| 'inline-grid'
		| 'grid'
		| 'table-row'
		| 'table-caption'
		| 'table-row-group'
		| 'table-cell'
		| 'contents'
		| 'none'
		| 'initial'
		| 'inline-flex'
		| 'inline-block'
		| 'inherit';
	position: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
	userSelect: string;
	textAlign: string;
	textDecoration: string;
	textOverflow: 'ellipsis';
	textTransform: 'uppercase' | 'capitalize' | 'none';
	transition: string;
	height: Length;
	minHeight: Length | 'none';
	minWidth: Length | 'none';
	maxHeight: Length | 'none';
	maxWidth: Length | 'none';
	mixBlendMode: 'difference';
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
	whiteSpace: 'nowrap' | 'pre-wrap' | 'pre';
	wordBreak: 'break-all' | 'break-word';
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

export type Styles<T extends Theme> =
	| StylesOnly<T>
	| {
			'@small'?: StylesOnly<T>;
			'@medium'?: StylesOnly<T>;
			'@large'?: StylesOnly<T>;
			'@xlarge'?: StylesOnly<T>;
			'@xxlarge'?: StylesOnly<T>;
	  };

export type BreakpointKey =
	| 'xsmall'
	| 'small'
	| 'medium'
	| 'large'
	| 'xlarge'
	| 'xxlarge';
export type CSSUnit = 'px' | 'em' | 'rem';

export interface Breakpoints {
	small: number;
	large: number;
	medium: number;
	xlarge: number;
	xxlarge: number;
}

export interface AnimationDefinition {
	keyframes: Keyframe[];
	options?: KeyframeAnimationOptions;
}

export interface Animation {
	none: undefined;
}

export interface Theme {
	animation: Animation;
	colors: Colors;
	typography: {
		default: CSSStyle;
	};
	variables: Variables;
	breakpoints: Breakpoints;
	imports?: readonly string[];
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
	focusVisible: ':focus-visible',
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
	'$::-webkit-scrollbar': ':host::-webkit-scrollbar',
	'$::-webkit-scrollbar-track': ':host::-webkit-scrollbar-track',
	'$::-webkit-scrollbar-thumb': ':host::-webkit-scrollbar-thumb',
};

export function boxShadow<T extends Theme>(
	offsetX: number,
	offsetY: number,
	blurRadius: number,
	spread: number,
	color: Color<T>,
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
		webkitUserSelect: '-webkit-user-select',
	},
	SNAKE_REGEX = /[A-Z]/g;

export const defaultTheme: Theme = {
	animation: { none: undefined },
	breakpoints: {
		small: 600,
		medium: 905,
		large: 1240,
		xlarge: 1920,
		xxlarge: 2560,
	},
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

type StyleMap<T extends Theme> = {
	[K in StyleKey<T>]: (
		def: StyleDefinition<T>,
		style: CSSStyle,
		prop: K,
		value: StrictStyleDefinition<T>[K],
	) => void;
};

function toSnake(name: string) {
	return (
		SNAKE_CSS[name] ||
		(SNAKE_CSS[name] = name.replace(
			SNAKE_REGEX,
			m => '-' + m.toLowerCase(),
		))
	);
}

function parseRuleName(selector: string, name: string) {
	if (name === '$') return selector;
	if (name === '*') return `${selector},${selector} *`;
	// Style <a> tags.
	if (name === '@a') return `a`;
	if (name in PSEUDO2) return PSEUDO2[name as keyof typeof PSEUDO2];

	const [className, ...states] = name.split('$');
	const sel = states.length
		? '(' +
		  states
				.map(s => PSEUDO[s as keyof typeof PSEUDO] || `[${s}]`)
				.join('') +
		  ')'
		: '';
	return `${selector}${sel}${
		className
			? className.startsWith(':')
				? ` ${className}`
				: ` .${className}`
			: ''
	}`;
}

export function padding(
	paddingTop: number | 'auto',
	paddingRight = paddingTop,
	paddingBottom = paddingTop,
	paddingLeft = paddingTop,
) {
	return { paddingTop, paddingRight, paddingBottom, paddingLeft };
}

export function margin(
	marginTop: number | 'auto',
	marginRight = marginTop,
	marginBottom = marginTop,
	marginLeft = marginTop,
) {
	return { marginTop, marginRight, marginBottom, marginLeft };
}

export function border(
	borderTop: number | 'auto',
	borderRight = borderTop,
	borderBottom = borderTop,
	borderLeft = borderTop,
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
		result += `--cxl-${toSnake(i)}:${
			variables[i as keyof typeof variables]
		};`;
	return result;
}

export function renderGlobal(theme: {
	variables?: Variables;
	typography?: Typography;
	colors?: Colors;
	imports?: readonly string[];
	globalCss?: string;
}) {
	const { variables, colors, imports, typography } = theme;

	// Imports must be at the top of the stylesheet
	let result =
		(imports?.map(imp => `@import url("${imp}");`).join('') || '') +
		(theme.globalCss || '');

	result += ':root{';

	for (const i in colors) {
		const name = toSnake(i);
		const value = colors[i as keyof typeof colors];
		result += `--cxl-${name}:${value};--cxl--${name}:${value};`;
	}

	if (typography) {
		const def = typography.default;

		for (const i in typography) {
			const name = toSnake(i);
			const {
				fontFamily,
				fontSize,
				fontWeight,
				letterSpacing,
				textTransform,
				lineHeight,
			} = typography[i as keyof typeof typography];
			const fontCss = `${fontWeight ?? def.fontWeight} ${
				fontSize ?? def.fontSize
			}${lineHeight ? `/${lineHeight}` : ''} ${
				fontFamily ?? def.fontFamily
			}`;

			result +=
				`--cxl-font-${name}:${fontCss};` +
				(letterSpacing || def.letterSpacing
					? `--cxl-font-${name}-spacing:${
							letterSpacing || def.letterSpacing
					  };`
					: '') +
				(textTransform
					? `--cxl-font-${name}-transform:${textTransform};`
					: '');
		}
	}

	if (variables) result += renderVariables(variables);
	return result;
}

export class Variable<T> {
	constructor(public readonly name: string) {}
	readonly __brand?: T;
	toString() {
		return `var(--cxl-${toSnake(this.name)})`;
	}
}

export const White = rgba(255, 255, 255, 1);
export const White8 = mask(rgba(255, 255, 255, 0.08));
export const White12 = mask(rgba(255, 255, 255, 0.12));
export const White87 = mask(rgba(255, 255, 255, 0.12));

export function buildTheme<T extends Theme>(theme: T) {
	const rootStyles = document.createElement('style');

	function toUnit(n: Length | Variable<Length>) {
		return `${n}${typeof n === 'number' ? theme.unit : ''}`;
	}

	function color(val: Color<T>) {
		return typeof val === 'string' && val in theme.colors
			? `var(--cxl-${toSnake(val.toString())})`
			: val.toString();
	}
	function renderColor(
		_def: StyleDefinition<T>,
		style: CSSStyle,
		prop: StyleKey<T>,
		value: Color<T>,
	) {
		style[prop as CSSStyleKey] = color(value);
	}

	function renderDefault(style: CSSStyle, prop: StyleKey<T>, value: Length) {
		style[prop as CSSStyleKey] = toUnit(value);
	}

	function renderTransform(v: StyleDefinition<T>, style: CSSStyle) {
		const transform =
			style.transform ||
			(v.translateX !== undefined || v.translateY !== undefined
				? `translate(${toUnit(v.translateX || 0)},${toUnit(
						v.translateY || 0,
				  )})`
				: '') +
				(v.scaleX !== undefined || v.scaleY !== undefined
					? 'scale(' +
					  (v.scaleX === undefined ? 1 : v.scaleX) +
					  ',' +
					  (v.scaleY === undefined ? 1 : v.scaleY) +
					  ')'
					: '') +
				(v.rotate !== undefined ? 'rotate(' + v.rotate + 'deg)' : '');
		if (transform && transform !== style.transform)
			style.transform = transform;
	}

	function renderNumber(
		_def: unknown,
		style: CSSStyle,
		prop: CSSStyleKey,
		value: number,
	) {
		style[prop] = value.toString();
	}

	function renderKeyframes(keyframes: Keyframe[]) {
		const frames = new KeyframeEffect(null, keyframes).getKeyframes();
		return frames
			.map((k, i) => {
				const offset = `${k.computedOffset * 100}%`;
				return `${offset}{${style({
					...keyframes[i],
					offset: undefined,
				} as StyleDefinition)}}`;
			})
			.join('');
	}

	function renderAnimationValue(
		key: string,
		options?: KeyframeAnimationOptions,
	) {
		if (!options) return `${key} var(--cxl-speed)`;
		const { duration, fill, iterations, easing } = options;
		return `${key} ${duration ? duration + 'ms' : 'var(--cxl-speed)'} ${
			iterations === Infinity ? 'infinite' : iterations || ''
		} ${easing || ''} ${fill || ''}`;
	}

	const renderMap: Partial<StyleMap<T>> = {
		animation(def, style, _prop, value) {
			if (value === 'none') {
				style.animation = 'none';
				return;
			}

			const animation =
				theme.animation[value as keyof typeof theme.animation];

			if (animation) {
				const name = `cxl-${String(value)}`;
				style.animation = renderAnimationValue(
					name,
					(animation as AnimationDefinition).options,
				);
				def.prepend =
					(def.prepend || '') +
					`@keyframes ${name} {${renderKeyframes(
						(animation as AnimationDefinition).keyframes,
					)}}`;
			} else throw new Error('Animation not defined');
		},
		backgroundColor: renderColor,
		borderColor: renderColor,
		borderTop: (_d, s, _p, val) => (s.borderTopWidth = toUnit(val)),
		borderLeft: (_d, s, _p, val) => (s.borderLeftWidth = toUnit(val)),
		borderBottom: (_d, s, _p, val) => (s.borderBottomWidth = toUnit(val)),
		borderRight: (_d, s, _p, val) => (s.borderRightWidth = toUnit(val)),
		boxShadow(_def, style, _prop, v) {
			if (typeof v === 'string') return (style.boxShadow = v);
			style.boxShadow = `${toUnit(v.offsetX)} ${toUnit(
				v.offsetY,
			)} ${toUnit(v.blurRadius)} ${toUnit(v.spread)} ${color(v.color)}`;
		},
		userSelect(_def, style, _prop, v) {
			style.webkitUserSelect = style.userSelect = v;
		},
		color: renderColor,
		fill: renderColor,
		stroke: renderColor,
		elevation(_def, style, _prop, n: number) {
			const x = toUnit(n);
			style.zIndex = n.toString();
			style.boxShadow =
				n > 0 ? `${x} ${x} ${toUnit(5 * n)} var(--cxl-shadow)` : 'none';
		},
		font(_def, style, _p, value) {
			style.font =
				'var(--cxl-font-' +
				(value as string) +
				', var(--cxl-font-default))';
			style.letterSpacing =
				'var(--cxl-font-' + (value as string) + '-spacing, normal)';
			style.textTransform =
				'var(--cxl-font-' + (value as string) + '-transform)';
		},
		flexGrow: renderNumber,
		flexShrink: renderNumber,
		opacity: renderNumber,
		order: renderNumber,
		translateX: renderTransform,
		translateY: renderTransform,
		scaleX: renderTransform,
		scaleY: renderTransform,
		rotate: renderTransform,
		variables(_def, style, _p, value) {
			for (const i in value)
				style[`--cxl-${toSnake(i)}` as unknown as CSSStyleKey] =
					value[i as keyof VariableList<T>];
		},
		zIndex: renderNumber,
	};

	function applyStyle(style: CSSStyle, def: StyleDefinition<T>) {
		for (const i in def) {
			const fn = renderMap[i as keyof typeof def],
				val = def[i as keyof typeof def];
			if (fn)
				(fn as (...args: unknown[]) => void)(
					def,
					style,
					i as StyleKey<T>,
					val,
				);
			else if (val !== undefined)
				renderDefault(style, i as StyleKey<T>, val as Length);
		}
	}
	function renderMedia(media: number, style: Styles<T>, selector: string) {
		return `@media(min-width:${toUnit(media)}){${render(style, selector)}}`;
	}

	function renderRule(
		selector: string,
		name: string,
		styles: StyleDefinition<T> | Styles<T>,
	) {
		if (
			name === '@small' ||
			name === '@xlarge' ||
			name === '@xxlarge' ||
			name === '@medium' ||
			name === '@large'
		)
			return renderMedia(
				theme.breakpoints[
					name.slice(1) as keyof typeof theme.breakpoints
				],
				styles as Styles<T>,
				selector,
			);

		return `${parseRuleName(selector, name)}{${style(
			styles as StyleDefinition,
		)}}`;
	}
	function style(def: StyleDefinition) {
		const cssStyle: CSSStyle = {};
		applyStyle(cssStyle, def);
		let result = '';

		for (const i in cssStyle) result += `${toSnake(i)}:${cssStyle[i]};`;

		return result;
	}
	function render(styles: Styles<T>, baseSelector = ':host') {
		let css = '';

		for (const i in styles) {
			const style = styles[i as keyof Styles<T>];
			if (!style) continue;
			css += renderRule(baseSelector, i, style);
			if (style.prepend) css = style.prepend + css;
		}

		return css;
	}

	function createStyleElement<T extends Theme>(
		styles: Styles<T>,
		selector = ':host',
	) {
		const result = document.createElement('style');
		result.textContent = render(styles, selector);
		return result;
	}

	function applyTheme(container = document.head) {
		const result = renderGlobal(theme);
		rootStyles.textContent = result + '}';
		container.insertBefore(rootStyles, container.firstChild);
	}

	function variable<K extends keyof T['colors']>(
		name: K,
	): Variable<T['colors'][K]>;
	function variable<K extends keyof T['variables']>(
		name: K,
	): Variable<T['variables'][K]>;
	function variable(name: keyof T['colors'] | keyof T['variables']) {
		return new Variable<unknown>(name as string);
	}

	return {
		inline: style,
		render,
		applyTheme,
		rootStyles,
		variable,
		style(styles: Styles<T>, selector = ':host') {
			let stylesheet: HTMLStyleElement;
			return () => {
				if (!stylesheet)
					stylesheet = createStyleElement(styles, selector);
				return stylesheet.cloneNode(true) as HTMLStyleElement;
			};
		},
		baseColor(name: keyof T['colors']) {
			return `var(--cxl--${toSnake(name as string)})`;
		},
	};
}
