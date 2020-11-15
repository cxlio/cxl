const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g,
	PARAM_REGEX = /:([\w_$]+)/g,
	optionalParam = /\((.*?)\)/g,
	namedParam = /(\(\?)?:\w+/g,
	splatParam = /\*\w+/g,
	escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;

type Dictionary = Record<string, string>;
type RouteArguments = { [key: string]: any };
type RouteElement = Node;

interface RouteInstances {
	[key: string]: RouteElement;
}

export interface RouterState {
	url: Url;
	root: Node;
	current: Node;
	route: Route<RouteElement>;
}

export interface RouteDefinition<T extends RouteElement> {
	id?: string;
	path: string;
	isDefault?: boolean;
	parent?: string;
	redirectTo?: string;
	resolve?: (args: Partial<T>) => boolean;
	render: (ctx?: any) => T;
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

function routeToRegExp(route: string): [RegExp, string[]] {
	const names: string[] = [],
		result = new RegExp(
			'^/?' +
				route
					.replace(escapeRegExp, '\\$&')
					.replace(optionalParam, '(?:$1)?')
					.replace(namedParam, function (match, optional) {
						names.push(match.substr(1));
						return optional ? match : '([^/?]+)';
					})
					.replace(splatParam, '([^?]*?)') +
				'(?:/$|\\?|$)'
		);

	return [result, names];
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
	regex: RegExp;
	parameters: string[];

	constructor(public path: string) {
		if (path[0] === '/') path = path.slice(1);

		[this.regex, this.parameters] = routeToRegExp(path);
	}

	_extractQuery(frag: string, result: Dictionary) {
		const pos = frag.indexOf('?'),
			query = pos !== -1 ? frag.slice(pos + 1) : null;
		let m;

		while (query && (m = PARAM_QUERY_REGEX.exec(query)))
			result[m[1]] = decodeURIComponent(m[2]);

		return result;
	}

	getArguments(fragment: string) {
		const match = this.regex.exec(fragment),
			params = match && match.slice(1),
			result: Dictionary = {};

		if (!params) return;

		params.forEach((param, i) => {
			// Don't decode the search params.
			const p =
				i === params.length - 1
					? param || null
					: param
					? decodeURIComponent(param)
					: null;

			if (p) result[this.parameters[i]] = p;
		});

		return this._extractQuery(fragment, result);
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

		this.id = def.id || def.path;
		this.isDefault = def.isDefault || false;
		this.parent = def.parent;
		this.redirectTo = def.redirectTo;
		this.definition = def;
	}

	createElement(args: Partial<T>) {
		const el = this.definition.render();
		for (const a in args) el[a] = args[a] as any;
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
	private routes: Route<any>[] = [];
	defaultRoute?: Route<any>;

	findRoute(path: string) {
		return this.routes.find(r => r.path?.test(path)) || this.defaultRoute;
	}

	get(id: string) {
		return this.routes.find(r => r.id === id);
	}

	register(route: Route<any>) {
		if (route.isDefault) this.defaultRoute = route;
		this.routes.unshift(route);
	}

	reset() {
		this.routes = [];
	}
}

const URL_REGEX = /([^#]+)(?:#(.+))?/;

export function parseUrl(url: string): Url {
	const match = URL_REGEX.exec(url);
	return { path: match?.[1] || '', hash: match?.[2] || '' };
}

export const QueryStrategy: Strategy = {
	getHref(url: Url | string) {
		url = typeof url === 'string' ? parseUrl(url) : url;
		return `${url.path ? `?${url.path}` : ''}${
			url.hash ? `#${url.hash}` : ''
		}`;
	},

	serialize(url) {
		history.pushState({ url }, '', this.getHref(url));
	},

	deserialize() {
		return (
			history.state?.url || {
				path: location.search.slice(1),
				hash: location.hash.slice(1),
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
		history.pushState({ url }, '', this.getHref(url));
	},

	deserialize() {
		return (
			history.state?.url || {
				path: location.pathname,
				hash: location.hash.slice(1),
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
		const href = this.getHref(url);
		if (location.hash !== href) location.hash = href;
	},

	deserialize() {
		return parseUrl(location.hash.slice(1));
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

	constructor(private callbackFn?: (state: RouterState) => void) {}

	private findRoute(id: string, args: any) {
		const route = this.instances[id];
		let i: string;

		if (route) for (i in args) (route as any)[i] = args[i];

		return route;
	}

	private executeRoute<T extends RouteElement>(
		route: Route<T>,
		args: Partial<T>,
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

	reset() {
		this.routes.reset();
	}

	/**
	 * Register a new route
	 */
	route<T extends RouteElement>(def: RouteDefinition<T>) {
		const route = new Route<T>(def);
		this.routes.register(route);
		return route;
	}

	go(url: Url | string): void {
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

		if (!this.root)
			throw new Error(`Route: "${path}" could not be created`);

		this.state = {
			url: parsedUrl,
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
		return (
			parsed.path === current.path &&
			(!parsed.hash || parsed.hash === current.hash)
		);
	}
}
