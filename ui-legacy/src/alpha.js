(cxl=>{
"use strict";

const
	component = cxl.component,
	directive = cxl.directive
;

component({
	name: 'cxl-animate',
	attributes: [ 'pulse', 'spin' ],
	styles: {
		$: { display: 'inline-block' },
		$pulse: { animation: 'pulse' },
		$spin: { animation: 'spin' }
	}
});

component({
	name: 'cxl-banner',
	template: `
<div></div>
<div></div>
	`
});

component({
	name: 'cxl-block',
	attributes: [
		'inverse', 'compact', 'surface', 'primary', 'secondary', 'flex', 'vflex', 'scroll'
	],
	styles: {
		$: { padding: 16 },
		$compact: { padding: 8 },
		$surface: { backgroundColor: 'surface', color: 'onSurface' },
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },

		$inverse: { color: 'onPrimary', backgroundColor: 'primaryDark' },
		$flex: { display: 'flex' },
		$vflex: { display: 'flex', flexDirection: 'vertical' },
		$scroll: { overflowY: 'auto' }
	}
});

component({
	name: 'cxl-content',
	styles: {
		$: { margin: 16, backgroundColor: 'surface', color: 'onSurface' },
		$medium: { margin: 32 },
		$large: { margin: 64 },
		$xlarge: { width: 1200, marginLeft: 'auto', marginRight: 'auto' }
	}
});

component({
	name: 'cxl-layout',
	styles: {
		$: {
			display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridGap: 16,
			padding: 16
		},
		$medium: { gridGap: 24, padding: 24 },
		$large: { width: 1280, margin: 'auto' }
	}
});

component({
	name: 'cxl-loading',
	template: `<div style="display:none" &="timer(delay):|show .indicator"></div>`,
	styles: {
		indicator: {
			backgroundColor: 'primary', height: 4, transformOrigin: 'left', animation: 'wait'
		}
	}
}, {
	delay: 300
});

component({
	name: 'cxl-font',
	attributes: [ 'src' ],
	bindings: '=src:#load'
}, {
	load(src)
	{
		if (this.el)
			cxl.dom.remove(this.el);

		if (!src)
			return;

		const font = this.el = cxl.dom('link', {
			rel: 'stylesheet',
			href: src
		});

		document.head.appendChild(font);
	}
});

component({
	name: 'cxl-google-font',
	attributes: [ 'name', 'weights' ],
	template: `
<cxl-font &="#getUrl:@src"></cxl-font>
	`
}, {
	name: 'Roboto',
	weights: '300,400,500',
	getUrl()
	{
		return '//fonts.googleapis.com/css?family=' + this.name + ':' + this.weights;
	}
});

component({
	name: 'cxl-textarea-editable',
	template: `
<div &=".input =disabled:not:@contentEditable content on(input):#onInput =value:text"></div>
	`,

	bindings: 'role(textbox) =disabled:aria.prop(disabled) aria.prop(multiline)',
	attributes: [ 'value', 'disabled' ],
	events: [ 'change' ],
	styles: {
		$: {
			marginBottom: 8, marginTop: 8, position: 'relative'
		},
		input: {
			fontSize: 16, border: 1, backgroundColor: 'transparent', padding: 16,
			lineHeight: 20, fontFamily: 'inherit', borderColor: 'grayDark',
			borderStyle: 'solid'
		}
	}
}, {
	value: '',
	onInput()
	{
	}
});

})(this.cxl);