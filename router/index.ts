const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g,
	PARAM_REGEX = /\:([\w_\$]+)/g,
	optionalParam = /\((.*?)\)/g,
	namedParam = /(\(\?)?:\w+/g,
	splatParam = /\*\w+/g,
	escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

interface Dictionary {
	[key: string]: string | null;
}

interface RouteInstances {
	[key: string]: Element;
}

type RouteArguments = { [key: string]: any };

interface RouteDefinition {
	id?: string;
	title?: string;
	path: string;
	isDefault?: boolean;
	resolve?: (args: any) => boolean;
	parent?: string;
	redirectTo?: string;
	routeElement: Element | ((args: RouteArguments) => Element) | string;
}

function routeToRegExp(route: string): [RegExp, string[]] {
	const names: string[] = [],
		result = new RegExp(
			'^' +
				route
					.replace(escapeRegExp, '\\$&')
					.replace(optionalParam, '(?:$1)?')
					.replace(namedParam, function(match, optional) {
						names.push(match.substr(1));
						return optional ? match : '([^/?]+)';
					})
					.replace(splatParam, '([^?]*?)') +
				'(?:/$|\\?|$)'
		);

	return [result, names];
}

class Fragment {
	regex: RegExp;
	parameters: string[];

	constructor(public path: string) {
		[this.regex, this.parameters] = routeToRegExp(path);
	}

	_extractQuery(frag: string, result: Dictionary) {
		var pos = frag.indexOf('?'),
			query = pos !== -1 ? frag.slice(pos + 1) : null,
			m;
		while (query && (m = PARAM_QUERY_REGEX.exec(query)))
			result[m[1]] = decodeURIComponent(m[2]);

		return result;
	}

	getArguments(fragment: string) {
		const match = this.regex.exec(fragment),
			params = match && match.slice(1),
			result: Dictionary = {},
			me = this;

		if (!params) return;

		params.forEach(function(param, i) {
			var p;
			// Don't decode the search params.
			p =
				i === params.length - 1
					? param || null
					: param
					? decodeURIComponent(param)
					: null;

			result[me.parameters[i]] = p;
		});

		return this._extractQuery(fragment, result);
	}

	test(hash: string) {
		return this.regex.test(hash);
	}

	toString() {
		return this.path;
	}
}

export class Route {
	id: string;
	path?: Fragment;
	definition: RouteDefinition;
	isDefault: boolean;
	parent?: string;

	constructor(def: RouteDefinition) {
		if (def.path !== undefined) this.path = new Fragment(def.path);

		this.id = def.id || def.path;
		this.isDefault = def.isDefault || false;
		this.parent = def.parent;
		this.definition = def;
	}

	createElement(args: RouteArguments) {
		const el = this.definition.routeElement;

		if (typeof el === 'function') return el(args);

		const result = el instanceof Element ? el : document.createElement(el);

		for (let i in args) (result as any)[i] = args[i];

		return result;
	}

	create(args: Dictionary) {
		const def = this.definition,
			resolve = def.resolve;

		if (resolve && resolve(args) === false) return null;

		const el = this.createElement(args);

		return el;
	}
}

class RouteManager {
	routes: Route[] = [];
	defaultRoute?: Route;

	findRouteDefinition(hash: string) {
		return this.routes.find(r => {
			return r.path && r.path.test(hash);
		});
	}

	get(id: string) {
		return this.routes.find(r => r.id === id);
	}

	register(route: Route) {
		if (route.isDefault) this.defaultRoute = route;

		this.routes.unshift(route);
	}
}

export class Router {
	routes = new RouteManager();
	root?: Element;
	instances: RouteInstances = {};
	current?: Element;

	currentRoute?: Route;
	defaultRoute?: Route;

	findRoute(id: string, args: Dictionary) {
		const route = this.instances[id];
		let i: string;

		if (route) {
			for (i in args) (route as any)[i] = args[i];
		}

		return route;
	}

	executeRoute(
		route: Route,
		args: RouteArguments,
		instances: RouteInstances
	) {
		const parentId = route.parent,
			Parent = parentId && this.routes.get(parentId),
			id = route.id,
			parent = Parent
				? this.executeRoute(Parent, args, instances)
				: router.root || document.body,
			instance = this.findRoute(id, args) || route.create(args);

		if (instance && parent && instance.parentNode !== parent) {
			parent.appendChild(instance);
		}

		instances[id] = instance;

		return instance;
	}

	discardOldRoutes(newInstances: RouteInstances) {
		const oldInstances = this.instances;

		for (let i in oldInstances)
			if (newInstances[i] !== oldInstances[i]) delete oldInstances[i];
	}

	execute(Route: Route, args?: RouteArguments) {
		const instances = {};

		this.current = this.executeRoute(Route, args || {}, instances);

		this.currentRoute = Route;
		this.discardOldRoutes(instances);
		this.instances = instances;
	}

	getPath(routeId: string, params: RouteArguments) {
		const route = this.routes.get(routeId);
		const path = route && route.path;

		params = params || this.current;

		return path && replaceParameters(path.toString(), params);
	}

	goPath(path: string) {
		window.location.hash = path;
	}

	go(routeId: string, params: RouteArguments) {
		this.goPath('#' + this.getPath(routeId, params));
	}

	setRoot(el: Element) {
		this.root = el;
	}
}

export const router = new Router();

export function replaceParameters(path: string, params: Dictionary) {
	if (params === null || params === undefined) return path;

	if (typeof params !== 'object') params = { $: params };

	return path.replace(PARAM_REGEX, (_match, key) => params[key] || '');
}

export function route(def: RouteDefinition) {
	const result = new Route(def);

	return result;
}
