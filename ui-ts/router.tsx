import { Router as MainRouter, RouteDefinition } from '../router/index.js';
import { Observable, tap } from '../rx/index.js';
import { dom } from '../xdom/index.js';
import { bind, augment } from '../component/index.js';

const routes: RouteDefinition<any>[] = [];

export function Route(path: string) {
	return (ctor: any) => {
		routes.push({
			path,
			render: dom(ctor)
		});
	};
}

export function DefaultRoute(path = '') {
	return (ctor: any) => {
		routes.push({
			path,
			isDefault: true,
			render: dom(ctor)
		});
	};
}

export function Router(strategy: Observable<string>) {
	return (ctor: any) => {
		augment(ctor, [
			bind((host: any) => {
				const defaultRouter = new MainRouter(host);
				routes.forEach(r => defaultRouter.route(r));
				return strategy.pipe(tap(url => defaultRouter.go(url)));
			})
		]);
	};
}
