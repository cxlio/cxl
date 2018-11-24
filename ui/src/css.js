(cxl => {
"use strict";

const
	BREAKPOINTS = { small: 480, medium: 960, large: 1280, xlarge: 1600 },
	PSEUDO = {
		focus: ':focus', hover: ':hover', empty: ':empty', active: ':active',
		firstChild: ':first-child', lastChild: ':last-child'
	},

	PREFIX_REGEX = /\./g,
	ANIMATION = {
		spin: {
			keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-spin 2s infinite linear'
		},
		pulse: {
			keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
			value: 'cxl-pulse 1s infinite steps(8)'
		},
		fadeIn: {
			keyframes: '0% { display: block; opacity: 0; } to { opacity: 1 }',
			value: 'cxl-fadeIn var(--speed) linear'
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
	CSS = {
		alignItems: 'align-items',
		alignSelf: 'align-self',
		boxSizing: 'box-sizing',

		gridGap: 'grid-gap',
		gridTemplateRows: 'grid-template-rows',
		gridTemplateColumns: 'grid-template-columns',
		gridColumnEnd: 'grid-column-end',
		gridColumnStart: 'grid-column-start',

		zIndex: 'z-index',
		marginTop: 'margin-top',
		marginLeft: 'margin-left',
		marginRight: 'margin-right',
		marginBottom: 'margin-bottom',
		flexBasis: 'flex-basis',
		flexDirection: 'flex-direction',
		flexGrow: 'flex-grow',
		flexShrink: 'flex-shrink',
		paddingTop: 'padding-top',
		paddingLeft: 'padding-left',
		paddingRight: 'padding-right',
		paddingBottom: 'padding-bottom',
		fontSize: 'font-size',
		lineHeight: 'line-height',
		letterSpacing: 'letter-spacing',
		borderBottom: 'border-bottom',
		borderTop: 'border-top',
		borderLeft: 'border-left',
		borderRight: 'border-right',
		borderRadius: 'border-radius',
		borderColor: 'border-color',
		borderWidth: 'border-width',
		boxShadow: 'box-shadow',
		fontFamily: 'font-family',
		fontWeight: 'font-weight',
		backgroundColor: 'background-color',
		overflowX: 'overflow-x',
		overflowY: 'overflow-y',
		textDecoration: 'text-decoration',
		borderStyle: 'border-style',
		textTransform: 'text-transform',
		textAlign: 'text-align',
		justifyContent: 'justify-content',
		whiteSpace: 'white-space',
		userSelect: 'user-select',
		webkitOverflowScrolling: '-webkit-overflow-scrolling',
		scrollBehavior: 'scroll-behavior',
		transformOrigin: 'transform-origin'
	}
;

class Theme {

	constructor(theme)
	{
		const rootCSS = document.createElement('STYLE');

		document.head.appendChild(rootCSS);

		this.variables = theme.variables;

		var i;

		this.root = new cxl.css.StyleSheet({
			name: ':root', styles: { $: { variables: theme.variables }}, global: true
		}, rootCSS);

		if (theme.fonts)
			for (i in theme.fonts)
				cxl.css.registerFont(i, theme.fonts[i]);

		for (i in theme.variables)
			this[i] = 'var(--cxl-' + i + ')';

		for (i in theme.global)
			cxl.css.globalStyles.insertRule(i, theme.global[i]);
	}

	set(variables)
	{
		Object.assign(this.variables, variables);

		for (var i in this.variables)
			this[i] = 'var(--cxl-' + i + ')';

		this.root.applyStyles();
	}

}

function css(theme)
{
	return new Theme(theme);
}

function getUnit(n)
{
	return typeof(n)==='string' ? n : (n ? n + 'px' : '0');
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

		const keyframe = ANIMATION[val];

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
		this.$style.boxShadow = x + 'px ' + x + 'px ' + (3*x)+'px rgba(0,0,0,0.26)';
	}

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

	set translateX(x)
	{
		this.$value.translateX = x;
		this.$transform();
	}

	set translateY(y)
	{
		this.$value.translateY = y;
		this.$transform();
	}

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
				result += (CSS[i] || i) + ':' + this.$style[i] + ';';
		}

		return result;
	}
}

([
	'top', 'left', 'right', 'bottom', 'marginTop','lineHeight',
	'marginLeft', 'marginRight', 'marginBottom', 'margin', 'height', 'width', 'flexBasis',
	'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom', 'fontSize',
	'padding', 'outline', 'borderBottom', 'borderTop', 'borderLeft', 'borderRight',
	'border', 'borderRadius', 'borderWidth',
	'gridGap'
]).forEach(function(name) {

	Object.defineProperty(Style.prototype, name, {
		get: function() { return this.$value[name]; },
		set: function(val) {
			this.$value[name] = val;
			this.$style[name] = typeof(val)==='string' ? val : (val||0)+'px';
		}
	});

});

([ 'alignItems', 'display', 'position', 'boxSizing', 'boxShadow', 'opacity', 'fontFamily', 'fontWeight', 'borderColor',
  	'backgroundColor', 'backgroundImage', 'color', 'cursor', 'overflowX', 'filter',
  	'textDecoration', 'borderStyle', 'transition', 'textTransform', 'textAlign', 'flexGrow',
  	'flexShrink',
  	'alignContent', 'flexDirection', 'justifyContent', 'whiteSpace', 'scrollBehavior',
  	'transformOrigin', 'alignSelf',

 	'gridTemplateRows', 'gridTemplateColumns', 'gridColumnEnd', 'gridColumnStart'
 ]).forEach(function(name) {

	Object.defineProperty(Style.prototype, name, {
		get: function() { return this.$value[name]; },
		set: function(val) {
			this.$value[name] = this.$style[name] = val;
		}
	});

});

class Rule
{
	constructor(name, style)
	{
		this.rule = name;
		this.style = style;
	}

	$getMediaQuery(selector, minWidth, css)
	{
		const bp = BREAKPOINTS[minWidth] + 'px';

		return '@media(min-width:' + bp + '){' + selector + css + '}';
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

class StyleSheet
{
	constructor(meta, native)
	{
		this.tagName = meta.name;
		this.$classes = [];
		this.$selector = meta.global ? this.tagName : ':host';

		if (native)
			this.$native = native;
		else
			this.$attachStyle(meta);

		if (meta.styles)
			this.$insertStyles(meta.styles);

		this.$render(this.$toCSS(this.$classes));
	}

	$insertStyles(styles)
	{
		if (Array.isArray(styles))
			return styles.forEach(this.$insertStyles, this);

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
		var glob = css.globalStyles;

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

cxl.css = Object.assign(css, {

	BREAKPOINTS: BREAKPOINTS,

	Rule: Rule,
	Style: Style,
	StyleSheet: StyleSheet,

	registerFont(fontFamily, src)
	{
	var
		style = document.createElement('STYLE'),
		url = typeof(src)==='string' ? src : src.url
	;
		style.innerHTML = '@font-face{font-family:"' + fontFamily + '"' +
			(src.weight ? ';font-weight:'+src.weight : '') +
			';src:url("' + url + '");}';

		document.head.appendChild(style);

		return style;
	},

	globalStyles: new StyleSheet({ name: 'cxl-root', global: true })

});

})(this.cxl);