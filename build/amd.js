if (typeof define === 'undefined')
	function define(name, injects, module) {
		function _require(path, resolve, reject) {
			if (Array.isArray(path)) {
				path = path[0];
				/*return typeof require === 'undefined'
				? import(path).then(resolve, reject)
				: resolve(require(path));*/
				return import(path).then(resolve, reject);
			} else return typeof require !== 'undefined' && require(path);
		}

		const modules = define.modules || (define.modules = {}),
			moduleExports = {},
			globalExports =
				typeof exports === 'undefined' ? moduleExports : exports,
			args = [_require, name === 'index' ? globalExports : moduleExports];
		for (let i = 2; i < injects.length; i++)
			args.push(modules[injects[i]] || _require(injects[i]));
		module.apply(null, args);
		modules[name] = moduleExports;
	}
