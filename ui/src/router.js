(cxl => {
	'use strict';

	const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g,
		optionalParam = /\((.*?)\)/g,
		namedParam = /(\(\?)?:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
		directive = cxl.directive,
		component = cxl.component;
	var ROUTEID = 0;
	function routeToRegExp(route) {
		var names = [],
			result;
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
		result.names = names;

		return result;
	}

	class Fragment {
		constructor(path) {
			this.path = path;
			this.regex = routeToRegExp(path);
			this.parameters = this.regex.names;
		}

		_extractQuery(frag, result) {
			var pos = frag.indexOf('?'),
				query = pos !== -1 ? frag.slice(pos + 1) : null,
				m;
			while (query && (m = PARAM_QUERY_REGEX.exec(query)))
				result[m[1]] = decodeURIComponent(m[2]);

			return result;
		}

		getArguments(fragment) {
			var params = this.regex.exec(fragment).slice(1),
				result = {},
				me = this;
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

		test(hash) {
			return this.regex.test(hash);
		}

		toString() {
			return this.path;
		}
	}

	class Route {
		constructor(def, controller) {
			var names;

			if (def.path !== undefined) {
				this.path = new Fragment(def.path);
				names = this.path.parameters;

				if (names && names.length)
					def.attributes = def.attributes
						? def.attributes.concat(names)
						: names;
			}

			if (def.defaultRoute) cxl.router.setDefault(this);

			this.id = def.id || def.path;
			this.title = def.title;
			this.resolve = def.resolve;
			this.parent = def.parent;
			this.redirectTo = def.redirectTo;

			if (!def.name) this.name = def.name = 'cxl-route' + ROUTEID++;

			def = new cxl.ComponentDefinition(def, controller);

			this.Route = def.Component;
		}

		create(args) {
			if (this.resolve && this.resolve(args) === false) return null;

			const el = cxl.dom(this.name, args),
				title = this.title;

			el.$cxlRoute = this;

			if (title)
				el.$$routeTitle =
					typeof title === 'string' ? title : title.text;

			return el;
		}
	}

	/**
	 * Global router. By default it will only support
	 * one level/state.
	 */
	class Router {
		constructor() {
			this.routes = {};
			this.routesList = [];
			this.instances = {};
			this.subject = new cxl.rx.BehaviorSubject();
			this.currentRoute = null;
		}

		findRouteDefinition(hash) {
			return (
				this.routesList.find(function(r) {
					return r.path && r.path.test(hash);
				}) || this.defaultRoute
			);
		}

		registerRoute(route) {
			this.routes[route.id] = route;
			this.routesList.unshift(route);

			return route;
		}

		setDefault(route) {
			this.defaultRoute = route;
		}

		findRoute(id, args) {
			var route = this.instances[id],
				i,
				def;
			if (route) {
				def = this.routes[id];

				// TODO figure out better way
				if (def.resolve) def.resolve(args);

				for (i in args) route[i] = args[i];
			}

			return route;
		}

		executeRoute(route, args, instances) {
			var parentId = route.parent,
				Parent = parentId && this.routes[parentId],
				id = route.id,
				parent = Parent
					? this.executeRoute(Parent, args, instances)
					: cxl.router.root,
				instance = this.findRoute(id, args) || route.create(args);

			if (instance && parent && instance.parentNode !== parent) {
				cxl.dom.setContent(parent, instance);
			}

			instances[id] = instance;

			return instance;
		}

		discardOldRoutes(newInstances) {
			const oldInstances = this.instances;

			for (let i in oldInstances)
				if (newInstances[i] !== oldInstances[i]) delete oldInstances[i];
		}

		execute(Route, args) {
			const instances = {},
				current = (this.current = this.executeRoute(
					Route,
					args || {},
					instances
				));
			this.currentRoute = Route;
			this.discardOldRoutes(instances);
			this.instances = instances;
			this.subject.next(current);
		}

		getPath(routeId, params) {
			const path = this.routes[routeId].path;

			params = params || cxl.router.current;

			return path && cxl.replaceParameters(path.toString(), params);
		}

		/**
		 * Normalizes path.
		 */
		path(path) {
			return path;
		}

		goPath(path) {
			if (path[0] === '#')
				window.location.hash = this.path(path.slice(1));
			else window.location = path;
		}

		go(routeId, params) {
			this.goPath('#' + this.getPath(routeId, params));
		}
	}

	directive('route', {
		initialize() {
			cxl.router.root = this.element;
		},

		update(hash) {
			var router = cxl.router,
				path = hash.slice(1),
				route = cxl.router.findRouteDefinition(path),
				args;

			if (route) {
				args =
					route.path &&
					route.path.parameters &&
					route.path.parameters.length
						? route.path.getArguments(path)
						: null;
				// Abstract routes that redirectTo to a children or other
				if (route.redirectTo) {
					path = router.getPath(route.redirectTo, args);
					route = cxl.router.routes[route.redirectTo];
				}

				router.href = path;
				router.execute(route, args);
			}
		}
	});

	directive('route.change', {
		connect() {
			this.bindings = [cxl.router.subject.subscribe(this.set.bind(this))];
		}
	});

	directive('route.path', {
		digest() {
			return cxl.router.getPath(this.parameters);
		}
	});

	directive('route.go', {
		update(id) {
			cxl.router.go(this.parameter || id);
		}
	});

	directive('route.link', {
		connect() {
			this.bindings = [
				cxl.router.subject.subscribe(this.updateActive.bind(this))
			];
		},

		updateActive() {
			const router = cxl.router;
			// TODO optimize?
			this.element.selected =
				this.href === router.href ||
				(router.instances[this.route] &&
					router.href.indexOf(this.href + '/') === 0) ||
				(router.currentRoute === router.defaultRoute &&
					this.route === router.defaultRoute.id);
		},

		update(param, state) {
			if (this.parameter) {
				state = param;
				param = this.parameter;
			}

			if (!param) return;

			const path = (this.href = cxl.router.getPath(param, state));

			if (path !== this.value) {
				this.element.href = '#' + path;
				this.route = param;

				if (cxl.router.current) this.updateActive();
			}

			return path;
		},

		digest(state) {
			return this.update(state);
		}
	});

	directive('route.title', {
		initialize() {
			this.bindings = [
				cxl.router.subject.subscribe(this.owner.digest.bind(this.owner))
			];
		},

		update(title) {
			this.owner.host.$$routeTitle = title;
			// TODO use different observable?
			if (cxl.router.current) cxl.router.subject.next(cxl.router.current);
		},

		digest() {
			return this.owner.host.$$routeTitle;
		}
	});

	component(
		{
			name: 'cxl-router-title',
			bindings: 'route.change:#render',
			template: `
<x &=".responsive">
	<a &=".link =href4:attribute(href) =title4:show:text"></a><x &=".link =title4:show">&gt;</x>
	<a &=".link =href3:attribute(href) =title3:show:text"></a><x &=".link =title3:show">&gt;</x>
	<a &=".link =href2:attribute(href) =title2:show:text"></a><x &=".link =title2:show">&gt;</x>
	<a &=".link =href1:attribute(href) =title1:show:text"></a><x &=".link =title1:show">&gt;</x>
</x>
<a &=".link =href0:attribute(href) =title0:text"></a>
	`,
			styles: {
				$: { lineHeight: 22, flexGrow: 1, font: 'title' },
				link: {
					display: 'inline-block',
					textDecoration: 'none',
					color: 'onPrimary',
					marginRight: 4
				},
				responsive: { display: 'none' },
				responsive$medium: { display: 'inline-block' }
			}
		},
		{
			render() {
				var current = cxl.router.current,
					i = 0,
					title,
					windowTitle,
					path;

				this.title0 = this.title1 = this.title2 = this.title3 = this.title4 = null;
				this.href0 = this.href1 = this.href2 = this.href3 = this.href4 =
					'';

				do {
					title = current.$$routeTitle;

					if (title) {
						windowTitle = windowTitle
							? windowTitle + ' - ' + title
							: title;
						this['title' + i] = title;
						path = cxl.router.getPath(current.$cxlRoute.id);
						this['href' + i] = path ? '#' + path : false;
						i++;
					}

					if (windowTitle) document.title = windowTitle;
				} while ((current = current.parentNode));
			}
		}
	);

	Object.assign(cxl, {
		router: new Router(),

		route(def, controller) {
			return cxl.router.registerRoute(new Route(def, controller));
		}
	});

	component({
		name: 'cxl-router',
		bindings: 'location:route'
	});

	component({
		name: 'cxl-router-appbar',
		template: `
<cxl-meta></cxl-meta>
<cxl-appbar>
	<cxl-navbar permanent &="content"></cxl-navbar>
	<cxl-router-title></cxl-router-title>
</cxl-appbar>
	`
	});

	component({
		name: 'cxl-router-content',
		styles: {
			content: {
				position: 'relative',
				flexGrow: 1,
				overflowY: 'auto',
				overflowScrolling: 'touch',
				backgroundColor: 'surface',
				color: 'onSurface'
			}
		}
	});

	component(
		{
			name: 'cxl-router-app',
			bindings: 'route.change:#onChange',
			template: `
<cxl-meta></cxl-meta>
<cxl-appbar &="=extendedTitle:@extended">
	<cxl-navbar permanent &="content"></cxl-navbar>
	<cxl-router-title &="=extendedTitle:@extended"></cxl-router-title>
</cxl-appbar>
<div &=".content role(main) id(content)">
	<div &=".router location:route"></div>
	<div &=".footer content(cxl-router-footer)"></div>
</div>
	`,
			styles: {
				$: { display: 'flex', flexDirection: 'column', height: '100%' },
				$large: { paddingLeft: 288 },
				content: {
					position: 'relative',
					flexGrow: 1,
					overflowY: 'auto',
					overflowScrolling: 'touch',
					backgroundColor: 'surface',
					color: 'onSurface',
					elevation: 0
				},
				router$marginless: { margin: 0 },
				footer: {},
				router: { margin: 16 },
				router$medium: { margin: 32 },
				router$large: { marginLeft: 64, marginRight: 64 },
				router$xlarge: { width: 1200 },
				router$xlarge$center: {
					marginLeft: 'auto',
					marginRight: 'auto'
				}
			}
		},
		{
			extendedTitle: false,
			onChange(route) {
				const def = route.$cxlRoute;

				this.extendedTitle =
					(def && def.title && def.title.extended) || false;
			}
		}
	);
})(this.cxl);
