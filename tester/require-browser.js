function require(path) {
	function normalizePath(basePath) {
		const a = document.createElement('a');
		a.href = basePath || '';
		return a.pathname;
	}
	const mods = require.modules;

	if (require.replace)
		path = path.replace(require.replace.match, require.replace.replace);

	// Handle packages
	if (path[0] !== '.') return mods[path];

	const xhr = new XMLHttpRequest();
	let url = require.base + (path.endsWith('.js') ? path : path + '.js');

	xhr.open('GET', url, false);
	xhr.send();

	if (xhr.status === 404) {
		url = require.base + path + '/index.js';
		xhr.open('GET', url, false);
		xhr.send();
	}
	const id = xhr.responseURL;
	const response = xhr.responseText + '\n//# sourceURL=' + id;
	if (mods[id]) return mods[id];

	const oldBase = require.base;
	const baseMatch = /(.*\/).*/.exec(url);
	require.base = baseMatch ? normalizePath(baseMatch[1]) : '';

	const exports = {};
	new Function('exports', response)(exports);

	require.base = oldBase;
	mods[id] = exports;
	return exports;
}
require.modules = {};
require.base = '';
