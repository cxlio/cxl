///<amd-module name="@cxl/ui-theme-terminal"/>
import { theme } from '@cxl/ui/theme.js';
import { rgba } from '@cxl/css';

theme.imports = [];
theme.variables.font = 'monospace';

Object.assign(theme.colors, {
	surface: rgba(0, 0, 128),
	onSurface: rgba(255, 255, 255),
	primary: rgba(192, 192, 192),
	onPrimary: rgba(0, 0, 0),
});

export default theme;
