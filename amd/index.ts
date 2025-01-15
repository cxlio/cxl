type ModuleFunction = (...injects: unknown[]) => unknown;

/*eslint no-var:off */
declare var define: DefineFunction;
declare var require: RequireFunction;
declare var global: typeof globalThis;

type DefineFunction = {
	(name: ModuleFunction): void;
	(name: string[], module: ModuleFunction): void;
	(name: string, injects: string[], module: ModuleFunction): void;
	eval(src: string): void;
	modules: Record<string, unknown>;
	moduleName: string;
};

type RequireFunction = {
	(mod: string): unknown;
	replace?(path: string): string;
	resolve(path: string, op?: { paths?: string[] }): string;
};

interface AmdFunctions {
	require?: RequireFunction;
	module?: { require?: RequireFunction; exports: unknown };
	process?: unknown;
}

((window: typeof globalThis & AmdFunctions) => {
	const __require = window.process ? require : undefined;
	const define = (window.define ||= _define as unknown as DefineFunction);
	const modules = (_require.modules = define.modules = define.modules || {});
	const modulePromise: Record<string, Promise<unknown> | unknown> = {};
	const BASENAME_REGEX = /\/?([^/]+)$/;
	const windowRequire = (window.require || _require) as RequireFunction;

	function dirname(path: string): string {
		return path.replace(BASENAME_REGEX, '');
	}

	function normalize(path: string, basePath: string) {
		return new URL(
			basePath + '/' + (path.endsWith('.js') ? path : `${path}.js`),
			'https://localhost',
		).pathname.slice(1);
	}

	function tryRequire(path: string) {
		try {
			return __require?.(path);
		} catch (e) {
			// Ignore Error, try async
		}
	}

	async function _requireAsync(path: string) {
		await Promise.resolve();

		const mod = modules[path] || modulePromise[path] || tryRequire(path);
		if (mod) return mod;

		const modulePath = windowRequire.replace
			? windowRequire.replace(path)
			: path;

		return (modulePromise[path] = _import(modulePath, path));
	}

	function _require(
		path: string | string[],
		resolve?: (mod: unknown) => void,
		reject?: (err: unknown) => void,
		basePath?: string,
	) {
		let actualPath = Array.isArray(path) ? path[0] : path;
		let mod = modules[actualPath] || tryRequire(actualPath);

		if (!mod) {
			if (basePath) actualPath = normalize(actualPath, basePath);
			mod = _requireAsync(actualPath);
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
		module: ModuleFunction,
	): Promise<unknown> | unknown {
		let isAsync = false;
		const moduleExports = {};
		const args: unknown[] = [];

		function resolve(newargs: unknown[]) {
			const hasModule = !!window.module;
			const mod = (window.module = {
				exports: moduleExports,
			});
			const result = module(...newargs);
			const resultMod = (modules[name] =
				result || mod.exports || moduleExports);
			delete modulePromise[name];
			if (hasModule) delete window.module;
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
		module: ModuleFunction,
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
		module: ModuleFunction,
	): void;
	function _define(
		name: string | string[] | ModuleFunction,
		injects?: string[] | ModuleFunction,
		module?: ModuleFunction,
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
				return modules[moduleName] ?? modulePromise[moduleName] ?? {};
			});
	}

	if (typeof window.require !== 'undefined')
		_require.resolve = window.require.resolve;
	window.require = window.require || _require;
	_define.amd = true;
})(typeof self === 'undefined' ? global : self);
define.eval ||= function (__source: string) {
	eval(__source);
};
