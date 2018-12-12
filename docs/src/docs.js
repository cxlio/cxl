/*jshint esnext:true */
((cxl, hljs) => {
"use strict";

hljs.configure({ tabReplace: '    '});

cxl.component({
	name: 'docs-link',
	attributes: [ 'anchor' ],
	template: '<a href="#" &=".link action:#onAction:event.prevent content"></a>',
	styles: {
		link: { color: 'primary' }
	}
}, {
	onAction()
	{
		cxl.anchor(this.anchor).focus();
	}
});

cxl.component({
	name: 'docs-bg',
	styles: {
		$: { background: '#eee', elevation: 1 }
	}
});

cxl.component({
	name: 'docs-directive-update',
	attributes: [ 'directive' ],
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
}, {
	oldParameter: null,

	connect(val, host)
	{
		this.$view = host.$view;
		this.doUpdate();
	},

	doUpdate()
	{
		if (this.parameter !== this.oldParameter)
		{
			const Directive = cxl.compiler.directives[this.directive];

			if (this.instance)
				this.instance.destroy();

			this.instance = new Directive(this.element, this.parameter, this.$view);
			this.instance.subscribe(new cxl.compiler.directives.refval(this, 'output', this.$view));
		}

		this.instance.next(this.input);
	}
});

cxl.component({
	name: 'docs-directive',
	attributes: [ 'name' ],
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
	initialize(state)
	{
		const D = state.directive = cxl.compiler.directives[state.name];
		state.update = D.prototype.update;
		state.digest = D.prototype.digest;
	}
}, {

});

cxl.component({
	name: 'docs-demo',
	attributes: ['label', 'owner'],
	bindings: 'connect:#connect',
	template: `
<cxl-card><cxl-block>
	<cxl-t h6><span &="=label:show:text"></span></cxl-t>
	<div &=".content content"></div>
	<docs-code &="=source:@source"></docs-code>
</cxl-block></cxl-card>`,

	styles: {
		content: { marginBottom: 16 }
	}

}, {
	connect(val, host)
	{
	var
		state = this,
		owner = state.owner || host.$view,
		src, template
	;
		if (host.firstChild && host.firstChild.nodeType===document.COMMENT_NODE)
		{
			src = host.firstChild.data;
			template = new cxl.Template(src);

			host.appendChild(template.compile(owner));
		} else
			src = host.innerHTML;

		state.source = src.trim();
	}
});

cxl.component({
	name: 'docs-code',
	attributes: [ 'source', 'type' ],
	template: `
<style>${hljs.$STYLE} .hljs { overflow: visible !important; }</style>
<div &="=type:style =source:text:#highlight .code"></div>
	`,
	styles: {
		$: { marginTop: 16, marginBottom: 16 },
		$lastChild: { marginBottom: 0 },
		code: {
			fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 16
		}
	},
	initialize(state)
	{
		if (this.firstChild && this.firstChild.nodeType===document.COMMENT_NODE)
			state.source = this.firstChild.data.trim();
		else if (this.innerHTML)
			state.source = this.innerHTML.trim();
	}
}, {
	type: 'html',
	highlight(text, el)
	{
		hljs.highlightBlock(el);
	}
});

cxl.component({
	name: 'docs-attribute',
	attributes: [ 'name', 'demo', 'lorem' ],
	template: `
<cxl-t h6>Attribute: <code &="=name:anchor:text"></code></cxl-t>
<div &="content"></div>
<br>
	`,
	bindings: 'connect:#connect'
}, {
	connect(val, host)
	{
		if (this.demo)
		{
		const
			lorem = this.lorem ? `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris at elementum orci. Vestibulum facilisis vel risus a commodo. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris velit sapien, dignissim quis fermentum a, porta at urna. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.` : '',
			component = host.parentNode.$view.state.component,
			source = `<docs-demo><!--<${component} ${this.name}>${lorem}</${component}>--></docs-demo>`,
			frag = cxl.Template.getFragmentFromString(source)
		;
			host.insertBefore(frag, host.firstChild);
		}
	}
});

cxl.component({
	name: 'docs-method',
	attributes: [ 'name' ],
	template: `
<cxl-t h6>Method: <code &="=name:anchor:text"></code></cxl-t>
<div &="content"></div>
	`
});

cxl.component({
	name: 'docs-component-card',
	attributes: [ 'name', 'icon', 'tags' ],
	template: `
<cxl-card &=".card">
	<a &="=name:route.link"><cxl-icon &=".icon =icon:@icon"></cxl-icon></a>
	<cxl-c grow>
		<a &="=name:route.link"><cxl-t subtitle>&lt;<x &="=name:text"></x>&gt;</cxl-t></a>
		<cxl-t caption><cxl-icon &=".tags" icon="tags"></cxl-icon>
		<template &="=tags:each:repeat">
			<span &="item:text"></span>
		</template>
		</cxl-t>
		<cxl-t subtitle2 &="content"></cxl-t>
	</cxl>
</cxl-card>
	`,
	styles: {
		card: { padding: 16, display: 'flex' },
		tags: { color: '#ccc', marginTop: 8 },
		icon: {
			width: 80, height: 80, lineHeight: 80, fontSize: 48, textAlign: 'center',
			backgroundColor: '#ccc', color: '#fff', marginRight: 16
		}
	}
});

cxl.component({
	name: 'docs-placeholder',
	template: '<cxl-icon &=".icon" icon="images"></cxl-icon>',
	styles: {
		$: {
			position: 'relative', height: 100,
			backgroundColor: '#ccc', fontSize: 48, textAlign: 'center', color: '#fff'
		},
		icon: { position: 'absolute', top: '50%', translateY: '-50%', translateX: '-50%' }
	}
});

})(this.cxl, this.hljs);