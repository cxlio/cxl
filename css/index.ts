interface StrictStyleDefinition {
	animation: string;
	elevation: number;
	[name: string]: string | number | null;
}

type StyleDefinition = Partial<StrictStyleDefinition>;

interface StyleSheetConfiguration {
	name: string;
	global?: boolean;
	styles?: Styles[] | Styles;
}
interface FontSource {
	url: string;
	weight?: number;
}

interface Variables {
	[name: string]: string;
}

interface Styles {
	[key: string]: StyleDefinition;
}

interface Theme {}

const PSEUDO = {
		focus: ':focus',
		hover: ':hover',
		empty: ':empty',
		active: ':active',
		firstChild: ':first-child',
		lastChild: ':last-child'
	},
	PREFIX_REGEX = /\./g,
	SNAKE_REGEX = /[A-Z]/g,
	SNAKE_CSS: Variables = {
		webkitOverflowScrolling: '-webkit-overflow-scrolling'
	},
	UNIT = 'px',
	css = {};

function toSnake(name: string) {
	return (SNAKE_CSS[name] = name.replace(
		SNAKE_REGEX,
		m => '-' + m.toLowerCase()
	));
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

const COLORS = {
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
};

class StyleSheet {
	private $selector: string;
	private $native: Element;
	private $classes: Rule[] = [];
	private global: boolean;

	$prefix?: string;
	tagName: string;

	constructor(meta: StyleSheetConfiguration, native?: Element) {
		this.tagName = meta.name;
		this.$selector = meta.global ? this.tagName : ':host';
		this.global = meta.global || false;
		this.$native = native || document.createElement('style');
		this.reset(meta.styles);
	}

	private $renderGlobal() {
		const glob = !this.global && globalStyles;
		return (glob && this.$toCSS(glob.$classes)) || '';
	}

	private $render(css: string) {
		this.$native.innerHTML = this.$renderGlobal() + css;
	}

	private $toCSS(classes: Rule[]) {
		let css = '';

		classes.forEach(c => (css += c.toCSS(this.$selector, this.$prefix)));

		return css;
	}

	insertStyles(styles: Styles[] | Styles) {
		if (Array.isArray(styles))
			return styles.forEach(this.insertStyles, this);

		for (let i in styles) this.insertRule(i, styles[i]);
	}

	reset(styles?: Styles[] | Styles) {
		if (this.$classes) this.$native.innerHTML = '';

		this.$classes = [];

		if (styles) this.insertStyles(styles);

		this.$render(this.$toCSS(this.$classes));
	}

	// Render styles needs to be called after insert styles.
	applyStyles() {
		this.$render(this.$toCSS(this.$classes));
	}

	insertRule(rule: string, styles: StyleDefinition) {
		const result = new Rule(rule, new Style(styles));
		this.$classes.push(result);
		return result;
	}
}

function getUnit(n: string | number) {
	return typeof n === 'string' ? n : n ? n + UNIT : '0';
}

class Style {
	$value: StyleDefinition = {};
	$keyframes?: StyleDefinition;

	constructor(
		prop?: StyleDefinition,
		private $style: Partial<CSSStyleDeclaration> = {}
	) {
		if (prop) this.set(prop);
	}

	get animation() {
		return this.$value.animation;
	}

	set animation(val) {
		this.$value.animation = val;

		if (val) {
			if (!this.$keyframes) this.$keyframes = {};

			const keyframe = animation[val];

			this.$keyframes[val] = keyframe.keyframes;
			this.$style.animation = keyframe.value;
		} else this.$style.animation = val;
	}

	get elevation() {
		return this.$value.elevation;
	}

	set elevation(x: number) {
		this.$value.elevation = x;
		this.$style.zIndex = x;
		this.$style.boxShadow =
			x +
			UNIT +
			' ' +
			x +
			UNIT +
			' ' +
			3 * x +
			UNIT +
			' var(--cxl-elevation)';
	}

	set font(name) {
		const fontStyle = typography[name];
		this.$value.font = name;
		fontStyle.applyTo(this.$style);
	}

	get font() {
		return this.$value.font;
	}

	set state(name) {
		const state = css.states[name];
		this.$value.state = name;
		state.applyTo(this.$style);
	}

	get state() {
		return this.$value.state;
	}

	set userSelect(val) {
		this.$style.userSelect = this.$style.msUserSelect = this.$style[
			'-ms-user-select'
		] = this.$style.mozUserSelect = this.$style[
			'-moz-user-select'
		] = this.$value.userSelect = val;
	}

	get userSelect() {
		return this.$value.userSelect;
	}

	set variables(val) {
		this.$value.variables = val;
	}

	get variables() {
		return this.$value.variables;
	}

	set(styles: StyleDefinition) {
		for (var i in styles) this[i] = styles[i];
	}

	get scaleX() {
		return this.$value.scaleX;
	}
	set scaleX(val) {
		this.$value.scaleX = val;
		this.$transform();
	}
	get scaleY() {
		return this.$value.scaleY;
	}
	set scaleY(val) {
		this.$value.scaleY = val;
		this.$transform();
	}

	set rotate(val) {
		this.$value.rotate = val;
		this.$transform();
	}

	get rotate() {
		return this.$value.rotate;
	}

	get translateX() {
		return this.$value.translateX;
	}
	get translateY() {
		return this.$value.translateY;
	}
	set translateX(x) {
		this.$value.translateX = x;
		this.$transform();
	}
	set translateY(y) {
		this.$value.translateY = y;
		this.$transform();
	}

	set overflowY(val) {
		this.$value.overflowY = this.$style.overflowY = val;
	}

	get overflowY() {
		return this.$value.overflowY;
	}

	set overflowScrolling(val) {
		this.$style.webkitOverflowScrolling = val;
	}

	get overflowScrolling() {
		return this.$style.webkitOverflowScrolling;
	}

	applyTo(style: Style) {
		for (let i in this.$style) style[i] = this.$style[i];
	}

	$transform() {
		var v = this.$value;

		this.$style.transform =
			(v.translateX !== undefined || v.translateY !== undefined
				? 'translate(' +
				  getUnit(v.translateX) +
				  ',' +
				  getUnit(v.translateY) +
				  ') '
				: '') +
			(v.translateZ !== undefined
				? 'translateZ(' + getUnit(v.translateZ) + ') '
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

	$toCSS() {
		var result = this.reset || '',
			vars = this.$value.variables,
			val,
			i;

		if (vars) for (i in vars) result += '--cxl-' + i + ': ' + vars[i] + ';';

		for (i in this.$style) {
			val = this.$style[i];

			if (val !== null && val !== undefined && val !== '')
				result +=
					(SNAKE_CSS[i] || toSnake(i)) + ':' + this.$style[i] + ';';
		}

		return result;
	}
}

function property(setter: (val: string | number) => string) {
	return (name: string) =>
		Object.defineProperty(Style.prototype, name, {
			get() {
				return this.$value[name];
			},
			set(val) {
				this.$value[name] = val;
				this.$style[name] = setter(val);
			}
		});
}

['backgroundColor', 'color', 'borderColor'].forEach(
	property(val => (COLORS[val] ? 'var(--cxl-' + val + ')' : val))
);

[
	'top',
	'left',
	'right',
	'bottom',
	'marginTop',
	'lineHeight',
	'marginLeft',
	'marginRight',
	'marginBottom',
	'margin',
	'height',
	'width',
	'flexBasis',
	'paddingTop',
	'paddingLeft',
	'paddingRight',
	'paddingBottom',
	'fontSize',
	'padding',
	'outline',
	'borderBottom',
	'borderTop',
	'borderLeft',
	'borderRight',
	'border',
	'borderRadius',
	'borderWidth',
	'gridGap'
].forEach(property(val => (typeof val === 'string' ? val : (val || 0) + UNIT)));

[
	'alignItems',
	'display',
	'position',
	'boxSizing',
	'boxShadow',
	'opacity',
	'fontFamily',
	'fontWeight',
	'fontStyle',
	'background',
	'cursor',
	'overflowX',
	'filter',
	'textDecoration',
	'borderStyle',
	'transition',
	'textTransform',
	'textAlign',
	'flexGrow',
	'flexShrink',
	'animationDuration',
	'pointerEvents',
	'alignContent',
	'flexDirection',
	'justifyContent',
	'whiteSpace',
	'scrollBehavior',
	'transformOrigin',
	'alignSelf',
	'wordBreak',
	'verticalAlign',

	'gridTemplateRows',
	'gridTemplateColumns',
	'gridColumnEnd',
	'gridColumnStart'
].forEach(property(val => val));

class Rule {
	constructor(public name: string, public style: Style) {}

	$getMediaQuery(selector: string, minWidth: number, cssStr: string) {
		const bp = breakpoints[minWidth] + UNIT;

		return '@media(min-width:' + bp + '){' + selector + cssStr + '}';
	}

	$getSelector(tag: string, rule: string, state: string) {
		return (
			(tag === ':host' && state ? ':host(' + state + ')' : tag + state) +
			(rule ? ' ' + rule : '')
		);
	}

	$parseParts(
		parts: string[],
		selector: string,
		prefix: string,
		css: string
	) {
		var part,
			media,
			state = '',
			name = parts[0] ? '.' + parts[0] : '';

		for (var i = 1; i < parts.length; i++) {
			part = parts[i];

			if (
				part === 'small' ||
				part === 'medium' ||
				part === 'large' ||
				part === 'xlarge'
			)
				media = part;
			else state += part in PSEUDO ? PSEUDO[part] : '[' + part + ']';
		}

		if (prefix && name) name = name.replace(PREFIX_REGEX, '.' + prefix);

		if (media)
			return this.$getMediaQuery(
				this.$getSelector(selector, name, state),
				media,
				css
			);

		return this.$getSelector(selector, name, state) + css;
	}

	$renderKeyframes() {
		var k = this.style.$keyframes,
			result = '';

		for (var i in k) result += '@keyframes cxl-' + i + '{' + k[i] + '}';

		return result;
	}

	$toCSS(selector: string, prefix: string) {
		const rule = this.name,
			css = '{' + this.style.$toCSS() + '}';

		if (css === '{}') return '';

		if (rule === '$') return selector + css;

		if (rule === '*') return selector + ',' + selector + ' *' + css;

		return this.$parseParts(rule.split('$'), selector, prefix, css);
	}

	toCSS(selector: string, prefix: string = '') {
		var result = '';

		if (this.style.$keyframes) result = this.$renderKeyframes();

		return result + this.$toCSS(selector, prefix);
	}
}

function applyStyles() {
	// Get Variables
	const typo = typography,
		variables = (css.appliedVariables = { ...variables });

	for (let i in COLORS) variables[i] = COLORS[i];

	for (let i in typo) {
		let css = typo[i];

		if (!(css instanceof Style)) {
			typo[i] = new Style(
				Object.assign(
					{
						fontFamily: 'var(--cxl-font)'
					},
					css
				)
			);
		}
	}

	for (let i in states)
		if (!(states[i] instanceof Style)) states[i] = new Style(states[i]);

	rootStyles.reset({
		$: { backgroundColor: 'background', variables: variables }
	});
}

class RootStyles extends StyleSheet {
	constructor() {
		const rootCSS = document.createElement('STYLE');
		document.head.appendChild(rootCSS);

		super({ name: ':root', global: true }, rootCSS);
	}
}

const globalStyles = new StyleSheet({
	name: 'cxl-root',
	global: true,
	styles: {
		$: {
			display: 'block',
			reset: '-webkit-tap-highlight-color:transparent;',
			fontFamily: 'var(--cxl-font)',
			fontSize: 'var(--cxl-fontSize)',
			verticalAlign: 'middle'
		},
		'*': {
			boxSizing: 'border-box',
			transition:
				'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)'
		}
	}
});

const animation = {
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
		keyframes: '0% { display: block; opacity: 0; } 100% { opacity: 1; }',
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
};

const typography = {
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
};

const breakpoints = { small: 480, medium: 960, large: 1280, xlarge: 1600 };

const colorsPrimary = {
	surface: COLORS.primary,
	onSurface: COLORS.onPrimary,
	primary: COLORS.secondary,
	onPrimary: COLORS.onSecondary,
	link: COLORS.onPrimary,
	error: rgba(0xff, 0x6e, 0x40),
	onError: rgba(0, 0, 0),
	...COLORS
};

const fonts = {};

// Stylesheet used for variables and other :root properties
const rootStyles = new RootStyles();

const states = {
	active: { filter: 'invert(0.2)' },
	focus: {
		outline: 0,
		filter: 'invert(0.2) saturate(2) brightness(1.1)'
	},
	hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	disabled: {
		cursor: 'default',
		filter: 'saturate(0)',
		opacity: 0.38,
		pointerEvents: 'none'
	},
	none: { filter: 'none', opacity: 1 }
};

const variables: Variables = {
	// Animation speed
	speed: '0.2s',
	font: 'Roboto, sans-serif',
	fontSize: '16px',
	fontMonospace: 'monospace'
};

function extend(def: Theme) {
	if (def.variables) cxl.extend(variables, def.variables);

	if (def.colors) cxl.extend(colors, def.colors);

	if (def.typography) cxl.extend(typography, def.typography);

	if (def.states) cxl.extend(states, def.states);

	applyStyles();
}

function registerFont(fontFamily: string, src: string | FontSource) {
	var style = document.createElement('STYLE'),
		url = typeof src === 'string' ? src : src.url;
	fonts[fontFamily] = src;

	style.innerHTML =
		'@font-face{font-family:"' +
		fontFamily +
		'"' +
		(src.weight ? ';font-weight:' + src.weight : '') +
		';src:url("' +
		url +
		'");}';

	document.head.appendChild(style);

	return style;
}

applyStyles();

export {
	COLORS as colors,
	Rule,
	Style,
	StyleSheet,
	animation,
	breakpoints,
	colorsPrimary,
	extend,
	globalStyles,
	typography,
	registerFont,
	rgba,
	states,
	variables
};
