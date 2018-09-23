(cxl => {
"use strict";

const
	console = window.console,
	debug = cxl.debug,
	override = debug.override,
	directives = cxl.compiler.directives,
	warn = debug.warn,
	dbg = debug.dbg
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

override(cxl.Anchor, '$create', function(name) {
	if (cxl.anchor.anchors[name])
		warn(`Anchor "${name}" already exists`);
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
// Directives
//
override(cxl.compiler, 'getDirective', null, function(res, parsed) {
	const shortcut = parsed[2];
	res.$$name = shortcut ? this.shortcuts[shortcut] : parsed[3];
});

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



})(this.cxl);