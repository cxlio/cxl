
QUnit.module('css');

QUnit.test('Rule#toCSS - default', function(a) {
var
	rule = new cxl.css.Rule('$', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('$', new cxl.css.Style({ color: '#fff' }));

	a.equal(rule.toCSS('tag'), 'tag{color:#fff;}');

	rule = new cxl.css.Rule('$', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), 'tag{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host'), ':host{color:#fff;opacity:2;}');

});

QUnit.test('Rule#toCSS - global', function(a) {
var
	rule = new cxl.css.Rule('*', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('*', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS(':host'), ':host,:host *{color:#fff;opacity:2;}');

});

QUnit.test('Rule#toCSS - breakpoint', function(a) {
var
	rule = new cxl.css.Rule('$small', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('$large', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), '@media(min-width:1280px){tag{color:#fff;opacity:2;}}');
	a.equal(rule.toCSS(':host'), '@media(min-width:1280px){:host{color:#fff;opacity:2;}}');

	a.equal(rule.toCSS('tag', 'pref--'), '@media(min-width:1280px){tag{color:#fff;opacity:2;}}');
	a.equal(rule.toCSS(':host', 'pref--'), '@media(min-width:1280px){:host{color:#fff;opacity:2;}}');

	rule = new cxl.css.Rule('test$medium', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), '@media(min-width:960px){tag .test{color:#fff;opacity:2;}}');
	a.equal(rule.toCSS(':host'), '@media(min-width:960px){:host .test{color:#fff;opacity:2;}}');

	a.equal(rule.toCSS('tag', 'pref--'), '@media(min-width:960px){tag .pref--test{color:#fff;opacity:2;}}');
	a.equal(rule.toCSS(':host', 'pref--'), '@media(min-width:960px){:host .pref--test{color:#fff;opacity:2;}}');
});

QUnit.test('Rule#toCSS - state', function(a) {
var
	rule = new cxl.css.Rule('$hover', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('$hover', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), 'tag:hover{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host'), ':host(:hover){color:#fff;opacity:2;}');

	rule = new cxl.css.Rule('test$focus', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), 'tag:focus .test{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host'), ':host(:focus) .test{color:#fff;opacity:2;}');
});

QUnit.test('Rule#toCSS - single class', function(a) {
var
	rule = new cxl.css.Rule('test', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('test-class', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), 'tag .test-class{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host'), ':host .test-class{color:#fff;opacity:2;}');
});

QUnit.test('Rule#toCSS - multiple class', function(a) {
var
	rule = new cxl.css.Rule('test.test2', new cxl.css.Style({}))
;
	a.equal(rule.toCSS('tag'), '');

	rule = new cxl.css.Rule('test-class.yes', new cxl.css.Style({ color: '#fff', opacity:2 }));

	a.equal(rule.toCSS('tag'), 'tag .test-class.yes{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host'), ':host .test-class.yes{color:#fff;opacity:2;}');

	a.equal(rule.toCSS('tag', 'pref--'),
		'tag .pref--test-class.pref--yes{color:#fff;opacity:2;}');
	a.equal(rule.toCSS(':host', 'pref--'), ':host .pref--test-class.pref--yes{color:#fff;opacity:2;}');
});

