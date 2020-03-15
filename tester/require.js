function require(path) {
	const mods = require.modules;
	const xhr = new XMLHttpRequest();
	xhr.open('POST', 'http://localhost', false);
	xhr.send(
		JSON.stringify({
			base: require.base,
			scriptPath: path
		})
	);

	const response = JSON.parse(xhr.responseText);
	const url = response.url;
	if (mods[url]) return mods[url];
	const exports = {};
	const oldBase = require.base;
	require.base = response.base;
	new Function('exports', response.content)(exports);
	require.base = oldBase;
	mods[url] = exports;
	return exports;
}
require.modules = {};
require.base = '.';
