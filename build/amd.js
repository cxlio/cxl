window.define =
	window.define ||
	function define(name, injects, module) {
		define.amd = true;

		function _require(path, resolve, reject) {
			if (Array.isArray(path)) {
				path = path[0];
				return Promise.resolve()
					.then(() => _require(path))
					.then(resolve, reject);
			} else {
				const module = define.modules[path];
				if (!module) throw new Error(`Module "${path}" not found`);
				return module;
			}
		}
		window.require = window.require || _require;
		if (arguments.length === 2 && Array.isArray(name)) {
			module = injects;
			injects = name;
			name = null;
		}
		const modules =
			define.modules ||
			(define.modules = {
				require: _require,
			});
		const moduleExports = (name && modules[name]) || {};
		if (name) modules[name] = moduleExports;

		function findModule(name) {
			if (name === 'exports') return moduleExports;

			const id = name.replace(/\.js$/, '');
			return modules[id] || _require(name);
		}

		const args = injects.map(findModule);
		const oldModule = window.module;
		window.module = { exports: moduleExports };
		module.apply(void 0, args);
		if (name && window.module.exports !== moduleExports)
			modules[name] = window.module.exports;
		window.module = oldModule;
	};
