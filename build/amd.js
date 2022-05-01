(window => {
	function _require(path, resolve, reject) {
		if (Array.isArray(path)) {
			path = path[0];
			return Promise.resolve()
				.then(() => _require(path))
				.then(resolve, reject);
		} else {
			let mod = define.modules[path];
			if (!mod) {
				try {
					mod = module.require(path);
				} catch (e) {
					throw new Error(`Module "${path}" not found`);
				}
			}
			return mod;
		}
	}

	window.define = window.define || define;

	function define(name, injects, module) {
		window.require = window.require || _require;
		if (arguments.length === 2 && Array.isArray(name)) {
			module = injects;
			injects = name;
			name = new Error().fileName;
		} else if (arguments.length === 1) {
			module = name;
			injects = [];
			name = new Error().fileName;
		}
		const modules =
			define.modules || (define.modules = window.require.modules || {});
		const moduleExports = (name && modules[name]) || {};
		if (name) modules[name] = moduleExports;

		function findModule(name) {
			if (name === 'exports') return moduleExports;
			if (name === 'require') return window.require;

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
		define.amd = true;
	}
})(typeof self === 'undefined' ? global : self);
