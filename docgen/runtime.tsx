import { dom } from '../xdom/index.js';
import {
	Augment,
	Attribute,
	Component,
	Host,
	render,
} from '../component/index.js';
import { Button, Field, Input } from '../ui/index.js';
import { Icon } from '../ui/icons.js';
import { onChildrenMutation } from '../dom/index.js';
import { Style, padding } from '../css/index.js';
import { be } from '../rx/index.js';
import '../ui/router.js';

@Augment(
	'docgen-demo',
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
				},
				parent: {
					backgroundColor: 'onSurface12',
				},
				container: {
					display: 'block',
					borderStyle: 'none',
					marginLeft: 'auto',
					marginRight: 'auto',
					backgroundColor: 'background',
					width: '100%',
					height: 180,
					overflowX: 'hidden',
					overflowY: 'hidden',
				},
				'@small': {
					container: {
						width: 320,
					},
					parent: {
						...padding(16),
						paddingBottom: 0,
					},
				},
				source: {
					font: 'monospace',
					...padding(16),
					whiteSpace: 'pre-wrap',
				},
			}}
		</Style>
	</Host>,
	render((host: DocgenDemo) => {
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
	<script>require('../../dist/ui/index.js');require('../../dist/ui/icons.js');require('../../dist/docgen/runtime.js')</script>`
						: `<script src="runtime.bundle.min.js"></script>`) +
						`<cxl-meta></cxl-meta>${content}`
				);
				doc.close();
				content$.next(content);
			});
		}

		return (
			<div className="parent">
				<iframe title="Demo" $={init} className="container" />
			</div>
		);
	})
)
export class DocgenDemo extends Component {
	@Attribute()
	component = '';

	/**
	 * Enable debug mode
	 */
	@Attribute()
	debug = false;
}

@Augment(
	'docgen-search',
	<Host>
		<Style>
			{{
				$: { display: 'flex' },
				input: { width: 200, display: 'none' },
				input$opened: { display: 'block' },
				'@medium': {
					input: { display: 'block' },
					button: { display: 'none' },
				},
			}}
		</Style>
		<Field>
			<Input className="input" />
			<Icon icon="search"></Icon>
		</Field>
		<Button className="button" flat primary>
			<Icon icon="search"></Icon>
		</Button>
	</Host>
)
export class DocgenSearch extends Component {
	@Attribute()
	opened = false;
}
