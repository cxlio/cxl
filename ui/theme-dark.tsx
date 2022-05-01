///<amd-module name="@cxl/ui/theme-dark.js"/>
import { theme as baseTheme } from '@cxl/ui/theme.js';
import { renderGlobal, rgba } from '@cxl/css';

export const colors = {
	primary: rgba(0x03, 0xa9, 0xf4),
	onPrimary: rgba(0xff, 0xff, 0xff),
	primaryLight: rgba(0x03, 0xa9, 0xf4, 0.24),
	onPrimaryLight: rgba(0xe1, 0xf5, 0xfe),
	secondary: rgba(249, 130, 108),
	surface: rgba(34, 39, 46),
	background: rgba(34, 39, 46),
	onBackground: rgba(173, 186, 199),
	onSurface: rgba(173, 186, 199),
	onSecondary: rgba(0, 0, 0),
	error: rgba(0xcf, 0x66, 0x79),
	link: rgba(83, 155, 245),
	divider: rgba(0xff, 0xff, 0xff, 0.48),
	onSurface8: rgba(173, 186, 199, 0.12),
	headerText: rgba(173, 186, 199, 0.87),
};

export function applyToTheme() {
	Object.assign(baseTheme.colors, colors);
}

export function getStyleElement() {
	const style = document.createElement('style');
	style.innerHTML = renderGlobal({ colors });
	return style;
}
