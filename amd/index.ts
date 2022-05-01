type ModuleFunction = (...injects: any[]) => any;

declare function define(name: ModuleFunction): void;
declare function define(name: string[], module: ModuleFunction): void;
declare function define(
	name: string,
	injects: string[],
	module: ModuleFunction
): void;

(window => {
	const define = ((window as any).define = (window as any).define || _define);
	const modules = (_require.modules = define.modules = define.modules || []);
	const modulePromise: Record<string, Promise<any>> = {};
	const BASENAME_REGEX = /\/?([^/]+)$/;
	const windowRequire = window.require || _require;
	//const hasES6 =
	//	'noModule' in HTMLScriptElement.prototype && self instanceof Window;
	function dirname(path: string): string {
		return path.replace(BASENAME_REGEX, '');
	}

	function normalize(path: string, basePath: string) {
		return new URL(
			basePath + '/' + (path.endsWith('.js') ? path : `${path}.js`),
			'https://localhost'
		).pathname.slice(1);
	}

	async function _requireAsync(path: string) {
		await Promise.resolve();

		const mod = modules[path] || modulePromise[path];
		if (mod) return mod;

		const modulePath = (windowRequire as any).replace
			? (windowRequire as any).replace(path)
			: path;

		//return hasES6 ? _import(modulePath, path) : import(path);
		return (modulePromise[path] = _import(modulePath, path));
	}

	function _require(
		path: string | string[],
		resolve?: (mod: any) => void,
		reject?: (err: any) => void,
		basePath?: string
	) {
		let actualPath = Array.isArray(path) ? path[0] : path;
		let mod = modules[actualPath];

		if (!mod) {
			if (typeof module !== 'undefined' && module.require) {
				try {
					mod = module.require(actualPath);
				} catch (e) {
					// Ignore Error, try async
				}
			}
			if (!mod) {
				if (basePath) actualPath = normalize(actualPath, basePath);
				mod = _requireAsync(actualPath);
			}
		}

		if (resolve) {
			if (mod instanceof Promise) mod.then(resolve, reject);
			else resolve(mod);
		}
		return mod;
	}

	function defineAsync(
		name: string,
		injects: string[],
		module: ModuleFunction
	) {
		let isAsync = false;
		const moduleExports = {};
		const args: any[] = [];

		function resolve(newargs: any[]) {
			const result = module(...newargs);
			const resultMod = (modules[name] = result || moduleExports);
			delete modulePromise[name];
			return resultMod;
		}
		function findModule(modname: string) {
			if (modname === 'exports') return moduleExports;
			if (modname === 'require') return _require;
			if (modname.startsWith('.'))
				return _require(modname, undefined, undefined, dirname(name));
			return _require(modname);
		}
		for (const inject of injects) {
			const mod = findModule(inject);
			if (mod instanceof Promise) isAsync = true;
			args.push(mod);
		}

		return isAsync ? Promise.all(args).then(resolve) : resolve(args);
	}

	function defineNormalized(
		name: string,
		injects: string[],
		module: ModuleFunction
	) {
		if (!modules[name])
			modulePromise[name] = defineAsync(name, injects, module);
		else throw new Error(`Module "${name}" already defined`);
	}

	function _define(name: ModuleFunction): void;
	function _define(name: string[], module: ModuleFunction): void;
	function _define(
		name: string,
		injects: string[],
		module: ModuleFunction
	): void;
	function _define(
		name: string | string[] | ModuleFunction,
		injects?: string[] | ModuleFunction,
		module?: ModuleFunction
	) {
		if (Array.isArray(name) && injects && !Array.isArray(injects)) {
			defineNormalized(define.moduleName, name, injects);
		} else if (typeof name === 'function') {
			defineNormalized(define.moduleName, [], name);
		} else if (typeof name === 'string' && Array.isArray(injects) && module)
			defineNormalized(name, injects, module);
		else throw new Error('Invalid define');
	}

	function _import(url: string, moduleName: string) {
		return fetch(url)
			.then(res => (res.status === 200 ? res.text() : ''))
			.then(__src => {
				if (!__src) return (modules[moduleName] = {});
				define.moduleName = moduleName;
				delete modulePromise[moduleName];
				define.eval(`${__src}\n//# sourceURL=${moduleName}`);
				return modules[moduleName] || modulePromise[moduleName] || {};
			});
	}

	if (typeof require !== 'undefined') _require.resolve = require.resolve;
	window.require = window.require || _require;
	_define.amd = true;
})(typeof self === 'undefined' ? global : self);
(define as any).eval ||= function (__source: string) {
	eval(__source);
};
