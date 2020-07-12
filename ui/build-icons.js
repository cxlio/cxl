const fa = require('@fortawesome/free-solid-svg-icons');
const { writeFileSync } = require('fs');

const src = [];
let icon, name;

for (const i in fa) {
	icon = fa[i];

	if (!icon || !icon.icon) continue;

	name =
		icon.iconName.indexOf('-') === -1
			? icon.iconName
			: '"' + icon.iconName + '"';
	const code = '\\u' + icon.icon[3];

	src.push(`${name}:"${code}"`);
}

writeFileSync('./icons-fa.js', `exports.default={${src.join(',')}}`);
