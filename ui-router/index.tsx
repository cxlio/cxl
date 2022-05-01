///<amd-module name="@cxl/ui-router"/>
import {
	Router as MainRouter,
	Strategies,
	RouterState,
	Strategy,
	getElementRoute,
	replaceParameters,
} from '@cxl/router';
import {
	EMPTY,
	Observable,
	Reference,
	combineLatest,
	observable,
	of,
	merge,
} from '@cxl/rx';
import {
	Augment,
	Attribute,
	Component,
	Span,
	augment,
	get,
} from '@cxl/component';
import {
	onAction,
	onReady,
	onHashChange,
	onChildrenMutation,
	onLocation,
	on,
	trigger,
} from '@cxl/dom';
import { AppbarTitle } from '@cxl/ui/appbar.js';
import { Item } from '@cxl/ui/item.js';
import { Tab } from '@cxl/ui/tabs.js';
import { dom } from '@cxl/tsx';
import { each, role, triggerEvent } from '@cxl/template';
import { StateStyles, css } from '@cxl/ui/theme.js';

const router$ = new Reference<RouterState>();
const strategy$ = new Reference<Strategy>();
export const router = new MainRouter(state => router$.next(state));
export const routerState = router$;

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
	return router$.map(() => router.isActiveUrl(path));
}

export function routerOutlet(host: HTMLElement) {
	let currentRoute: Node;
	return router$.tap(state => {
		const { url, root } = state;
		if (root.parentNode !== host) host.appendChild(root);
		else if (
			currentRoute &&
			currentRoute !== root &&
			currentRoute.parentNode
		)
			host.removeChild(currentRoute);

		currentRoute = root;

		if (url.hash)
			host.querySelector(`a[name="${url.hash}"]`)?.scrollIntoView();
		else if (host.parentElement && history.state?.lastAction !== 'pop')
			requestAnimationFrame(() => host.parentElement?.scrollTo(0, 0));
	});
}

export function routerStrategy(
	getUrl: Observable<any>,
	strategy: Strategy = Strategies.query
) {
	return merge(
		observable(() => strategy$.next(strategy)),
		getUrl.tap(() => router.go(strategy.deserialize())),
		router$
			.tap(state => strategy.serialize(state.url))
			// Prevent routing errors in iframes. Ignore other errors.
			.catchError((e, source) =>
				e.name === 'SecurityError' ? EMPTY : source
			)
	);
}

export function setDocumentTitle() {
	return router$
		.switchMap(state => {
			const result = [];
			let current: any = state.current;

			do {
				const title = current.routeTitle;
				if (title)
					result.unshift(
						title instanceof Observable ? title : of(title)
					);
			} while ((current = current.parentNode));

			return combineLatest(...result);
		})
		.tap(title => (document.title = title.join(' - ')));
}

export function initializeRouter(
	host: Component,
	strategy: 'hash' | 'query' | 'path' | Strategy = Strategies.query,
	getUrl?: Observable<any>
) {
	const strategyObj =
		typeof strategy === 'string' ? Strategies[strategy] : strategy;
	const getter =
		getUrl ||
		(strategyObj === Strategies.hash ? onHashChange() : onLocation());

	return merge(
		routerStrategy(getter, strategyObj),
		routerOutlet(host),
		setDocumentTitle()
	);
}

export function Router(
	strategy: 'hash' | 'query' | 'path' | Strategy = Strategies.query,
	getUrl?: Observable<any>
) {
	return (ctor: any) => {
		augment(ctor, [
			(host: Component) => initializeRouter(host, strategy, getUrl),
		]);
	};
}

const routeTitles = router$.raf().map(state => {
	const result = [];
	let route: any = state.current;
	do {
		if (route.routeTitle)
			result.unshift({
				title: route.routeTitle,
				first: route === state.current,
				path: routePath(route),
			});
	} while ((route = route.parentNode));

	return result;
});

