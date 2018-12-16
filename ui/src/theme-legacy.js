(cxl => {
"use strict";

const
	css = cxl.css,
	rgba = css.rgba
;

cxl.css.extend({
	colors: {
		surface: rgba(0,0,0x80),
		onSurface: rgba(0xff, 0xff, 0xff),
		primary: rgba(0x80, 0x80, 0x80),
		primaryLight: rgba(0, 0x80, 0x80),
		//onPrimary: rgba(0,0,0)
		onPrimary: rgba(0xff, 0xff, 0xff),
		divider: rgba(0xc0, 0xc0, 0xc0)
		//font: 'VT323, monospace'
	},

	variables: {
		font: '"Press Start 2P", monospace'
	},

	typography: {
		default: {
			fontWeight: 400, fontSize: 12, letterSpacing: 'normal',
		},
		caption: { fontSize: 12, letterSpacing: 0.4 },
		h1: { fontWeight: 300, fontSize: 96, letterSpacing: -1.5 },
		h2: { fontWeight: 300, fontSize: 60, letterSpacing: -0.5 },
		h3: { fontSize: 48 },
		h4: { fontSize: 34, letterSpacing: 0.25 },
		h5: { fontSize: 24 },
		h6: { fontSize: 12, fontWeight: 500, letterSpacing: 0.15 },
		subtitle: { fontSize: 12, lineHeight: 22, letterSpacing: 0.15 },
		subtitle2: { fontSize: 12, lineHeight: 18, letterSpacing: 0.1 }
	}
});

document.head.appendChild(cxl.dom('cxl-google-font', {
	name: 'Press Start 2P'
	//name: 'VT323'
}));

})(this.cxl);