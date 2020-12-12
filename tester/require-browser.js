(() => {
	'use strict';

	function appendScript(__src) {
		const exports = {},
			module = { exports: exports };
		eval(__src);
		return module;
	}

	function require(path) {
		function normalizePath(basePath) {
			const a = document.createElement('a');
			a.href = basePath || '';
			return a.pathname;
		}

		const mods = require.modules;

		if (require.replace) path = require.replace(path);
		// Handle packages
		if (path[0] !== '.' && path[0] !== '/') {
			if (!mods[path]) throw new Error(`Module "${path}" not found.`);
			return mods[path];
		}

		const actualPath = path.endsWith('.js') ? path : path + '.js';
		let url = path[0] === '/' ? actualPath : require.base + actualPath;
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send();

		if (xhr.status === 404) {
			url = url.replace(/\.js$/, '/index.js');
			xhr.open('GET', url, false);
			xhr.send();
		}
		const id = xhr.responseURL;
		const source = xhr.responseText + '\n//# sourceURL=' + id;

		if (mods[id]) return mods[id];

		const oldBase = require.base;
		const baseMatch = /(.*\/).*/.exec(url);
		require.base = baseMatch ? normalizePath(baseMatch[1]) : '';
		const module = appendScript(source);
		require.base = oldBase;
		mods[id] = module.exports;
		return module.exports;
	}
	require.modules = {};
	require.base = '';

	window.require = require;
})();
