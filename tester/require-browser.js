(() => {
	'use strict';

	function appendScript(__src) {
		const exports = {},
			module = { exports: exports };
		eval(__src);
		return module;
	}
	function basename(url) {
		const baseMatch = /(.*\/).*/.exec(url);
		return baseMatch ? normalizePath(baseMatch[1]) : '';
	}
	function normalizePath(basePath) {
		let href = require.href || location.href;
		if (href === 'about:srcdoc') href = top.location.href;
		const a = new URL(basePath, href);
		return a.href;
	}

	function _import(url, moduleName) {
		return fetch(url)
			.then(res => (res.status === 200 ? res.text() : ''))
			.then(__src => {
				const mods = require.modules;
				mods[moduleName] = __src ? appendScript(__src).exports : {};
				return mods[moduleName];
			});
	}

	function require(path) {
		const mods = require.modules;

		if (mods[path]) return mods[path];

		if (require.replace) path = require.replace(path, require.base);
		// Handle packages
		if (path[0] !== '.' && path[0] !== '/') {
			if (!mods[path]) return _import(path);
			//throw new Error(`Module "${path}" not found.`);
			return mods[path];
		}
		if (mods[path]) return mods[path];

		const actualPath = /\.c?js$/.test(path) ? path : path + '.js';
		let url = normalizePath(
			path[0] === '/' ? actualPath : require.base + actualPath,
		);
		if (mods[url]) return mods[url];

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
		require.base = basename(url);
		try {
			const module = appendScript(source);
			mods[id] = module.exports;
			return module.exports;
		} finally {
			require.base = oldBase;
		}
	}
	require.modules = (typeof define !== 'undefined' && define.modules) || {};
	require.base = basename(location.pathname);

	window.require = require;
})();
