import { Router as MainRouter, RouteDefinition } from '../router/index.js';
import { Observable, map } from '../rx/index.js';
import { augment, bind } from '../component/index.js';
import { dom } from '../xdom/index.js';
import { AppbarTitle } from './navigation.js';
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
	const routes = defaultRouter.subject.pipe(
		map((route: any) => {
			const result = [];
			do {
				if (route.routeTitle) result.push(route);
			} while ((route = route.parentNode));

			return result;
		})
	);

	return (
		<AppbarTitle>
			{list(routes, (route: any) => (
				<span>{route.routeTitle || ''}</span>
			))}
		</AppbarTitle>
	);
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
