cxl.debounce = function(cb) {
	return cb;
};

const dom = cxl.dom;
var nameId = 0;
function $$fixture(A) {
	const result = document.getElementById('qunit-fixture');

	if (A) {
		result.appendChild(A);

		if (cxl.$$shadyUpgrade) cxl.$$shadyUpgrade(A, true);
	}

	return result;
}

function $$render(view) {
	cxl.renderer.cancel();
	cxl.renderer.digest(view);
	cxl.renderer.commit();
}

function $$compile(html, view) {
	const host = cxl.dom('DIV');

	html = new cxl.Template(html);

	if (!(view instanceof cxl.View)) view = new cxl.View(view, host);

	host.appendChild(html.compile(view));

	$$render(view);

	$$fixture(host);
	view.connect();

	$$render(view);

	return view;
}

function $$tagName() {
	return 'test-' + nameId++;
}

function $$trigger(el, event, detail) {
	const ev = new window.Event(event, { bubbles: true });
	ev.detail = detail;
	el.dispatchEvent(ev);
}
