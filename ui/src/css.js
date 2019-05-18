(cxl => {
"use strict";

const
	PSEUDO = {
		focus: ':focus', hover: ':hover', empty: ':empty', active: ':active',
		firstChild: ':first-child', lastChild: ':last-child'
	},
	PREFIX_REGEX = /\./g,
	SNAKE_REGEX = /[A-Z]/g,
	SNAKE_CSS = {
		webkitOverflowScrolling: '-webkit-overflow-scrolling'
	},
	UNIT = 'px',

	css = {}
;

function toSnake(name) {
	return (SNAKE_CSS[name] = name.replace(SNAKE_REGEX, m => '-' + m.toLowerCase()));
}

class RGBA
{
	constructor(r, g, b, a)
	{
		this.r = r<0 ? 0 : (r>255 ? 255 : r);
		this.g = g<0 ? 0 : (g>255 ? 255 : g);
		this.b = b<0 ? 0 : (b>255 ? 255 : b);
		this.a = a===undefined ? 1 : (a<0 ? 0 : (a>1 ? 1 : a));
	}

	luminance()
	{
		//return 0.2126*((this.r/255)^2.2) + 0.7151*((this.g/255)^2.2) + 0.0721*((this.b/255)^2.2);
		return (0.2126*this.r + 0.7152*this.g + 0.0722*this.b)/255;
	}

	blend(rgba)
	{
	const
		a = 1 - (1 - rgba.a) * (1 - this.a),
		r = a===0 ? 0 : (rgba.r * rgba.a / a) + (this.r * this.a * (1 - rgba.a) / a),
		g = a===0 ? 0 : (rgba.g * rgba.a / a) + (this.g * this.a * (1 - rgba.a) / a),
		b = a===0 ? 0 : (rgba.b * rgba.a / a) + (this.b * this.a * (1 - rgba.a) / a)
	;
		return new RGBA(r, g, b, a);
	}

	multiply(p)
	{
		return new RGBA(this.r*p, this.g*p, this.b*p, this.a);
	}

	alpha(a)
	{
		return new RGBA(this.r, this.g, this.b, a);
	}

	toString()
	{
		return 'rgba(' + (this.r|0) + ',' + (this.g|0) + ',' + (this.b|0) + ',' + this.a+')';
	}

}

function rgba(r, g, b, a)
{
	return new RGBA(r, g, b, a);
}

const
	COLORS = {
		elevation: rgba(0,0,0,0.26),
		primary: rgba(0x15, 0x65, 0xc0),
		get primaryLight() { return this.primary.alpha(0.18); }, //: rgba(0x4a, 0x65, 0x72, 0.24),

		secondary: rgba(0xf9, 0xaa, 0x33),
		surface: rgba(0xff, 0xff, 0xff),
		error: rgba(0xb0, 0x00, 0x20),

		onPrimary: rgba(0xff,0xff,0xff),
		get onPrimaryLight() { return this.primary; },
		onSecondary: rgba(0,0,0),
		onSurface: rgba(0, 0, 0),
		onError: rgba(0xff, 0xff, 0xff),

		get background() { return this.surface; },
		get link() { return this.primary; },
		get headerText() { return this.onSurface.alpha(0.6); },
		get divider() { return this.onSurface.alpha(0.16); }
	}
;

class StyleSheet
{
	constructor(meta, native)
	{
		this.tagName = meta.name;
		this.$selector = meta.global ? this.tagName : ':host';
		this.global = meta.global;

		if (native)
			this.$native = native;
		else
			this.$attachStyle(meta);

		this.reset(meta.styles);
	}

	insertStyles(styles)
	{
		if (Array.isArray(styles))
			return styles.forEach(this.insertStyles, this);

		for (var i in styles)
			this.insertRule(i, styles[i]);
	}

	$attachStyle(meta)
	{
		if (meta.$template)
		{
			this.$native = document.createElement('STYLE');
			meta.$template.$content.appendChild(this.$native);
		}
		else
			this.$createTemplate(meta);
	}

	$createTemplate(meta)
	{
		var src = '<style></style><slot></slot>';
		meta.$template = new cxl.Template(src);
		this.$native = meta.$template.$content.childNodes[0];
	}

	$renderGlobal()
	{
		var glob = !this.global && css.globalStyles;
		return glob && this.$toCSS(glob.$classes) || '';
	}

	$render(css)
	{
		this.$native.innerHTML = this.$renderGlobal() + css;
	}

	$toCSS(classes)
	{
		var css='';

		classes.forEach(c => css += c.toCSS(this.$selector, this.$prefix));

		return css;
	}

	reset(styles)
	{
		if (this.$classes)
			this.$native.innerHTML = '';

		this.$classes = [];

		if (styles)
			this.insertStyles(styles);

		this.$render(this.$toCSS(this.$classes));
	}

	// Render styles needs to be called after insert styles.
	applyStyles()
	{
		this.$render(this.$toCSS(this.$classes));
	}

	insertRule(rule, styles)
	{
		var result = new Rule(rule, new Style(styles));
		this.$classes.push(result);
		return result;
	}
}

function getUnit(n)
{
	return typeof(n)==='string' ? n : (n ? n + UNIT : '0');
}

class Style
{
	constructor(prop, style)
	{
		this.$value = {};
		this.$style = style || {};

		if (prop)
			this.set(prop);
	}

	get animation()
	{
		return this.$value.animation;
	}

	set animation(val)
	{
		this.$value.animation = val;

		if (!this.$keyframes)
			this.$keyframes = {};

		const keyframe = css.animation[val];

		this.$keyframes[val] = keyframe.keyframes;
		this.$style.animation = keyframe.value;
	}

	get elevation()
	{
		return this.$value.elevation;
	}

	set elevation(x)
	{
		this.$value.elevation = x;
		this.$style.zIndex = x;
		this.$style.boxShadow = x + UNIT + ' ' + x + UNIT + ' ' + (3*x)+ UNIT + ' var(--cxl-elevation)';
	}

	set font(name)
	{
		const fontStyle = css.typography[name];
		this.$value.font = name;
		fontStyle.applyTo(this.$style);
	}

	get font() { return this.$value.font; }

	set state(name)
	{
		const state = css.states[name];
		this.$value.state = name;
		state.applyTo(this.$style);
	}

	get state() { return this.$value.state; }

	set userSelect(val)
	{
		this.$style.userSelect = this.$style.msUserSelect = this.$style['-ms-user-select'] =
			this.$style.mozUserSelect = this.$style['-moz-user-select'] = this.$value.userSelect = val;
	}

	get userSelect()
	{
		return this.$value.userSelect;
	}

	set variables(val)
	{
		this.$value.variables = val;
	}

	get variables()
	{
		return this.$value.variables;
	}

	set(styles)
	{
		for (var i in styles)
			this[i] = styles[i];
	}

	get scaleX() { return this.$value.scaleX; }
	set scaleX(val) { this.$value.scaleX = val; this.$transform(); }
	get scaleY() { return this.$value.scaleY; }
	set scaleY(val) { this.$value.scaleY = val; this.$transform(); }

	get translateX() { return this.$value.translateX; }
	get translateY() { return this.$value.translateY; }
	set translateX(x) { this.$value.translateX = x; this.$transform(); }
	set translateY(y) { this.$value.translateY = y; this.$transform(); }

	set overflowY(val)
	{
		this.$value.overflowY = this.$style.overflowY = val;
	}

	get overflowY()
	{
		return this.$value.overflowY;
	}

	set overflowScrolling(val)
	{
		this.$style.webkitOverflowScrolling = val;
	}

	get overflowScrolling()
	{
		return this.$style.webkitOverflowScrolling;
	}

	applyTo(style)
	{
		for (let i in this.$style)
			style[i] = this.$style[i];
	}

	$transform()
	{
		var v = this.$value;

		this.$style.transform =
			(v.translateX!==undefined || v.translateY!==undefined ?
				'translate(' + getUnit(v.translateX) + ',' + getUnit(v.translateY) + ') ' : '') +
			(v.translateZ!==undefined ? 'translateZ(' + getUnit(v.translateZ) + ') ' : '') +
			(v.scaleX!==undefined || v.scaleY!==undefined ?
			 	'scale(' + (v.scaleX===undefined ? 1 : v.scaleX) + ',' +
			 	(v.scaleY===undefined ? 1 : v.scaleY) +')' : '');
	}

	$toCSS()
	{
		var result = this.reset || '', vars = this.$value.variables, val, i;

		if (vars)
			for (i in vars)
				result += '--cxl-' + i + ': ' + vars[i] + ';';

		for (i in this.$style)
		{
			val = this.$style[i];

			if (val!==null && val!==undefined && val!=='')
				result += (SNAKE_CSS[i] || toSnake(i)) + ':' + this.$style[i] + ';';
		}

		return result;
	}
}

function property(setter)
{
	return name => Object.defineProperty(Style.prototype, name, {
		get() { return this.$value[name]; },
		set(val) {
			this.$value[name] = val;
			this.$style[name] = setter(val);
		}
	});
}

[
	'backgroundColor', 'color', 'borderColor'
].forEach(property(val => css.colors[val] ? 'var(--cxl-' + val + ')' : val));


([
	'top', 'left', 'right', 'bottom', 'marginTop','lineHeight',
	'marginLeft', 'marginRight', 'marginBottom', 'margin', 'height', 'width', 'flexBasis',
	'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom', 'fontSize',
	'padding', 'outline', 'borderBottom', 'borderTop', 'borderLeft', 'borderRight',
	'border', 'borderRadius', 'borderWidth',
	'gridGap'
]).forEach(property(val => typeof(val)==='string' ? val : (val||0)+UNIT));


([
	'alignItems', 'display', 'position', 'boxSizing', 'boxShadow', 'opacity', 'fontFamily',
	'fontWeight', 'fontStyle', 'background', 'cursor', 'overflowX', 'filter',
  	'textDecoration', 'borderStyle', 'transition', 'textTransform', 'textAlign', 'flexGrow',
  	'flexShrink', 'animationDuration', 'pointerEvents',
  	'alignContent', 'flexDirection', 'justifyContent', 'whiteSpace', 'scrollBehavior',
  	'transformOrigin', 'alignSelf', 'wordBreak',

 	'gridTemplateRows', 'gridTemplateColumns', 'gridColumnEnd', 'gridColumnStart'
 ]).forEach(property(val => val));

class Rule
{
	constructor(name, style)
	{
		this.rule = name;
		this.style = style;
	}

	$getMediaQuery(selector, minWidth, cssStr)
	{
		const bp = css.breakpoints[minWidth] + UNIT;

		return '@media(min-width:' + bp + '){' + selector + cssStr + '}';
	}

	$getSelector(tag, rule, state)
	{
		return (tag===':host' && state ? ':host(' + state + ')' : tag + state) +
			(rule ? ' ' + rule : '');
	}

	$parseParts(parts, selector, prefix, css)
	{
		var part, media, state='', name = parts[0] ? '.' + parts[0] : '';

		for (var i=1;i<parts.length;i++)
		{
			part = parts[i];

			if (part==='small' || part==='medium' || part==='large' || part==='xlarge')
				media = part;
			else
				state += part in PSEUDO ? PSEUDO[part] : '[' + part + ']';
		}

		if (prefix && name)
			name = name.replace(PREFIX_REGEX, '.' + prefix);

		if (media)
			return this.$getMediaQuery(this.$getSelector(selector, name, state), media, css);

		return this.$getSelector(selector, name, state) + css;
	}

	$renderKeyframes()
	{
		var k = this.style.$keyframes, result='';

		for (var i in k)
			result += '@keyframes cxl-' + i + '{' + k[i] + '}';

		return result;
	}

	$toCSS(selector, prefix)
	{
		var rule = this.rule, css = '{' + this.style.$toCSS() + '}';

		if (css==='{}')
			return '';

		if (rule==='$')
			return selector + css;

		if (rule==='*')
			return selector + ',' + selector + ' *' + css;

		return this.$parseParts(rule.split('$'), selector, prefix, css);
	}

	toCSS(selector, prefix)
	{
		var result='';

		if (this.style.$keyframes)
			result = this.$renderKeyframes();

		return result + this.$toCSS(selector, prefix);
	}

}

function applyStyles()
{
	// Get Variables
const
	typo = css.typography,
	states = css.states,
	variables = css.appliedVariables = Object.assign({}, css.variables)
;
	for (var i in css.colors)
		variables[i] = css.colors[i];

	for (i in typo)
	{
		let css = typo[i];

		if (!(css instanceof Style))
		{
			typo[i] = new Style(Object.assign({
				fontFamily: 'var(--cxl-font)'
			}, css));
		}
	}

	for (i in states)
		if (!(states[i] instanceof Style))
			states[i] = new Style(states[i]);

	css.rootStyles.reset({
		$: { backgroundColor: 'background', variables: variables }
	});
}

class RootStyles extends StyleSheet {

	constructor()
	{
		const rootCSS = document.createElement('STYLE');
		document.head.appendChild(rootCSS);

		super({ name: ':root', global: true }, rootCSS);
	}

}

cxl.css = Object.assign(css, {

	Rule: Rule,
	Style: Style,
	StyleSheet: StyleSheet,

	animation: {
		spin: {
			keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-spin 2s infinite linear'
		},
		pulse: {
			keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-pulse 1s infinite steps(8)'
		},
		expand: {
			keyframes: '0% { transform: scale(0,0); } 100% { transform: scale(1,1); }',
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
	},

	breakpoints: { small: 480, medium: 960, large: 1280, xlarge: 1600 },

	colors: COLORS,

	colorsPrimary: cxl.extend({}, COLORS, {
		surface: COLORS.primary,
		onSurface: COLORS.onPrimary,
		primary: COLORS.secondary,
		onPrimary: COLORS.onSecondary,
		link: COLORS.onPrimary,
		error: rgba(0xff,0x6e,0x40),
		onError: rgba(0,0,0)
	}),

	fonts: {},

	globalStyles: new StyleSheet({ name: 'cxl-root', global: true, styles: {
		$: {
			display: 'block',
			reset: '-webkit-tap-highlight-color:transparent;',
			fontFamily: 'var(--cxl-font)'
		},
		'*': {
			boxSizing: 'border-box',
			transition: 'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)',
		}
	}}),

	rgba: rgba,

	// Stylesheet used for variables and other :root properties
	rootStyles: new RootStyles(),

	states: {
		active: { filter: 'invert(0.2)' },
		focus: { outline: 0, filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
		disabled: { filter: 'saturate(0)', opacity: 0.38 },
		none: { filter: 'none', opacity: 1 }
	},

	variables: {
		// Animation speed
		speed: '0.2s',
		font: 'Roboto, sans-serif',
		fontMonospace: 'monospace'
	},

	typography: {
		default: {
			fontWeight: 400, fontSize: 16, letterSpacing: 'normal'
		},
		caption: { fontSize: 12, letterSpacing: 0.4 },
		h1: { fontWeight: 300, fontSize: 96, letterSpacing: -1.5 },
		h2: { fontWeight: 300, fontSize: 60, letterSpacing: -0.5 },
		h3: { fontSize: 48 },
		h4: { fontSize: 34, letterSpacing: 0.25 },
		h5: { fontSize: 24 },
		h6: { fontSize: 20, fontWeight: 400, letterSpacing: 0.15 },
		subtitle: { fontSize: 16, lineHeight: 22, letterSpacing: 0.15 },
		subtitle2: { fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
		button: { fontSize: 14, lineHeight: 20, letterSpacing: 1.25, textTransform: 'uppercase' },
		code: { fontFamily: 'var(--fontMonospace)' }
	},

	extend(def)
	{
		if (def.variables)
			cxl.extend(this.variables, def.variables);

		if (def.colors)
			cxl.extend(this.colors, def.colors);

		if (def.typography)
			cxl.extend(this.typography, def.typography);

		if (def.states)
			cxl.extend(this.states, def.states);

		applyStyles();
	},

	registerFont(fontFamily, src)
	{
	var
		style = document.createElement('STYLE'),
		url = typeof(src)==='string' ? src : src.url
	;
		this.fonts[fontFamily] = src;

		style.innerHTML = '@font-face{font-family:"' + fontFamily + '"' +
			(src.weight ? ';font-weight:'+src.weight : '') +
			';src:url("' + url + '");}';

		document.head.appendChild(style);

		return style;
	}

});

applyStyles();

})(this.cxl);
