(function(cxl) {
"use strict";

function result(val) {
	return typeof(val)==='function' ? val() : val;
}

cxl.Promise = Promise;
	
Object.assign(cxl, {
	
	Promise: Promise,
	
	
	escape(str)
	{
		return str && str.replace(cxl.ENTITIES_REGEX, function(e) {
			return cxl.ENTITIES_MAP[e];
		});
	},

	invokeMap(array, fn, val)
	{
		if (Array.isArray(array))
			array.forEach(function(a) { if (a[fn]) a[fn](val); });
		else
			for (var i in array)
				if (array[i][fn])
					array[i][fn](val);
	},
	
	listenTo(el, event, cb)
	{
	var
		method = el.addEventListener || el.on,
		remove = el.removeEventListener || el.off,
		fn = cb.bind(this),
		subscriber = method.call(el, event, cb.bind(this))
	;
		if (!subscriber)
			subscriber = { unsubscribe: remove.bind(el, event, fn) };

		return subscriber;
	},

	sortBy(A, key)
	{
		return A.sort((a,b) => a[key]>b[key] ? 1 : (a[key]<b[key] ? -1 : 0));
	},
	
	debounce(fn, delay)
	{
		var to;

		function Result() {
			var args = arguments, thisVal = this;

			if (to)
				clearTimeout(to);
			to = setTimeout(function() {
				Result.fn.apply(thisVal, args);
			}, delay);
		}
		Result.fn = fn;
		Result.cancel = function() {
			clearTimeout(to);
		};

		return Result;
	}
});
	
cxl.View = function cxlView(p) {
	
	this.bindings = [];
	
	cxl.extend(this, p);

	if (typeof(this.el)==='string')
		this.el = document.getElementById(this.el);
	
	if (this.initialize)
		this.initialize();
	
	if (this.templateId)
		this.template = cxl.html(this.templateId);
	
	if (this.template)
		this.loadTemplate();
	
	if (this.render)
		this.render();
};
	
cxl.extend(cxl.View.prototype, {
	
	bindings: null,
	element: null,
	template: null,
	initialize: null,
	render: null,
	
	loadTemplate: function(tpl)
	{
		var content = tpl.compile(this);
		
		if (this.element)
		{
			this.element.innerHTML = '';
			this.element.appendChild(content);
		} else
			this.element = content;
	},
	
	listenTo: function(el, event, cb)
	{
	var
		method = el.addEventListener || el.on,
		remove = el.removeEventListener || el.off,
		fn = cb.bind(this),
		subscriber = method.call(el, event, cb.bind(this))
	;
		if (!subscriber || !(subscriber instanceof cxl.Subscriber))
			subscriber = { unbind: remove.bind(el, event, fn) };
			
		this.bindings.push(subscriber);
	}
	
});
	
cxl.View.extend = function(p, s)
{
var
	Parent = this,
	Result = p.hasOwnProperty('constructor') ? p.constructor : 
		function() { Parent.apply(this, arguments); }
;
	Result.prototype = Object.create(this.prototype);
	cxl.extend(Result.prototype, p);
	cxl.extend(Result, s);
	
 	Result.prototype.constructor = Result;
	Result.extend = cxl.View.extend;
	
	return Result;
};
	
cxl.Model = function cxlModel()
{
	if (this.initialize)
		this.initialize();
};
	
cxl.extend(cxl.Model.prototype, {
	
	idAttribute: 'id',
	attributes: null,
	url: null,
	
	_parse: function(data)
	{
		this.attributes = cxl.extend(this.attributes, data);
		
		if (this.parse)
			this.parse(data);
	},
	
	_onSave: function(data)
	{
		if (data)
			this._parse(data);
		
		return data;
	},
	
	fetch: function()
	{
		var url = result(this.url);
		
		return cxl.ajax({ url: url }).then(this._parse.bind(this));
	},
	
	save: function()
	{
		var url = result(this.url);
		
		return cxl.ajax({
			url: url,
			data: this.attributes
		}).then(this._onSave.bind(this));
	},
	
	get: function(a)
	{
		return this.attributes[a];
	},
	
	set: function(a, value)
	{
		this.attributes[a] = value;
	}
	
	
});
	
})(this.cxl);
