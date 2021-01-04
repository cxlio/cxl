import { dom } from '@cxl/tsx';
import { Augment, Attribute, Component, get } from '@cxl/component';
import { onAction, onChildrenMutation } from '@cxl/dom';
import { border, css, padding } from '@cxl/css';
import { be } from '@cxl/rx';
import '@cxl/ui/theme.js';
import '@cxl/ui/router.js';
import { Span } from '@cxl/ui/core.js';
import { Tabs, Tab } from '@cxl/ui/navigation.js';
import { SelectBox, Option } from '@cxl/ui/select.js';
import { onValue } from '@cxl/template/index.js';

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
			return onChildrenMutation(host).tap(() => {
				const content = host.childNodes[0]?.textContent?.trim() || '';
				parent.srcdoc = `<style>body{padding:16px;margin:0;}</style>${UserScripts}${content}`;
				parent.onload = () => {
					const height = parent.contentDocument?.body.scrollHeight;
					if (height && height > 160)
						parent.style.height = height + 'px';
				};
				content$.next(content);
			});
		}

		function updateView(val: string) {
			const isDesktop = val === 'desktop';
			iframeClass.next(isDesktop ? 'container desktop' : 'container');
		}

		host.bind(get(host, 'view').tap(updateView));
		const iframeEl = (<iframe title="Demo" />) as HTMLIFrameElement;
		host.bind(init(iframeEl));
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
