(cxl => {
"use strict";

const
	console = window.console,
	debug = cxl.debug,
	override = debug.override,
	directives = cxl.compiler.directives,
	warn = debug.warn,
	dbg = debug.dbg,

	MAX_TEMPLATE_LENGTH = 2000,
	VALID_COMPONENT_META = [
		'template', 'name', 'extend', 'attributes', 'methods', 'styles', 'events', 'bindings',
		'initialize', 'connect', 'disconnect', 'templateId'
	]
;

var
	pipeline,
	time
;

cxl.Undefined.toString = () => '?';
cxl.Skip.toString = () => 'Skip';

cxl.directive('log', {
	update: function(val) {
		window.console.info('log: ' + this.value + ' ->', val);
	}
});

override(cxl.renderer, 'commit', function() {
	pipeline = cxl.renderer.pipeline.concat();
	time = Date.now();
}, function() {

	time = Date.now() - time;
	console.groupCollapsed('[dom] Renderer#commit: ' + pipeline.length + ' items. ' +
		time + ' ms. ');
	console.log(pipeline);
	console.groupEnd();
});

//
// rx
//
override(cxl.rx.Subscriber.prototype, 'error', function(e) {
	console.error(e);
});

//
// Renderer
//
// Skip try..catch in debug mode
cxl.renderer.digestBinding = cxl.renderer.$doDigest;

//
// Components
//
override(cxl.componentFactory, 'createComponent', function(meta, node) {
	if (node.$view)
		throw new Error("Trying to initialize node more than once.");

	node.$$meta = meta;
});

override(cxl, 'component', function(meta) {

	for (var i in meta)
		if (VALID_COMPONENT_META.indexOf(i)===-1)
			throw new Error(`Invalid property "${i}" for ${meta.name}`);

	if (meta.name && meta.name.indexOf('-')===-1)
		throw new Error(`Invalid component name "${meta.name}", must have a namespace.`);

	if (meta.attributes && meta.attributes.indexOf('value')!==-1 &&
	   (!meta.events || meta.events.indexOf('change')===-1))
		throw new Error(`"value" attribute present without a "change" event`);

	if (meta.template && meta.template.length && meta.template.length>MAX_TEMPLATE_LENGTH)
		warn(`Template size for "${meta.name}" might be too long. Consider splitting into sub components`);

});


//
// Directives
//
override(cxl.compiler, 'getDirective', null, function(res, parsed) {
	const shortcut = parsed[2];
	res.$$name = shortcut ? this.shortcuts[shortcut] : parsed[3];
});

/*override(cxl.compiler, 'createBinding', function(refA, refB) {
	if (!refA && !refB.digest)
		throw new Error("Directive does not have a digest method");
});*/

override(directives.style.prototype, 'update', function() {
	if (this.element===this.owner.host)
		throw new Error('Applying style to host element');
});

override(cxl.dom, 'trigger', function(el, event) {
	if (!el.$$meta)
		return;

	// Ignore Custom APIs
	if (event.indexOf('.')!==-1)
		return;

	const events = el.$$meta.events;

	if (!events || events.indexOf(event)===-1)
		throw new Error('Event "' + event + '" not defined');
});

override(directives.getset.prototype, 'initialize', function(el, param) {
	if (!(param in el))
	{
		const msg = `Attribute "${param}" does not exist.`;

		if (el.$view)
			throw new Error(msg);
		else
			warn(msg);

		dbg(el);
	}
});

//
// View
//
override(cxl.View.prototype, 'connect', function() {
	if (this.isConnected)
		throw new Error("Trying to connect view twice");
});

// DOM
override(cxl.dom, 'query', function(el) {
	if (!el.tagName)
		throw new Error("First parameter must be a DOM element");
});

/*override(cxl.dom, 'on', function(el, event) {
	if (('on' + event in el) ||
		(el.$$meta && el.$$meta.events && el.$$meta.events.indexOf(event)!==-1) ||
		(event.indexOf('.')!==-1))
		return;

	throw new Error('Trying to listen to invalid event "' + event + '"');
});*/

})(this.cxl);