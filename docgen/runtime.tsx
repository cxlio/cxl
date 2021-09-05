///<amd-module name="@cxl/docgen/runtime"/>
import { dom } from '@cxl/tsx';
import '@cxl/ui/theme.js';
import { Augment, Attribute, Component, get } from '@cxl/component';
import { onAction, onChildrenMutation } from '@cxl/dom';
import { border, padding } from '@cxl/css';
import { be, merge } from '@cxl/rx';
import { Span } from '@cxl/ui/core.js';
import { Tabs, Tab } from '@cxl/ui/tabs.js';
import { SelectBox, Option } from '@cxl/ui/select.js';
import { each, onValue } from '@cxl/template/index.js';
import { AppbarSearch } from '@cxl/ui/appbar-search.js';
import { C, Card } from '@cxl/ui/layout.js';
import { RouterItem } from '@cxl/ui-router';
import { css } from '@cxl/ui/theme.js';
import '@cxl/ui/navigation.js';
import '@cxl/ui/badge.js';
import '@cxl/ui/chip.js';

import type { RuntimeConfig } from './render.js';

declare const docgen: RuntimeConfig;

const UserScripts =
	docgen.userScripts?.map(src => `<script src="${src}"></script>`).join('') ||
	'';

@Augment('doc-example', host => (
	<Span
		$={div =>
			onChildrenMutation(host).tap(() => {
				const content = host.childNodes[0].textContent || '';
				div.innerHTML = content;
			})
		}
	/>
))
export class DocExample extends Component {}

@Augment<DocVersionSelect>(
	'doc-version-select',
	css({
		select: { verticalAlign: 'bottom' },
	}),
	$ => (
		<SelectBox $={el => onValue(el).tap($.onValue)} className="select">
			{docgen.versions?.map(v => (
				<Option selected={docgen.activeVersion === v} value={v}>
					{v}
				</Option>
			))}
		</SelectBox>
	)
)
export class DocVersionSelect extends Component {
	onValue(version: string) {
		if (version !== docgen.activeVersion) window.location.href = version;
	}
}

@Augment<DocDemo>(
	'doc-demo',
	css({
		$: {
			display: 'block',
		},
		parent: {
			display: 'none',
			backgroundColor: 'onSurface12',
		},
		container: {
			display: 'block',
			borderStyle: 'none',
			marginLeft: 'auto',
			marginRight: 'auto',
			backgroundColor: 'background',
			width: '100%',
			height: 160,
			overflowX: 'hidden',
			overflowY: 'hidden',
		},
		'@small': {
			container: {
				width: 320,
				...border(16, 0, 0, 0),
				borderColor: 'onSurface12',
				borderStyle: 'solid',
			},
			desktop: {
				width: '100%',
				...border(0),
			},
		},
		source: {
			display: 'none',
			font: 'monospace',
			...padding(16),
			whiteSpace: 'pre-wrap',
			overflowY: 'auto',
			minHeight: 160,
		},
		visible: { display: 'block' },
		toolbar: {
			textAlign: 'right',
		},
	}),
	host => {
		const content$ = be('');
		const view = get(host, 'view');
		const iframeClass = be('container');

		function init(parent: HTMLIFrameElement) {
			const content = host.childNodes[0]?.textContent?.trim() || '';
			parent.srcdoc = `<!DOCTYPE html><style>body{padding:12px;margin:0;}</style>${UserScripts}${content}`;
			parent.onload = () => {
				const observer = new ResizeObserver(() => {
					const height = parent.contentDocument?.body.scrollHeight;
					if (height && height > 160)
						parent.style.height = height + 'px';
				});
				if (parent.contentDocument?.body)
					observer.observe(parent.contentDocument.body);
			};
			content$.next(content);
		}

		function updateView(val: string) {
			const isDesktop = val === 'desktop';
			iframeClass.next(isDesktop ? 'container desktop' : 'container');
		}

		host.bind(get(host, 'view').tap(updateView));
		const iframeEl = (<iframe title="Demo" />) as HTMLIFrameElement;
		(iframeEl as any).loading = 'lazy';
		init(iframeEl);
		host.bind(onChildrenMutation(host).tap(() => init(iframeEl)));
		host.bind(iframeClass.tap(val => (iframeEl.className = val)));

		return (
			<>
				<Tabs>
					<Tab
						$={el =>
							onAction(el).tap(() => (host.view = 'desktop'))
						}
						selected={view.is('desktop')}
					>
						Desktop
					</Tab>
					<Tab
						$={el => onAction(el).tap(() => (host.view = 'mobile'))}
						selected={view.is('mobile')}
					>
						Mobile
					</Tab>
					<Tab
						$={el => onAction(el).tap(() => (host.view = 'source'))}
						selected={view.is('source')}
					>
						Source
					</Tab>
				</Tabs>
				<Span
					className={view.map(v =>
						v === 'source' ? 'parent' : 'parent visible'
					)}
				>
					{iframeEl}
				</Span>
				<Span
					className={view.map(v =>
						v === 'source' ? 'source visible' : 'source'
					)}
				>
					{content$}
				</Span>
			</>
		);
	}
)
export class DocDemo extends Component {
	@Attribute()
	view: 'desktop' | 'mobile' | 'source' = 'desktop';

	/**
	 * Enable debug mode
	 */
	@Attribute()
	debug = false;
}

@Augment(
	'doc-search',
	css({
		$: { position: 'relative' },
		card: {
			display: 'none',
			position: 'absolute',
			right: 0,
			maxHeight: 200,
			overflowY: 'auto',
		},
		card$focusWithin: { display: 'block' },
	}),
	$ => {
		const results = be<Iterable<Element>>([]);
		let router: HTMLElement | null;

		const card = (
			<Card
				$={el => onAction(el).raf(() => $.blur())}
				pad={16}
				className="card"
				color="surface"
			>
				{each(
					results,
					(r: any) => (
						<RouterItem href={r.dataset.path}>
							{r.dataset.title}
						</RouterItem>
					),
					() => (
						<C pad={16}>No Results Found</C>
					)
				)}
			</Card>
		) as Card;

		function search(val: string) {
			//card.style.display = val ? 'block' : 'none';
			if (val) {
				router =
					router || (router = document.querySelector('cxl-router'));
				if (!router) return;
				const result = router.querySelectorAll(
					`[data-title*="${val}"i]`
				);
				results.next(result);
			} else results.next([]);
		}

		return (
			<>
				<AppbarSearch
					$={el =>
						merge(
							//on(el, 'blur').tap(() => (card.style.display = '')),
							get(el, 'value').raf(search)
						)
					}
				/>
				{card}
			</>
		);
	}
)
export class DocSearch extends Component {}
