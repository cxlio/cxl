
const fa = require('@fortawesome/free-solid-svg-icons');

require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-ui-icons.js',
			src: function() {
				var src = [], icon, name;

				for (var i in fa)
				{
					icon = fa[i];

					if (!icon || !icon.icon) continue;

					name = icon.iconName.indexOf('-')===-1 ? icon.iconName : '"' + icon.iconName + '"';
					const code = "\\u" + icon.icon[3];

					src.push(`${name}:"${code}"`);
				}

				return `cxl.css.registerFont('Font Awesome\\ 5 Free',{weight:900,url:'https://use.fontawesome.com/releases/v5.1.0/webfonts/fa-solid-900.woff2'});cxl.ui.icons={${src.join(',')}};`;
			}
		}
	]

});
