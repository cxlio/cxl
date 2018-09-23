/*jshint esnext:true */
((cxl, hljs) => {

const
	META = cxl.ui.meta
;

hljs.configure({ tabReplace: '    '});


cxl.component({
	name: 'docs-link',
	attributes: [ 'anchor' ],
	template: '<a href="#" &="action:#onAction:event.prevent content"></a>'
}, {
	onAction()
	{
		cxl.anchor(this.anchor).focus();
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
	attributes: ['title', 'owner'],
	bindings: 'connect:#connect',
	template: `
<cxl-card><cxl-block>
	<cxl-t h6><span &="=title:show:text"></span></cxl-t>
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
<link rel="stylesheet"
      href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/github.min.css">
<div &="=type:style =source:text:#highlight .code"></div>
	`,
	styles: {
		$: { marginTop: 16, marginBottom: 16 },
		$lastChild: { marginBottom: 0 },
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
<cxl-t h6><span &="=name:anchor:text"></span> Attribute</cxl-t>
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
<h3 &="=name:anchor:text"></h3>
<div &="content"></div>
	`
});

cxl.component({
	name: 'docs-component-card',
	attributes: [ 'name' ],
	template: `
<cxl-card>
	<cxl-c flex>
		<a &="=name:route.link"><cxl-icon &=".icon =meta.icon:@icon"></cxl-icon></a>
		<cxl-block>
			<a &="=name:route.link"><cxl-t subtitle>&lt;<x &="=name:text"></x>&gt;</cxl-t></a>
			<!--<cxl-t caption><cxl-icon &=".tags" icon="tags"></cxl-icon>
			<template &="=meta.tags:each:repeat">
				<span&="item:text"></span>
			</template>
			</cxl-t>-->
		</cxl-block>
	</cxl-c>
</cxl-card>
	`,
	styles: {
		tags: { color: '#ccc' },
		icon: {
			width: 80, height: 80, lineHeight: 80, fontSize: 48, textAlign: 'center',
			backgroundColor: '#ccc', color: '#fff'
		}
	},
	bindings: `=name:#getMeta`
}, {
	getMeta(name)
	{
		this.meta = META[name];
	}
});

cxl.component({
	name: 'docs-component',
	attributes: [ 'name' ],
	template: `
<cxl-t h5>Basic Usage</cxl-t>
<div &="content(docs-usage, docs-demo)"></div>
<br>
<cxl-t h5>API</cxl-t>
<div &="=anchors:show">
	<cxl-t h5>Anchors</cxl-t>
	<template &="=anchors:each:repeat">
	<span &="item:text"></span>
	</template>
</div>
<div &="=attributes:show">
	<br>
	<cxl-t h6>Attributes</cxl-t>
	<ul>
	<template &="=attributes:sort:each:repeat">
	<li><docs-link &="item:text:@anchor"></docs-link></li>
	</template>
	</ul>
</div>
<div &="=events:show">
	<br>
	<cxl-t h6>Events</cxl-t>
	<ul>
	<template &="=events:sort:each:repeat">
	<li><docs-link &="item:text:@anchor"></docs-link></li>
	</template>
	</ul>
</div>
<div &="=methods:show">
	<br>
	<cxl-t h6>Methods</cxl-t>
	<ul>
	<template &="=methods:sort:each:repeat">
	<li><docs-link &="item:text:@anchor"></docs-link></li>
	</template>
	</ul>
</div>
<br>
	<div &="content(docs-attribute)"></div>
	<div &="content(docs-event)"></div>
	<div &="content(docs-method)"></div>
	`,
	bindings: '=name:#initialize'
}, {
	initialize(name)
	{
	const
		state = this,
		component = cxl.componentFactory.components[name],
		meta = component && component.meta || {}
	;
		state.attributes = meta.attributes;
		state.events = meta.events;
		state.methods = meta.methods;
	},

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