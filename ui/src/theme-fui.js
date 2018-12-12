(cxl => {
"use strict";

const
	rgba = cxl.css.rgba
;

cxl.css.extend({

	colors: {
		surface: rgba(0x21, 0x21, 0x21),
		onSurface: rgba(0xff, 0xff, 0xff),
		//primary: rgba(0x90, 0xca, 0xf9),
		error: rgba(0xff, 0x17, 0x44),
		font: '"Exo 2", Roboto, sans-serif'
	}

});

document.head.appendChild(cxl.dom('cxl-google-font', {
	name: 'Exo 2'
}));

cxl.extendComponent('cxl-card', {
	styles: {
		$: {
			borderColor: '#fff', borderWidth: 1, borderStyle: 'solid', borderRadius: 8
		}
	}
});

})(this.cxl);