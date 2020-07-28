import {
	Router as MainRouter,
	Strategies,
	RouterState,
	Strategy,
} from '../router/index.js';
import { Observable, Reference, combineLatest, merge } from '../rx/index.js';
import {
	Attribute,
	Augment,
	Component,
	augment,
	bind,
	get,
} from '../component/index.js';
import { dom } from '../xdom/index.js';
import { on, onReady, onChildrenMutation, onLocation } from '../dom/index.js';
import { AppbarTitle, Item } from './navigation.js';
import { list, onAction, triggerEvent } from '../template/index.js';
import { StateStyles } from './core.js';
import { Style } from '../css/index.js';

const router$ = new Reference<RouterState>();
const strategy$ = new Reference<Strategy>();
const router = new MainRouter(state => router$.next(state));

export function Route(path: string) {
	return (ctor: any) => {
		router.route({
			path,
			render: dom(ctor),
		});
	};
}

export function DefaultRoute(path = '') {
	return (ctor: any) => {
		router.route({
			path,
			isDefault: true,
			render: dom(ctor),
		});
	};
}

export function routerOutlet(host: HTMLElement) {
	let currentRoute: Element;
	return router$.tap(state => {
		const { url, root } = state;
		if (root.parentNode !== host) host.appendChild(root);
		else if (currentRoute && currentRoute !== root)
			host.removeChild(currentRoute);

		currentRoute = root;

		if (url.hash)
			host.querySelector(`a[name="${url.hash}"]`)?.scrollIntoView();
		else host.parentElement?.scrollTo(0, 0);
	});
}

export function routerStrategy(
	getUrl: Observable<any> = onLocation(),
	strategy: Strategy = Strategies.query
) {
	return merge(
		getUrl.tap(() => router.go(strategy.deserialize())),
		router$.tap(state => strategy.serialize(state.url))
	);
}

export function Router(
	getUrl: Observable<any> = onLocation(),
	strategy: Strategy = Strategies.query
) {
	return (ctor: any) => {
		augment(ctor, [
			bind((host: Component) =>
				merge(routerStrategy(getUrl, strategy), routerOutlet(host))
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
			{list(routes, (route: any) => (
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
	<Style>
		{{
			$: {
				textDecoration: 'underline',
			},
			$focusWithin: { outline: 'var(--cxl-primary) auto 1px;' },
			link: {
				outline: 0,
				textDecoration: 'none',
			},
		}}
	</Style>,
	<a
		className="link"
		$={(el, host) =>
			merge(
				combineLatest(strategy$, get(host, 'href')).tap(
					([strategy, val]) =>
						val !== undefined && (el.href = strategy.getHref(val))
				),
				on(el, 'click').tap(ev => {
					ev.preventDefault();
					router.go(host.href);
				})
			)
		}
	>
		<slot />
	</a>
)
export class RouterLink extends Component {
	@Attribute()
	href?: string;
}

@Augment<RouterItem>(
	'cxl-router-item',
	<Style>
		{{
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
		}}
	</Style>,
	<RouterLink className="link" href={(_el, host) => get(host, 'href')}>
		<Item
			$={(el, host: RouterItem) =>
				router$.tap(() => {
					if (host.href !== undefined)
						el.selected = router.isActiveUrl(host.href);
				})
			}
		>
			<slot />
		</Item>
	</RouterLink>,
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

		return merge(
			onChildrenMutation(host).tap(ev => {
				if (ev.type === 'added' && ev.value.tagName === 'TEMPLATE')
					register(ev.value);
			}),
			onReady().switchMap(() =>
				get(host, 'strategy').switchMap(strategyName => {
					const strategy = Strategies[strategyName];
					strategy$.next(strategy);
					return routerStrategy(onLocation(), strategy);
				})
			)
		);
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
