///<amd-module name="@cxl/ui-ide/designer.js"/>
import {
	Augment,
	Attribute,
	StyleAttribute,
	Component,
	get,
} from '@cxl/component';
import { on, onResize, empty } from '@cxl/dom';
import { pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { of, merge } from '@cxl/rx';
import { triggerEvent } from '@cxl/template';
import { css } from '@cxl/ui/theme.js';

const DEBUG_HEAD = `<meta charset="utf-8">
<script src="/cxl/dist/tester/require-browser.js"></script>
<script>
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		);
	};
	require('@cxl/ui');
	require('@cxl/ui-router');
	require('@cxl/ui-www');
</script>
`;

@Augment<ElementSelector>(
	'ide-element-selector',
	css({
		$: {
			display: 'block',
			cursor: 'pointer',
			position: 'absolute',
			pointerEvents: 'none',
			outline: 'var(--cxl-primary) dotted 2px',
		},
		$solid: {
			outline: 'var(--cxl-secondary) solid 2px',
		},
	}),
	$ =>
		get($, 'value')
			.switchMap(value => (value ? onResize(value) : of(undefined)))
			.raf(() => {
				const rect = $.value?.getBoundingClientRect();
				if (rect) {
					$.style.display = '';
					$.style.left = rect.left + 'px';
					$.style.top = rect.top + 'px';
					$.style.height = rect.height + 'px';
					$.style.width = rect.width + 'px';
				} else $.style.display = 'none';
			})
)
export class ElementSelector extends Component {
	@Attribute()
	value?: Element;
	@StyleAttribute()
	solid = false;
}

function sanitizeChildren(node: Element | DocumentFragment, result: Element) {
	for (const child of node.childNodes) {
		const childNode = sanitize(child);
		if (childNode) result.appendChild(childNode);
	}
	return result;
}

function sanitize(node: Node): Node | undefined {
	if (node instanceof Element) {
		if (node.tagName && !node.tagName.startsWith('CXL-')) return;

		const result = node.cloneNode();
		(result as any).$$cxlSource = node;
		(node as any).$$cxlNode = result;
		return sanitizeChildren(node, result as Element);
	}

	return node.cloneNode();
}

@Augment<Designer>(
	'ide-designer',
	css({
		$: {
			display: 'block',
			backgroundColor: 'onSurface12',
			overflowY: 'auto',
		},
		iframe: {
			display: 'block',
			backgroundColor: 'surface',
			borderWidth: 0,
			pointerEvents: 'none',
			width: '100%',
			height: '100%',
		},
		container: {
			width: pct(94),
			marginTop: 32,
			marginLeft: 'auto',
			marginRight: 'auto',
			height: 'calc(100% - 32px)',
			position: 'relative',
		},
	}),
	$ => {
		const el = (
			<iframe
				tabIndex={-1}
				className="iframe"
				srcdoc={`${DEBUG_HEAD}<style>body{background-color:var(--cxl-background);}#cxl-designer-stage *{pointer-events:initial}</style><cxl-meta></cxl-meta><div id="cxl-designer-stage"></div>`}
			/>
		) as HTMLIFrameElement;
		const hover = (<ElementSelector />) as ElementSelector;
		const select = (<ElementSelector solid />) as ElementSelector;
		const container = (
			<div className="container">
				{el}
				{hover}
				{select}
			</div>
		);
		const tpl = $.template;

		$.bind(
			on(el, 'load').switchMap(() => {
				const doc = el.contentDocument;
				const stage = doc?.getElementById('cxl-designer-stage');
				if (!stage || !doc || !doc.defaultView)
					throw new Error('No window');

				function renderValue(src: string) {
					tpl.innerHTML = src;
					if (stage) {
						empty(stage);
						sanitizeChildren(tpl.content, stage);
					}
				}

				return merge(
					on(doc.body, 'keydown', { capture: true })
						.log()
						.tap(ev => ev.preventDefault()),
					get($, 'value').tap(renderValue),
					on(container, 'mousemove', {
						passive: true,
						capture: true,
					}).tap(ev => {
						const el = doc.elementFromPoint(ev.offsetX, ev.offsetY);
						hover.value = el && stage.contains(el) ? el : undefined;
						$.style.cursor = hover.value ? 'pointer' : '';
					}),
					on(container, 'mouseout').raf(
						() => (hover.value = undefined)
					),
					on(container, 'click').tap(ev => {
						const el = doc.elementFromPoint(ev.offsetX, ev.offsetY);
						$.selected = el && stage.contains(el) ? el : undefined;
					})
				);
			})
		);
		$.bind(
			get($, 'selected')
				.tap(selected => (select.value = selected))
				.pipe(triggerEvent($, 'selected'))
		);

		return container;
	}
)
export class Designer extends Component {
	@Attribute()
	value = '';

	@Attribute()
	selected?: Element;

	readonly template = (<template />) as HTMLTemplateElement;
}
