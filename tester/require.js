(() => {
	'use strict';

	function appendScript(__src) {
		const exports = {},
			module = { exports: exports };
		eval(__src);
		return module;
	}

	function require(path) {
		const mods = require.modules;
		const xhr = new XMLHttpRequest();
		xhr.open('POST', 'http://localhost', false);
		xhr.send(
			JSON.stringify({
				base: require.base,
				scriptPath: path,
			})
		);

		const response = JSON.parse(xhr.responseText);
		const url = response.url;
		if (mods[url]) return mods[url];
		const oldBase = require.base;
		require.base = response.base;
		const module = appendScript(response.content);
		require.base = oldBase;
		return (mods[url] = module.exports);
	}
	require.modules = {};
	require.base = '.';
	window.require = require;
})();
