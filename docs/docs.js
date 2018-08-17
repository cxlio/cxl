/**
 * Docs Utilities
 */

/*jshint esnext:true */
((cxl, hljs) => {

hljs.configure({ tabReplace: '    '});

cxl.component({
	name: 'docs-directive-update',
	attributes: [ 'directive' ],
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
	`,

	connect()
	{
		this.$view.state.$view = this.$view;
		this.$view.state.doUpdate();
	}

}, {
	oldParameter: null,
	doUpdate()
	{
		if (this.parameter !== this.oldParameter)
		{
			var directive = cxl.compiler.directives[this.directive];

			if (this.instance)
				this.instance.destroy();

			this.instance = new directive(this.element, this.parameter, this.$view);
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
	attributes: ['title', 'owner'],
	template: `
<cxl-card><cxl-block>
	<cxl-t h6><span &="=title:show:text"></span></cxl-t>
	<div &=".content content"></div>
	<docs-code &="=source:@source"></docs-code>
</cxl-block></cxl-card>`,
	styles: {
		content: { marginBottom: 16 }
	},

	connect()
	{
	var
		state = this.$view.state,
		owner = state.owner || this.$view,
		src, template
	;
		if (this.firstChild && this.firstChild.nodeType===document.COMMENT_NODE)
		{
			src = this.firstChild.data;
			template = new cxl.Template(src);

			this.appendChild(template.compile(owner));
		} else
			src = this.innerHTML;

		state.source = src.trim();
	}
}, {

});

cxl.component({
	name: 'docs-code',
	attributes: [ 'source', 'type' ],
	template: `
<link rel="stylesheet"
      href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/github.min.css">
<div &="=type:style =source:text:#highlight .code"></div>
	`,
	styles: {
		//$: { marginBottom: 32 },
		code: {
			fontFamily: 'monospace', whiteSpace: 'pre', fontSize: 16
		}
	},
	initialize(state)
	{
		if (this.firstChild && this.firstChild.nodeType===document.COMMENT_NODE)
			state.source = this.firstChild.data.trim();
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
<h3 &="=name:anchor:text"></h3>
<div &="content"></div>
	`,
	connect()
	{
		if (this.demo)
		{
		const
			lorem = this.lorem ? `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris at elementum orci. Vestibulum facilisis vel risus a commodo. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris velit sapien, dignissim quis fermentum a, porta at urna. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.` : '',
			component = this.parentNode.$view.state.component,
			source = `<docs-demo><!--<${component} ${this.name}>${lorem}</${component}>--></docs-demo>`,
			frag = cxl.Template.getFragmentFromString(source)
		;
			this.insertBefore(frag, this.firstChild);
		}
	}
});

cxl.component({
	name: 'docs-method',
	attributes: [ 'name' ],
	template: `
<h3 &="=name:anchor:text"></h3>
<div &="content"></div>
	`
});

cxl.component({
	name: 'docs-component',
	attributes: [ 'name' ],
	template: `
<div>
	<h2>Basic Usage</h2>
	<div &="content(docs-usage, docs-demo)"></div>
</div>
<div &="=anchors:show">
	<h2>Anchors</h2>
	<template &="=anchors:each:repeat">
	<span &="item:text"></span>
	</template>
</div>
<div &="=attributes:show">
	<h2>Attributes</h2>
	<ul>
	<template &="=attributes:sort:each:repeat">
	<li><a &="item:anchor.focus:text"></a></li>
	</template>
	</ul>
	<div &="content(docs-attribute)"></div>
</div>
<div &="=events:show">
	<h2>Events</h2>
	<ul>
	<template &="=events:sort:each:repeat">
	<li><a &="item:anchor.focus:text"></a></li>
	</template>
	</ul>
	<div &="content(docs-event)"></div>
</div>
<div &="=methods:show">
	<h2>Methods</h2>
	<ul>
	<template &="=methods:sort:each:repeat">
	<li><a &="item:anchor.focus:text"></a></li>
	</template>
	</ul>
	<div &="content(docs-method)"></div>
</div>
	`,
	initialize(state)
	{
		const component = cxl.componentFactory.components[state.name];
		state.attributes = component.meta.attributes;
		state.events = component.meta.events;
		state.methods = component.meta.methods;
		state.component = state.name;
	}

}, {
	onAttributeClick()
	{
		cxl.dom.scrollTo(this.name);
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