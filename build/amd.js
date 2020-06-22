window.define =
	window.define ||
	function define(name, injects, module) {
		function _require(path, resolve, reject) {
			if (Array.isArray(path)) {
				path = path[0];
				return import(path).then(resolve, reject);
			} else return typeof require !== 'undefined' && require(path);
		}

		if (arguments.length === 2 && Array.isArray(name)) {
			module = injects;
			injects = name;
			name = null;
		}

		const modules = define.modules || (define.modules = {}),
			moduleExports = {},
			globalExports =
				typeof exports === 'undefined' ? moduleExports : exports,
			args = [_require, name === 'index' ? globalExports : moduleExports];

		for (let i = 2; i < injects.length; i++)
			args.push(modules[injects[i]] || _require(injects[i]));

		module(...args);

		if (name) modules[name] = moduleExports;
	};
