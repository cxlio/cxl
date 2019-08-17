/*jshint esnext:true */
((cxl, hljs) => {
	'use strict';

	const LOREM_SHORT =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
		component = cxl.component,
		LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris at elementum orci. Vestibulum facilisis vel risus a commodo. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris velit sapien, dignissim quis fermentum a, porta at urna. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`;
	hljs.configure({ tabReplace: '    ' });

	component(
		{
			name: 'docs-link',
			attributes: ['anchor'],
			template:
				'<a href="#" &=".link action:#onAction:event.prevent content"></a>',
			styles: {
				link: { color: 'link', whiteSpace: 'nowrap' }
			}
		},
		{
			onAction() {
				cxl.anchor(this.anchor).focus();
			}
		}
	);

	component({
		name: 'docs-bg',
		styles: {
			$: { background: '#eee', elevation: 1 }
		}
	});

	component(
		{
			name: 'docs-directive-update',
			attributes: ['directive'],
			bindings: 'connect:#connect',
			template: `
<cxl-card>
	<cxl-block>
	<cxl-form-group>
		<cxl-label>Input</cxl-label>
		<cxl-input &="value:=input:#doUpdate"></cxl-input>
	</cxl-form-group>
	<cxl-form-group>
		<cxl-label>Parameter</cxl-label>
		<cxl-input &="value:=parameter:#doUpdate"></cxl-input>
	</cxl-form-group>
	<cxl-form-group>
		<cxl-label>Output</cxl-label>
		<cxl-input &="=output:@value" readonly></cxl-input>
	</cxl-form-group>
	</cxl-block>
</cxl-card>
	`
		},
		{
			oldParameter: null,

			connect(val, host) {
				this.$view = host.$view;
				this.doUpdate();
			},

			doUpdate() {
				if (this.parameter !== this.oldParameter) {
					const Directive = cxl.compiler.directives[this.directive];

					if (this.instance) this.instance.destroy();

					this.instance = new Directive(
						this.element,
						this.parameter,
						this.$view
					);
					this.instance.subscribe(
						new cxl.compiler.directives.refval(
							this,
							'output',
							this.$view
						)
					);
				}

				this.instance.next(this.input);
			}
		}
	);

	component(
		{
			name: 'docs-mdn',
			attributes: ['href'],
			template: '<a &="=href:#setHref content .link"></a>',
			styles: {
				$: { display: 'inline' },
				link: { color: 'link', font: 'code' }
			}
		},
		{
			setHref(href, el) {
				if (href)
					el.href =
						'https://developer.mozilla.org/en-US/docs/Web/' + href;
			}
		}
	);

	component({
		name: 'docs-implementation',
		template: `
<cxl-t h5>Implementation Details</cxl-t>
<div &="content"></div>
	`
	});

	component(
		{
			name: 'docs-directive',
			attributes: ['name'],
			template: `
<h2>Basic Usage</h2>
<div &="content(docs-demo, docs-usage)"></div>
<div &="=update:show">
	<h2>update</h2>
	<div &="content(docs-directive-update)"></div>
</div>
<div &="=digest:show">
	<h2>digest</h2>
	<div &="content(docs-directive-digest)"></div>
</div>
	`,
			initialize(state) {
				const D = (state.directive =
					cxl.compiler.directives[state.name]);
				state.update = D.prototype.update;
				state.digest = D.prototype.digest;
			}
		},
		{}
	);

	component(
		{
			name: 'docs-demo',
			attributes: ['label', 'owner'],
			bindings: 'connect:#connect',
			template: `
<cxl-t h6><span &="=label:show:text"></span></cxl-t>
<div &="content"></div>
<div &=".showMore">
	<a href="#" &=".link action:#toggleSource:event.prevent"><cxl-icon icon="code"></cxl-icon> <x &="=sourceLabel:text"></x></a>
</div>
<docs-code &=".source =displaySource:.show =source:@source"></docs-code>
`,

			styles: {
				$: { marginTop: 24, marginBottom: 24 },
				showMore: { textAlign: 'right', marginTop: 16 },
				source: { transformOrigin: 'top', scaleY: 0, height: 0 },
				show: { scaleY: 1, height: 'auto' },
				link: {
					color: 'primary',
					textDecoration: 'none',
					font: 'caption'
				}
			}
		},
		{
			sourceLabel: 'Show Source',
			displaySource: false,

			toggleSource() {
				this.displaySource = !this.displaySource;
				this.sourceLabel = this.displaySource
					? 'Hide Source'
					: 'Show Source';
			},

			connect(val, host) {
				var state = this,
					owner = state.owner || host.$view,
					src,
					template;
				if (
					host.firstChild &&
					host.firstChild.nodeType === document.COMMENT_NODE
				) {
					src = host.firstChild.data;
					template = new cxl.Template(src);

					host.appendChild(template.compile(owner));
				} else src = host.innerHTML;

				state.source = src.trim();
			}
		}
	);

	component(
		{
			name: 'docs-code',
			attributes: ['source', 'type', 'source-id'],
			template: `
<style>${hljs.$STYLE} .hljs { overflow: visible !important; }</style>
<div &="=type:style =source:text:#highlight .code"></div>
	`,

			styles: {
				$: { marginTop: 16, marginBottom: 16 },
				$lastChild: { marginBottom: 0 },
				code: {
					fontFamily: 'monospace',
					whiteSpace: 'pre-wrap',
					fontSize: 'var(--cxl-fontSize)',
					wordBreak: 'break-all'
				}
			},

			initialize(state) {
				if (this['source-id'])
					state.source = document.getElementById(
						this['source-id']
					).innerHTML;
				else if (
					this.firstChild &&
					this.firstChild.nodeType === document.COMMENT_NODE
				)
					state.source = this.firstChild.data.trim();
				else if (this.innerHTML) state.source = this.innerHTML.trim();
			}
		},
		{
			type: 'html',
			highlight(text, el) {
				hljs.highlightBlock(el);
			}
		}
	);

	component(
		{
			name: 'docs-attribute',
			attributes: ['name', 'demo', 'lorem'],
			template: `
<cxl-t h6>Attribute: <code &="=name:anchor:text"></code></cxl-t>
<div &="content"></div>
<br>
	`,
			bindings: 'connect:#connect'
		},
		{
			connect(val, host) {
				if (this.demo) {
					const lorem = this.lorem ? LOREM : this.name,
						value = this.demo === 'string' && LOREM_SHORT,
						component = host.parentNode.name,
						source = `<docs-demo><!--<${component} ${this.name}${
							value ? '="' + value + '"' : ''
						}>${lorem}</${component}>--></docs-demo>`,
						frag = cxl.Template.getFragmentFromString(source);
					host.insertBefore(frag, host.firstChild);
				}
			}
		}
	);

	component({
		name: 'docs-method',
		attributes: ['name'],
		template: `
<cxl-t h6>Method: <code &="=name:anchor:text"></code></cxl-t>
<div &="content"></div>
	`
	});

	component({
		name: 'docs-component-card',
		attributes: ['name', 'icon', 'tags'],
		template: `
<cxl-card &=".card">
	<a &="=name:route.link"><cxl-icon &=".icon =icon:@icon"></cxl-icon></a>
	<cxl-c grow>
		<a &="=name:route.link .link">&lt;<x &="=name:text"></x>&gt;</a>
		<template &="=tags:each:repeat">
			<cxl-chip little &="item:text"></cxl-chip>
		</template>
		<cxl-t subtitle2 &="content"></cxl-t>
	</cxl>
</cxl-card>
	`,
		styles: {
			card: { padding: 16, display: 'flex', font: 'caption' },
			link: {
				color: 'onSurface',
				font: 'subtitle',
				display: 'block',
				textDecoration: 'none',
				marginBottom: 4
			},
			icon: {
				width: 48,
				height: 48,
				lineHeight: 48,
				fontSize: 24,
				textAlign: 'center',
				backgroundColor: 'onSurface12',
				color: '#fff',
				marginRight: 16
			}
		}
	});

	component({
		name: 'docs-placeholder',
		template: '<cxl-icon &=".icon" icon="images"></cxl-icon>',
		styles: {
			$: {
				position: 'relative',
				height: 100,
				backgroundColor: '#ccc',
				font: 'h3',
				textAlign: 'center',
				color: '#fff'
			},
			icon: {
				position: 'absolute',
				top: '50%',
				translateY: '-50%',
				translateX: '-50%'
			}
		}
	});
})(this.cxl, this.hljs);
