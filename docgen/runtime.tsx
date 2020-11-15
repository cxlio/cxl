import { dom } from '../tsx/index.js';
import { Augment, Attribute, Component, get } from '../component/index.js';
import { onAction, onChildrenMutation } from '../dom/index.js';
import { css, padding } from '../css/index.js';
import { EMPTY, be } from '../rx/index.js';
import '../ui/theme.js';
import '../ui/router.js';
import { Tabs, Tab } from '../ui/navigation.js';

declare const docgen: { userScripts: string[] };

const UserScripts = docgen.userScripts
	.map(src => `<script src="${src}"></script>`)
	.join('');

@Augment('doc-example', host => (
	<div
		$={div =>
			onChildrenMutation(host).tap(() => {
				const content = host.childNodes[0].textContent || '';
				div.innerHTML = content;
			})
		}
	/>
))
export class DocExample extends Component {}

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
			height: 220,
			overflowX: 'hidden',
			overflowY: 'hidden',
		},
		'@small': {
			container: {
				width: 320,
			},
			desktop: {
				width: '100%',
				marginTop: -16,
				height: 236,
			},
			parent: {
				paddingTop: 16,
			},
		},
		source: {
			display: 'none',
			font: 'monospace',
			...padding(16),
			height: 236,
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
				const doc = parent.contentDocument;
				const content = host.childNodes[0]?.textContent?.trim() || '';
				if (!doc) return EMPTY;
				doc.open();
				doc.write(
					`<style>body{margin:16px;}</style>${UserScripts}${content}`
				);
				doc.close();
				content$.next(content);
			});
		}

		function updateView(val: string) {
			const isDesktop = val === 'desktop';
			iframeClass.next(isDesktop ? 'container desktop' : 'container');
		}

		host.bind(get(host, 'view').tap(updateView));

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
				<div
					className={view.map(v =>
						v === 'source' ? 'parent' : 'parent visible'
					)}
				>
					<iframe title="Demo" $={init} className={iframeClass} />
				</div>
				<div
					className={view.map(v =>
						v === 'source' ? 'source visible' : 'source'
					)}
				>
					{content$}
				</div>
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
