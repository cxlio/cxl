import { dom, Host } from '../xdom/index.js';
import { Augment, Attribute, Component, render } from '../component/index.js';
import { onChildrenMutation } from '../dom/index.js';
import { Style, padding } from '../css/index.js';
import { be } from '../rx/index.js';
import { T } from '../ui-ts/index.js';

@Augment(
	'cxl-docs-demo',
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
				},
				parent: {
					backgroundColor: 'onSurface12',
					...padding(16),
					paddingBottom: 0,
				},
				container: {
					display: 'block',
					borderStyle: 'none',
					marginLeft: 'auto',
					marginRight: 'auto',
					backgroundColor: 'background',
					width: 320,
					height: 180,
					overflowX: 'hidden',
					overflowY: 'hidden',
				},
				source: {
					font: 'monospace',
					...padding(16),
					whiteSpace: 'pre-wrap',
				},
			}}
		</Style>
	</Host>,
	render((host: ComponentDemo) => {
		const content$ = be('');
		function init(parent: HTMLIFrameElement) {
			return onChildrenMutation(host).tap(() => {
				const doc = parent.contentDocument;
				const content = host.childNodes[0].textContent || '';
				if (!doc) return;
				doc.open();
				doc.write(
					(host.debug
						? `<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui-ts/index.js');require('../../dist/ui-ts/icons.js');require('../../dist/docgen/runtime.js')</script>`
						: `<script src="runtime.bundle.min.js"></script>`) +
						`<cxl-meta></cxl-meta>${content}`
				);
				doc.close();
				content$.next(content);
			});
		}

		return (
			<div>
				<div className="parent">
					<iframe $={init} className="container" />
				</div>
				<T h6>Source</T>
				<div className="source">{content$}</div>
			</div>
		);
	})
)
export class ComponentDemo extends Component {
	@Attribute()
	component = '';

	/**
	 * Enable debug mode
	 */
	@Attribute()
	debug = false;
}
