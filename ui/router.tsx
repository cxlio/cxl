import {
	Router as MainRouter,
	RouteDefinition,
	parseUrl,
} from '../router/index.js';
import { Observable, merge } from '../rx/index.js';
import {
	Attribute,
	Augment,
	Component,
	augment,
	bind,
} from '../component/index.js';
import { dom } from '../xdom/index.js';
import { on, onChildrenMutation, onLocation } from '../dom/index.js';
import { AppbarTitle, Item } from './navigation.js';
import { list } from '../template/index.js';

const routes: RouteDefinition<any>[] = [];
let defaultRouter: MainRouter;

export function Route(path: string) {
	return (ctor: any) => {
		routes.push({
			path,
			render: dom(ctor),
		});
	};
}

export function DefaultRoute(path = '') {
	return (ctor: any) => {
		routes.push({
			path,
			isDefault: true,
			render: dom(ctor),
		});
	};
}

export function Router(strategy: Observable<string>) {
	return (ctor: any) => {
		augment(ctor, [
			bind((host: any) => {
				defaultRouter = new MainRouter(host);
				routes.forEach(r => defaultRouter.route(r));
				return strategy.tap(url => defaultRouter.go(url));
			}),
		]);
	};
}

export function RouterTitle() {
	const routes = defaultRouter.subject.map((route: any) => {
		const result = [];
		do {
			if (route.routeTitle) result.push(route);
		} while ((route = route.parentNode));

		return result;
	});

	return (
		<AppbarTitle>
			{list(routes, (route: any) => (
				<span>{route.title || ''}</span>
			))}
		</AppbarTitle>
	);
}

function renderTemplate(tpl: HTMLTemplateElement) {
	const result = document.createElement('div');
	result.appendChild(tpl.content.cloneNode(true));
	return result;
}

@Augment<RouterItem>(
	'cxl-router-item',
	bind(host =>
		onLocation()
			.debounceTime()
			.tap(() => {
				const current = defaultRouter?.currentRoute;
				if (current && host.href !== undefined) {
					const url = parseUrl(host.href);
					host.selected = current.path?.test(url.path) || false;
				}
			})
	)
)
export class RouterItem extends Item {}

@Augment<RouterLink>(
	'cxl-router-link',
	bind(host =>
		on(host, 'click').tap(ev => {
			if (ev.target && 'href' in ev.target) {
				const el = ev.target as any;
				const href =
					el.tagName === 'A' ? el.getAttribute('href') : el.href;
				ev.preventDefault();
				defaultRouter.go(href);
			}
		})
	)
)
export class RouterLink extends Component {}

@Augment<RouterOutlet>(
	'cxl-router-outlet',
	bind(host => {
		const router = host.router;
		routes.forEach(r => router.route(r));

		return merge(
			on(window, 'load').tap(() =>
				router.go(location.search.slice(1) + location.hash)
			),
			on(window, 'popstate').tap(() => router.go(history.state.href)),
			router.subject.tap(() => {
				const href = router.currentUrl;
				history.pushState({ href }, '', `?${href}`);
				if (host.autoScroll) host.parentElement?.scroll(0, 0);
			})
		);
	})
)
export class RouterOutlet extends Component {
	@Attribute()
	autoScroll = true;

	router = (defaultRouter = new MainRouter(this));
}

@Augment<RouterComponent>(
	'cxl-router',
	bind(host =>
		onChildrenMutation(host).tap(ev => {
			if (ev.type === 'added' && ev.value.tagName === 'TEMPLATE') {
				const el = ev.value as HTMLTemplateElement;
				const path = el.getAttribute('data-path') || '';
				const route = {
					path,
					isDefault: el.hasAttribute('data-default'),
					render: renderTemplate.bind(null, el),
				};

				if (defaultRouter) defaultRouter.route(route);
				else routes.push(route);
			}
		})
	)
)
export class RouterComponent extends Component {}

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
