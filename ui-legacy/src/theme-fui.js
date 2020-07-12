(cxl => {
"use strict";

const
	rgba = cxl.css.rgba,
	SURFACE = rgba(0,0,0),
	PRIMARY = rgba(0, 0x90, 0),
	SECONDARY = rgba(0xc6, 0xff, 0)
;

cxl.css.extend({

	colors: {
		surface: SURFACE,
		background: rgba(0x22, 0x22, 0x22),
		onSurface: rgba(0xff, 0xff, 0xff),
		link: rgba(0xff, 0xff, 0xff),
		primary: PRIMARY,
		primaryLight: SECONDARY.alpha(0.25),
		onPrimaryLight: rgba(0xff, 0xff, 0xff),
		error: rgba(0xff, 0x17, 0x44),
		elevation: SECONDARY.alpha(0.5)
	},

	variables: {
		font: '"Exo 2", Roboto, sans-serif'
	}

});

document.head.appendChild(cxl.dom('cxl-google-font', {
	name: 'Exo 2'
}));

cxl.extendComponent('cxl-card', {
	styles: {
		$: {
			borderColor: 'primaryLight', borderWidth: 1, borderStyle: 'solid', borderRadius: 8,
			outline: '3px solid rgba(c6, ff, )'
		}
	}
});

})(this.cxl);