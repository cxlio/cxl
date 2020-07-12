function require(path) {
	function normalizePath(basePath) {
		const a = document.createElement('a');
		a.href = basePath || '';
		return a.pathname;
	}
	const mods = require.modules;

	if (require.replace) path = require.replace(path);
	// Handle packages
	if (path[0] !== '.') {
		if (!mods[path]) throw new Error(`Module "${path}" not found.`);
		return mods[path];
	}

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

	const exports = {},
		module = { exports: exports };
	new Function('module', 'exports', response)(module, exports);

	require.base = oldBase;
	mods[id] = module.exports;
	return module.exports;
}
require.modules = {};
require.base = '';
