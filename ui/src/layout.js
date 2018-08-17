(cxl => {
"use strict";

const
	component = cxl.component,
	theme = cxl.ui.theme
;

component({
	name: 'cxl-c',
	attributes: [ ],
	styles: {
		$: { display: 'block', flexShrink: 0 },
		$small: { padding: 8 },
		$primary: { backgroundColor: theme.primary, color: theme.onPrimary },
		$secondary: { backgroundColor: theme.secondary, color: theme.onSecondary },
		$surface: { backgroundColor: theme.surface, color: theme.onSurface },
		$large: { paddingLeft: 12, paddingRight: 12 },
		$grow: { flexGrow: 1 },
		$flex: { display: 'flex' },
		$nopad: { padding: 0 },
		$nopadv: { paddingTop: 0, paddingBottom: 0 }
	}
});

})(this.cxl);