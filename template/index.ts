///<amd-module name="@cxl/template"/>
import { EMPTY, ListEvent, Observable, observable } from '@cxl/rx';
import { onAction } from '@cxl/dom';

import type { Bindable } from '@cxl/tsx';

export function sortBy<T, K extends keyof T = keyof T>(key: K) {
	return (a: T, b: T) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
}

export function getSearchRegex(term: string, flags = 'i') {
	try {
		return new RegExp(term, flags);
	} catch (e) {
		return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
	}
}

/*
 * Portal
 */
const portals = new Map<string, HTMLElement>();

export function portal(id: string) {
	return (el: HTMLElement) => {
		portals.set(id, el);
		return new Observable(() => () => portals.delete(id));
	};
}

export function teleport(el: Node, portalName: string) {
	return new Observable<HTMLElement>(subs => {
		requestAnimationFrame(() => {
			const portal = portals.get(portalName);
			if (!portal)
				throw new Error(`Portal "${portalName}" does not exist`);
			portal.appendChild(el);
			subs.next(portal);
		});
		return () => el.parentElement?.removeChild(el);
	});
}

export class Marker {
	children: Node[] = [];
	node = document.createComment('marker');

	insert(content: Node, nextNode: Node = this.node) {
		if (content instanceof DocumentFragment) {
			this.children.push(...content.childNodes);
		} else this.children.push(content);
		this.node.parentNode?.insertBefore(content, nextNode);
	}

	remove(node: Node) {
		const index = this.children.indexOf(node);
		if (index === -1) throw new Error('node not found');
		this.children.splice(index, 1);
		const parent = this.node.parentNode;
		if (!parent) return;
		parent.removeChild(node);
	}

	empty() {
		const parent = this.node.parentNode;
		if (!parent) return;
		this.children.forEach(snap => parent.removeChild(snap));
		this.children.length = 0;
	}
}

export function list<T, K>(
	source: Observable<ListEvent<T, K>>,
	renderFn: (item: T) => Node,
) {
	return (host: Bindable) => {
		const marker = new Marker();
		const map = new Map<K, Node | Node[]>();
		host.bind(
			source.tap(ev => {
				if (ev.type === 'insert') {
					const node = renderFn(ev.item);
					map.set(
						ev.key,
						node instanceof DocumentFragment
							? Array.from(node.childNodes)
							: node,
					);
					marker.insert(node);
				} else if (ev.type === 'remove') {
					const node = map.get(ev.key);
					if (Array.isArray(node))
						node.forEach(n => marker.remove(n));
					else if (node) marker.remove(node);
				} else if (ev.type === 'empty') marker.empty();
			}),
		);
		return marker.node;
	};
}

export function render<T>(
	source: Observable<T>,
	renderFn: (item: T) => Node,
	loading?: () => Node,
	error?: (e: unknown) => Node,
) {
	return (host: Bindable) => {
		const marker = new Marker();
		if (loading)
			host.bind(
				observable(() => {
					marker.insert(loading());
				}),
			);

		host.bind(
			source
				.tap(item => {
					marker.empty();
					marker.insert(renderFn(item));
				})
				.catchError(e => {
					if (error) {
						marker.empty();
						marker.insert(error(e));
						return EMPTY;
					}
					throw e;
				}),
		);

		return marker.node;
	};
}

export function each<T>(
	source: Observable<Iterable<T>>,
	renderFn: (item: T, index: number, source: Iterable<T>) => Node | undefined,
	empty?: () => Node,
) {
	const marker = new Marker();

	return (host: Bindable) => {
		host.bind(
			source.tap(arr => {
				marker.empty();
				let len = 0;
				for (const item of arr) {
					const node = renderFn(item, len, arr);
					if (node) {
						marker.insert(node);
						len++;
					}
				}
				if (empty && len === 0) marker.insert(empty());
			}),
		);

		return marker.node;
	};
}

export function $onAction<T extends Element>(
	cb: (ev: KeyboardEvent | MouseEvent) => void,
) {
	return (el: T) => onAction(el).tap(cb);
}

/*
export function staticTemplate(template: () => Node) {
	let rendered: Node;
	return () => {
		return (rendered || (rendered = template())).cloneNode(true);
	};
}
*/

const ENTITIES_REGEX = /[&<>]/g,
	ENTITIES_MAP = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
	};

export function escapeHtml(str: string) {
	return (
		str &&
		str.replace(
			ENTITIES_REGEX,
			e => ENTITIES_MAP[e as keyof typeof ENTITIES_MAP] || '',
		)
	);
}
