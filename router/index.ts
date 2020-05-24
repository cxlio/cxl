import { Reference } from '../rx/index.js';

const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g,
	PARAM_REGEX = /:([\w_$]+)/g,
	optionalParam = /\((.*?)\)/g,
	namedParam = /(\(\?)?:\w+/g,
	splatParam = /\*\w+/g,
	escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;

type Dictionary = Record<string, string>;
type RouteArguments = { [key: string]: any };

interface RouteInstances {
	[key: string]: Element;
}

interface Element {
	parentNode: Element | null;
	appendChild(el: Element): void;
	removeChild(el: Element): void;
}

export interface RouteDefinition<T extends Element> {
	id?: string;
	title?: string;
	path: string;
	isDefault?: boolean;
	parent?: string;
	redirectTo?: string;
	resolve?: (args: Partial<T>) => boolean;
	render: (ctx?: any) => T;
}

function routeToRegExp(route: string): [RegExp, string[]] {
	const names: string[] = [],
		result = new RegExp(
			'^' +
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

class Fragment {
	regex: RegExp;
	parameters: string[];

	constructor(public path: string) {
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

	test(hash: string) {
		return this.regex.test(hash);
	}

	toString() {
		return this.path;
	}
}

export class Route<T extends Element> {
	id: string;
	path?: Fragment;
	parent?: string;
	definition: RouteDefinition<T>;
	isDefault: boolean;

	constructor(def: RouteDefinition<T>) {
		if (def.path !== undefined) this.path = new Fragment(def.path);

		this.id = def.id || def.path;
		this.isDefault = def.isDefault || false;
		this.parent = def.parent;
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

class RouteManager {
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
}

export class Router {
	routes = new RouteManager();
	instances: RouteInstances = {};
	current?: Element;
	currentRoute?: Route<any>;
	subject = new Reference<Element>();

	constructor(public readonly root: Element) {}

	private findRoute(id: string, args: any) {
		const route = this.instances[id];
		let i: string;

		if (route) {
			for (i in args) (route as any)[i] = args[i];
		}

		return route;
	}

	private executeRoute<T extends Element>(
		route: Route<T>,
		args: Partial<T>,
		instances: RouteInstances
	) {
		const parentId = route.parent,
			Parent = parentId && this.routes.get(parentId),
			id = route.id,
			parent = Parent
				? this.executeRoute(Parent, args, instances)
				: this.root,
			instance = this.findRoute(id, args) || route.create(args);

		if (instance && parent && instance.parentNode !== parent) {
			parent.appendChild(instance);
		}

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

	private execute<T extends Element>(Route: Route<T>, args?: Partial<T>) {
		const instances = {};
		const current = (this.current = this.executeRoute(
			Route,
			args || {},
			instances
		));
		this.currentRoute = Route;
		this.discardOldRoutes(instances);
		this.instances = instances;
		this.subject.next(current);
	}

	route<T extends Element>(def: RouteDefinition<T>) {
		const route = new Route<T>(def);
		this.routes.register(route);
		return route;
	}

	go(path: string) {
		const route = this.routes.findRoute(path);

		if (!route) throw new Error(`Path: "${path}" not found`);

		this.execute(route, route.path?.getArguments(path));
	}

	getPath(routeId: string, params: RouteArguments) {
		const route = this.routes.get(routeId);
		const path = route && route.path;

		params = params || this.current;

		return path && replaceParameters(path.toString(), params);
	}
}
