import { dom, Host } from '../xdom/index.js';
import {
	Augment,
	Attribute,
	Component,
	get,
	render,
} from '../component/index.js';
import { Style, padding } from '../css/index.js';
import { tap } from '../rx/index.js';
import META from '../ui-ts/meta.js';

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
					marginLeft: 'auto',
					marginRight: 'auto',
					backgroundColor: 'background',
					width: 320,
					height: 180,
				},
			}}
		</Style>
	</Host>,
	render((host: ComponentDemo) => {
		function init(parent: HTMLElement) {
			return get(host, 'component').pipe(
				tap((tagName: string) => {
					if (tagName) {
						const el = document.createElement(tagName);
						parent.appendChild(el);
						const meta = META.components[tagName];
						if (meta && meta.demo) {
							el.innerHTML = meta.demo.content;
						}
					}
				})
			);
		}

		return <div $={init} className="container" />;
	})
)
export class ComponentDemo extends Component {
	@Attribute()
	component = '';
}