function routePath(routeEl: HTMLElement) {
	const route = getElementRoute(routeEl);
	return (
		route &&
		replaceParameters(
			route.path?.toString() || '',
			router.state?.arguments || {}
		)
	);
}

export function RouterTitle() {
	function renderLink(route: any) {
		return route.first ? (
			<Span>{route.title}</Span>
		) : (
			<span slot="parent">
				<RouterLink href={route.path}>{route.title}</RouterLink>
				&nbsp;/&nbsp;
			</span>
		);
	}

	return <AppbarTitle>{each(routeTitles, renderLink)}</AppbarTitle>;
}

@Augment(
	'cxl-router-appbar-title',
	css({ $: { display: 'contents' } }),
	RouterTitle
)
export class RouterAppbarTitle extends Component {}

function renderTemplate(tpl: HTMLTemplateElement, title?: string) {
	const result = document.createElement('div');
	result.style.display = 'contents';
	(result as any).routeTitle = title;
	result.appendChild(tpl.content.cloneNode(true));
	return result;
}

@Augment<RouterLink>(
	'cxl-router-link',
	host => {
		const el = (
			<a className="link">
				<slot />
			</a>
		) as HTMLAnchorElement;
		host.bind(
			merge(
				get(host, 'focusable').tap(val => (el.tabIndex = val ? 0 : -1)),
				combineLatest(
					strategy$,
					get(host, 'href'),
					get(host, 'external')
				).tap(
					([strategy, val, ext]) =>
						val !== undefined &&
						(el.href = ext ? val : strategy.getHref(val))
				),
				onAction(el).tap(ev => {
					ev.preventDefault();
					if (host.href !== undefined)
						if (host.external) location.assign(host.href);
						else router.go(host.href);
				})
			)
		);
		return el;
	},
	css({
		$: { display: 'contents' },
		link: {
			outline: 0,
			textDecoration: 'none',
			color: 'inherit',
			cursor: 'pointer',
		},
	})
)
export class RouterLink extends Component {
	@Attribute()
	href?: string;
	@Attribute()
	focusable = false;
	@Attribute()
	external = false;
}

@Augment<RouterTab>(
	'cxl-router-tab',
	role('tab'),
	css({
		$: { flexGrow: 1 },
	}),
	$ => (
		<RouterLink href={get($, 'href')}>
			<Tab
				$={el =>
					on(el, 'cxl-tab.selected').tap(() =>
						trigger($, 'cxl-tab.selected', el)
					)
				}
				selected={get($, 'href').switchMap(routeIsActive)}
			>
				<slot />
			</Tab>
		</RouterLink>
	)
)
export class RouterTab extends Component {
	@Attribute()
	href = '';
}

@Augment<A>(
	'cxl-router-a',
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
		...StateStyles,
	}),
	host => onAction(host).pipe(triggerEvent(host, 'drawer.close')),
	host =>
		get(host, 'disabled').tap(value =>
			host.setAttribute('aria-disabled', value ? 'true' : 'false')
		)
)
export class RouterItem extends Component {
	@Attribute()
	href?: string;

	@Attribute()
	disabled = false;

	focus() {
		(this.shadowRoot?.querySelector('cxl-item') as Item)?.focus();
	}
}

@Augment<RouterOutlet>('cxl-router-outlet', routerOutlet)
export class RouterOutlet extends Component {}

@Augment<RouterComponent>('cxl-router', host => {
	function register(el: HTMLTemplateElement) {
		const dataset = el.dataset;
		if (dataset.registered) return;
		dataset.registered = 'true';
		const title = dataset.title || undefined;

		router.route({
			path: dataset.path,
			id: dataset.id || undefined,
			parent: dataset.parent || undefined,
			isDefault: el.hasAttribute('data-default'),
			render: renderTemplate.bind(null, el, title),
		});
	}

	return onReady().switchMap(() => {
		for (const child of Array.from(host.children))
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
export class RouterComponent extends Component {
	@Attribute()
	strategy: 'hash' | 'path' | 'query' = 'query';
}
