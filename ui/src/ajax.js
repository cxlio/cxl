(cxl => {

function isJSON(xhr)
{
	var contentType = xhr.getResponseHeader('Content-Type');
	return contentType && contentType.indexOf('application/json')!==-1;
}

function ajax(def)
{
	function parse(xhr)
	{
		return isJSON(xhr) ?
			JSON.parse(xhr.responseText) : xhr.responseText;
	}

	return cxl.ajax.xhr(def).then(parse, function(xhr) {
		return cxl.Promise.reject(parse(xhr));
	});
}

cxl.ajax = Object.assign(ajax, {

	xhr(def)
	{
		return new cxl.Promise(function(resolve, reject) {
		var
			xhr = new XMLHttpRequest(),
			options = Object.assign({}, cxl.ajax.defaults, def),
			data
		;
			if (options.setup)
				options.setup(xhr);

			xhr.open(options.method, options.url);

			if ('data' in options)
			{
				if (options.contentType)
					xhr.setRequestHeader('Content-Type', options.contentType);

				data = options.dataType==='json' && typeof(options.data)!=='string' ?
					JSON.stringify(options.data) :
					options.data;
			}

			if (options.responseType)
				xhr.responseType = options.responseType;

			if (options.progress)
				xhr.addEventListener('progress', options.progress);

			xhr.onreadystatechange = function()
			{
				if (xhr.readyState===XMLHttpRequest.DONE)
				{
					// TODO Make sure we add other valid statuses
					if (xhr.status===200) resolve(xhr); else reject(xhr);
				}
			};

			xhr.send(data);
		});
	},

	get(url, params)
	{
		var q, i;

		if (params)
		{
			q = [];
			for (i in params)
				q.push(i + '=' + window.encodeURIComponent(params[i]));

			url += '?' + q.join('&');
		}

		return cxl.ajax({ url: url });
	},

	post(url, params)
	{
		return cxl.ajax({ method: 'POST', url: url, data: params });
	},

	defaults: {
		method: 'GET',
		contentType: 'application/json',
		// 'json', 'text' or 'arraybuffer'
		dataType: 'json',
		// function(xhr)
		setup: null
	}

});

})(this.cxl);