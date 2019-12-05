function define(name, injects, module) {
	function _require([path], resolve, reject) {
		return typeof require === 'undefined'
			? import(path).then(resolve, reject)
			: resolve(require(path));
	}

	const modules = define.modules || (define.modules = {}),
		exports = {},
		args = [_require, exports];
	for (let i = 2; i < injects.length; i++) args.push(modules[injects[i]]);
	module.apply(null, args);
	modules[name] = exports;
}
