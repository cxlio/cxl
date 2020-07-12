const fa = require('@fortawesome/free-solid-svg-icons');

require('../build').build({
	outputDir: 'dist',
	targets: [
		{
			output: 'icons.js',
			src() {
				var src = [],
					icon,
					name;

				for (var i in fa) {
					icon = fa[i];

					if (!icon || !icon.icon) continue;

					name =
						icon.iconName.indexOf('-') === -1
							? icon.iconName
							: '"' + icon.iconName + '"';
					const code = '\\u' + icon.icon[3];

					src.push(`${name}:"${code}"`);
				}

				return `{${src.join(',')}}`;
			}
		}
	]
});
