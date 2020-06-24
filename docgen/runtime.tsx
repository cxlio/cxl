import { dom, Host } from '../xdom/index.js';
import { Augment, Attribute, Component, render } from '../component/index.js';
import { onChildrenMutation } from '../dom/index.js';
//import { defer } from '../rx/index.js';
import { Style, padding } from '../css/index.js';
// import META from '../ui-ts/meta.js';

@Augment(
	'cxl-docs-demo',
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
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
			}}
		</Style>
	</Host>,
	render((host: ComponentDemo) => {
		function init(parent: HTMLIFrameElement) {
			return onChildrenMutation(host).tap(() => {
				const doc = parent.contentDocument;
				const content = host.childNodes[0].textContent;
				if (!doc) return;
				doc.open();
				doc.write(
					`<script src="runtime.bundle.min.js"></script><cxl-meta></cxl-meta>${content}`
				);
				doc.close();
			});
		}

		return <iframe $={init} className="container" />;
	})
)
export class ComponentDemo extends Component {
	@Attribute()
	component = '';
}
