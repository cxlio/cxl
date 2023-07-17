///<amd-module name="@cxl/router"/>
const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g,
	PARAM_REGEX = /:([\w_$@]+)/g,
	optionalParam = /\/\((.*?)\)/g,
	namedParam = /(\(\?)?:\w+/g,
	splatParam = /\*\w+/g,
	escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;

const routeSymbol = '@@cxlRoute';

type RouteArguments = { [key: string]: string };

export interface RouteElement extends HTMLElement {
	[routeSymbol]?: Route<RouteElement>;
}

interface RouteInstances {
	[key: string]: RouteElement;
}

export interface RouterState {
	url: Url;
	root: RouteElement;
	current: RouteElement;
	arguments?: RouteArguments;
	route: Route<RouteElement>;
}

export interface RouteDefinition<T extends RouteElement> {
	id?: string;
	path?: string;
	isDefault?: boolean;
	parent?: string;
	redirectTo?: string;
	resolve?: (args: Partial<T>) => boolean;
	render: () => T;
}

export interface Url {
	path: string;
	hash: string;
}

export interface Strategy {
	getHref(url: Url | string): string;
	serialize(url: Url): void;
	deserialize(): Url;
}

export const sys = {
	location: window.location,
	history: window.history,
};

function routeToRegExp(route: string): [RegExp, string[]] {
	const names: string[] = [],
		result = new RegExp(
			'^/?' +
				route
					.replace(escapeRegExp, '\\$&')
					.replace(optionalParam, '\\/?(?:$1)?')
					.replace(namedParam, function (match, optional) {
						names.push(match.substr(1));
						return optional ? match : '([^/?]*)';
					})
					.replace(splatParam, '([^?]*?)') +
				'(?:/$|\\?|$)'
		);

	return [result, names];
}

export function normalize(path: string) {
	if (path[0] === '/') path = path.slice(1);
	if (path.endsWith('/')) path = path.slice(0, -1);
	return path;
}

export function replaceParameters(
	path: string,
	params?: Record<string, string>
) {
	if (!params) return path;
	return path.replace(PARAM_REGEX, (_match, key) => params[key] || '');
}

export function parseQueryParameters(query: string) {
	const result: Record<string, string> = {};
	let m;
	while ((m = PARAM_QUERY_REGEX.exec(query)))
		result[m[1]] = decodeURIComponent(m[2]);
	return result;
}

class Fragment {
	path: string;
	regex: RegExp;
	parameters: string[];

	constructor(path: string) {
		this.path = path = normalize(path);
		[this.regex, this.parameters] = routeToRegExp(path);
	}

	_extractQuery(frag: string) {
		const pos = frag.indexOf('?');
		return pos === -1 ? {} : parseQueryParameters(frag.slice(pos + 1));
	}

	getArguments(fragment: string) {
		const match = this.regex.exec(fragment);
		const params = match && match.slice(1);

		if (!params) return;

		const result = this._extractQuery(fragment);

		params.forEach((param, i) => {
			// Don't decode the search params.
			const p =
				i === params.length - 1
					? param || ''
					: param
					? decodeURIComponent(param)
					: '';

			result[this.parameters[i]] = p;
		});

		return result;
	}

	test(url: string) {
		return this.regex.test(url);
	}

	toString() {
		return this.path;
	}
}

export class Route<T extends RouteElement> {
	id: string;
	path?: Fragment;
	parent?: string;
	redirectTo?: string;
	definition: RouteDefinition<T>;
	isDefault: boolean;

	constructor(def: RouteDefinition<T>) {
		if (def.path !== undefined) this.path = new Fragment(def.path);
		else if (!def.id) throw new Error('An id or path is required.');

		this.id = def.id || (def.path ?? `route${Math.random().toString()}`);
		this.isDefault = def.isDefault || false;
		this.parent = def.parent;
		this.redirectTo = def.redirectTo;
		this.definition = def;
	}

	createElement(args: Partial<T>) {
		const el = this.definition.render();
		el[routeSymbol] = this as Route<RouteElement>;
		for (const a in args)
			if (args[a as keyof T] !== undefined)
				el[a as keyof T] = args[a as keyof T] as T[keyof T];

		return el;
	}

	create(args: Partial<T>) {
		const def = this.definition,
			resolve = def.resolve;

		if (resolve && resolve(args) === false) return null;

		return this.createElement(args);
	}
}

export class RouteManager {
	readonly routes: Route<RouteElement>[] = [];
	defaultRoute?: Route<RouteElement>;

	findRoute(path: string) {
		return this.routes.find(r => r.path?.test(path)) || this.defaultRoute;
	}

	get(id: string) {
		return this.routes.find(r => r.id === id);
	}

	register(route: Route<RouteElement>) {
		if (route.isDefault) {
			if (this.defaultRoute)
				throw new Error('Default route already defined');
			this.defaultRoute = route;
		}
		this.routes.unshift(route);
	}
}

const URL_REGEX = /([^#]*)(?:#(.+))?/;

export function getElementRoute<T extends RouteElement>(
	el: T
): Route<T> | undefined {
	return el[routeSymbol] as Route<T>;
}

export function parseUrl(url: string): Url {
	const match = URL_REGEX.exec(url);
	return { path: normalize(match?.[1] || ''), hash: match?.[2] || '' };
}

export const QueryStrategy: Strategy = {
	getHref(url: Url | string) {
		url = typeof url === 'string' ? parseUrl(url) : url;
		return `${sys.location.pathname}${url.path ? `?${url.path}` : ''}${
			url.hash ? `#${url.hash}` : ''
		}`;
	},

	serialize(url) {
		const oldUrl = sys.history.state?.url;
		if (!oldUrl || url.hash !== oldUrl.hash || url.path !== oldUrl.path)
			sys.history.pushState({ url }, '', this.getHref(url));
	},

	deserialize() {
		return (
			sys.history.state?.url || {
				path: sys.location.search.slice(1),
				hash: sys.location.hash.slice(1),
			}
		);
	},
};

export const PathStrategy: Strategy = {
	getHref(url: Url | string) {
		url = typeof url === 'string' ? parseUrl(url) : url;
		return `${url.path}${url.hash ? `#${url.hash}` : ''}`;
	},

	serialize(url) {
		const oldUrl = sys.history.state?.url;
		if (!oldUrl || url.hash !== oldUrl.hash || url.path !== oldUrl.path)
			sys.history.pushState({ url }, '', this.getHref(url));
	},

	deserialize() {
		return (
			sys.history.state?.url || {
				path: sys.location.pathname,
				hash: sys.location.hash.slice(1),
			}
		);
	},
};

export const HashStrategy: Strategy = {
	getHref(url: Url | string) {
		url = typeof url === 'string' ? parseUrl(url) : url;
		return `#${url.path}${url.hash ? `#${url.hash}` : ''}`;
	},

	serialize(url) {
		const href = HashStrategy.getHref(url);
		if (sys.location.hash !== href) {
			sys.location.hash = href;
			//sys.history.replaceState({ url }, '');
		}
	},

	deserialize() {
		return parseUrl(sys.location.hash.slice(1));
	},
};

export const Strategies = {
	hash: HashStrategy,
	path: PathStrategy,
	query: QueryStrategy,
};

export class Router {
	state?: RouterState;
	routes = new RouteManager();
	instances: RouteInstances = {};
	root?: RouteElement;

	private lastGo?: Url | string;

	constructor(private callbackFn?: (state: RouterState) => void) {}

	private findRoute<T extends RouteElement>(id: string, args: Partial<T>) {
		const route = this.instances[id] as T;
		let i: string;

		if (route)
			for (i in args) {
				const arg = args[i as keyof T] as T[keyof T];
				if (arg !== undefined) route[i as keyof T] = arg;
			}

		return route;
	}

	private executeRoute<T extends RouteElement>(
		route: Route<T>,
		args: Partial<T>, //RouteArguments,
		instances: RouteInstances
	) {
		const parentId = route.parent,
			Parent = parentId && this.routes.get(parentId),
			id = route.id,
			parent = Parent && this.executeRoute(Parent, args, instances),
			instance = this.findRoute(id, args) || route.create(args);

		if (!parent) this.root = instance;
		else if (instance && instance.parentNode !== parent)
			parent.appendChild(instance);

		instances[id] = instance;

		return instance;
	}

	private discardOldRoutes(newInstances: RouteInstances) {
		const oldInstances = this.instances;

		for (const i in oldInstances) {
			const old = oldInstances[i];
			if (newInstances[i] !== old) {
				old.parentNode?.removeChild(old);
				delete oldInstances[i];
			}
		}
	}

	private execute<T extends RouteElement>(
		Route: Route<T>,
		args?: Partial<T>
	) {
		const instances = {};
		const result = this.executeRoute(Route, args || {}, instances);
		this.discardOldRoutes(instances);
		this.instances = instances;
		return result;
	}

	/**
	 * Register a new route
	 */
	route<T extends RouteElement>(def: RouteDefinition<T>) {
		const route = new Route<T>(def);
		this.routes.register(route as Route<RouteElement>);
		return route;
	}

	go(url: Url | string): void {
		this.lastGo = url;
		const parsedUrl = typeof url === 'string' ? parseUrl(url) : url;
		const path = parsedUrl.path;
		const currentUrl = this.state?.url;

		if (
			currentUrl &&
			path === currentUrl.path &&
			parsedUrl.hash === currentUrl.hash
		)
			return;
		const route = this.routes.findRoute(path);

		if (!route) throw new Error(`Path: "${path}" not found`);

		const args = route.path?.getArguments(path);

		if (route.redirectTo)
			return this.go(replaceParameters(route.redirectTo, args));

		const current = this.execute(route, args);

		// Check if page was redirected
		if (this.lastGo !== url) return;

		if (!this.root)
			throw new Error(`Route: "${path}" could not be created`);

		this.state = {
			url: parsedUrl,
			arguments: args,
			route,
			current,
			root: this.root,
		};
		if (this.callbackFn) this.callbackFn(this.state);
	}

	getPath(routeId: string, params: RouteArguments) {
		const route = this.routes.get(routeId);
		const path = route && route.path;

		return path && replaceParameters(path.toString(), params);
	}

	isActiveUrl(url: string) {
		const parsed = parseUrl(url);
		if (!this.state?.url) return false;
		const current = this.state.url;
		return !!Object.values(this.instances).find(el => {
			const routeDef = el[routeSymbol];
			const currentArgs = this.state?.arguments;

			if (
				routeDef?.path?.test(parsed.path) &&
				(!parsed.hash || parsed.hash === current.hash)
			) {
				if (currentArgs) {
					const args = routeDef.path.getArguments(parsed.path);

					for (const i in args)
						if (currentArgs[i] != args[i]) return false;
				}

				return true;
			}
			return false;
		});
	}
}
