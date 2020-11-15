import {
	Router as MainRouter,
	Strategies,
	RouterState,
	Strategy,
} from '../router/index.js';
import {
	Observable,
	Reference,
	combineLatest,
	defer,
	merge,
} from '../rx/index.js';
import {
	Augment,
	Attribute,
	Component,
	augment,
	bind,
	get,
} from '../component/index.js';
import {
	onAction,
	onReady,
	onHashChange,
	onChildrenMutation,
	onLocation,
} from '../dom/index.js';
import { AppbarTitle, Item } from './navigation.js';
import { dom } from '../tsx/index.js';
import { each, triggerEvent } from '../template/index.js';
import { StateStyles } from './core.js';
import { css } from '../css/index.js';

const router$ = new Reference<RouterState>();
const strategy$ = new Reference<Strategy>();
export const router = new MainRouter(state => router$.next(state));

interface RouteOptions {
	path: string;
	id?: string;
	parent?: string;
	redirectTo?: string;
}

export function Route(path: string | RouteOptions) {
	return (ctor: any) => {
		const options = typeof path === 'string' ? { path } : path;
		router.route({
			...options,
			render: () => dom(ctor),
		});
	};
}

export function DefaultRoute(path: string | RouteOptions = '') {
	return (ctor: any) => {
		const options = typeof path === 'string' ? { path } : path;
		router.route({
			...options,
			isDefault: true,
			render: () => dom(ctor),
		});
	};
}

export function routeIsActive(path: string) {
	return router$.map(state => state.url.path === path);
}

export function routerOutlet(host: HTMLElement) {
	let currentRoute: Node;
	return router$.tap(state => {
		const { url, root } = state;
		if (root.parentNode !== host) host.appendChild(root);
		else if (currentRoute && currentRoute !== root)
			host.removeChild(currentRoute);

		currentRoute = root;

		if (url.hash)
			host.querySelector(`a[name="${url.hash}"]`)?.scrollIntoView();
		else if (host.parentElement?.scrollTop)
			host.parentElement.scrollTo(0, 0);
	});
}

export function routerStrategy(
	getUrl: Observable<any>,
	strategy: Strategy = Strategies.query
) {
	return merge(
		defer(() => strategy$.next(strategy)),
		getUrl.tap(() => router.go(strategy.deserialize())),
		router$.tap(state => strategy.serialize(state.url))
	);
}

export function setDocumentTitle() {
	return router$.tap(state => {
		const title = [];
		let current: any = state.current;

		do {
			if (current.routeTitle) title.unshift(current.routeTitle);
		} while ((current = current.parentNode));

		document.title = title.join(' - ');
	});
}

export function Router(
	strategy: 'hash' | 'query' | 'path' | Strategy = Strategies.query,
	getUrl?: Observable<any>
) {
	const strategyObj =
		typeof strategy === 'string' ? Strategies[strategy] : strategy;
	const getter =
		getUrl ||
		(strategyObj === Strategies.hash ? onHashChange() : onLocation());

	return (ctor: any) => {
		augment(ctor, [
			bind((host: Component) =>
				merge(
					routerStrategy(getter, strategyObj),
					routerOutlet(host),
					setDocumentTitle()
				)
			),
		]);
	};
}

export function RouterTitle() {
	const routes = router$.map(state => {
		const result = [];
		let route: any = state.current;
		do {
			if (route.routeTitle) result.push(route);
		} while ((route = route.parentNode));

		return result;
	});

	return (
		<AppbarTitle>
			{each(routes, (route: any) => (
				<span>{route.routeTitle || ''}</span>
			))}
		</AppbarTitle>
	);
}

function renderTemplate(tpl: HTMLTemplateElement) {
	const result = document.createElement('div');
	result.appendChild(tpl.content.cloneNode(true));
	return result;
}

@Augment<RouterLink>(
	'cxl-router-link',
	host => (
		<a
			className="link"
			$={el =>
				merge(
					get(host, 'focusable').tap(
						val => (el.tabIndex = val ? 0 : -1)
					),
					combineLatest(strategy$, get(host, 'href')).tap(
						([strategy, val]) =>
							val !== undefined &&
							(el.href = strategy.getHref(val))
					),
					onAction(el).tap(ev => {
						ev.preventDefault();
						if (host.href) router.go(host.href);
					})
				)
			}
		>
			<slot />
		</a>
	),
	css({
		link: {
			outline: 0,
			textDecoration: 'none',
		},
	})
)
export class RouterLink extends Component {
	@Attribute()
	href?: string;
	@Attribute()
	focusable = false;
}

@Augment<RouterLink>(
	'cxl-a',
	css({
		$: { textDecoration: 'underline' },
		$focusWithin: { outline: 'var(--cxl-primary) auto 1px;' },
	})
)
export class A extends RouterLink {
	focusable = true;
}

@Augment<RouterItem>(
	'cxl-router-item',
	host => (
		<RouterLink className="link" href={get(host, 'href')}>
			<Item
				$={el =>
					router$.tap(() => {
						if (host.href !== undefined)
							el.selected = router.isActiveUrl(host.href);
					})
				}
			>
				<slot />
			</Item>
		</RouterLink>
	),
	css({
		$: {
			display: 'block',
		},
		link: {
			outline: 0,
			textDecoration: 'none',
		},
		$focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
		...StateStyles,
	}),
	bind(host => onAction(host).pipe(triggerEvent(host, 'drawer.close'))),
	bind(host =>
		get(host, 'disabled').tap(value =>
			host.setAttribute('aria-disabled', value ? 'true' : 'false')
		)
	)
)
export class RouterItem extends Component {
	@Attribute()
	href?: string;

	@Attribute()
	disabled = false;
}

@Augment<RouterOutlet>('cxl-router-outlet', bind(routerOutlet))
export class RouterOutlet extends Component {}

@Augment<RouterComponent>(
	'cxl-router',
	bind(host => {
		function register(el: HTMLTemplateElement) {
			if (el.dataset.registered) return;
			el.dataset.registered = 'true';
			const path = el.getAttribute('data-path') || '';

			router.route({
				path,
				isDefault: el.hasAttribute('data-default'),
				render: renderTemplate.bind(null, el),
			});
		}

		return onReady().switchMap(() => {
			for (const child of host.children)
				if (child.tagName === 'TEMPLATE') register(child as any);

			return merge(
				onChildrenMutation(host).tap(ev => {
					if (ev.type === 'added' && ev.value.tagName === 'TEMPLATE')
						register(ev.value);
				}),
				get(host, 'strategy').switchMap(strategyName => {
					const strategy = Strategies[strategyName];
					return routerStrategy(onLocation(), strategy);
				})
			);
		});
	})
)
export class RouterComponent extends Component {
	@Attribute()
	strategy: 'hash' | 'path' | 'query' = 'query';
}

/*
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
*/
