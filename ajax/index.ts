function isJSON(xhr: XMLHttpRequest) {
	const contentType = xhr.getResponseHeader('Content-Type');
	return contentType && contentType.indexOf('application/json') !== -1;
}

function parse(xhr: XMLHttpRequest) {
	return isJSON(xhr) ? JSON.parse(xhr.responseText) : xhr.responseText;
}

type DataType = 'json' | 'text' | 'arraybuffer';

interface AjaxOptions {
	baseURL: string;
	url: string;
	method: string;
	contentType: string;
	dataType: DataType;

	data?: string | Record<string, any>;
	setup?: (xhr: XMLHttpRequest) => void;
	responseType?: XMLHttpRequestResponseType;
	progress?: () => void;
	resolve?: (xhr: XMLHttpRequest) => any;
}

const AjaxDefaults = {
	url: '',
	method: 'GET',
	contentType: 'application/json',
	dataType: 'json' as DataType,
	baseURL: ''
};

class Ajax {
	defaults: AjaxOptions;

	constructor(defaults: Partial<AjaxOptions> = {}) {
		this.defaults = {
			...AjaxDefaults,
			...defaults
		};
	}

	xhr(def: Partial<AjaxOptions>) {
		return new Promise<XMLHttpRequest>((resolve, reject) => {
			const xhr = new XMLHttpRequest(),
				options = { ...this.defaults, ...def };

			let data: any;

			if (options.setup) options.setup(xhr);

			xhr.open(options.method, options.baseURL + options.url);

			function send() {
				if ('data' in options) {
					if (options.contentType)
						xhr.setRequestHeader(
							'Content-Type',
							options.contentType
						);

					data =
						options.dataType === 'json' &&
						typeof options.data !== 'string'
							? JSON.stringify(options.data)
							: options.data || '';
				}

				if (options.responseType)
					xhr.responseType = options.responseType;

				if (options.progress)
					xhr.addEventListener('progress', options.progress);

				xhr.send(data);
			}

			xhr.onreadystatechange = function() {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					// TODO Make sure we add other valid statuses
					if (xhr.status === 200) resolve(xhr);
					else reject(xhr);
				}
			};

			if (options.resolve)
				Promise.resolve(options.resolve(xhr)).then(send, reject);
			else send();
		});
	}

	request(def: Partial<AjaxOptions>) {
		return this.xhr(def).then(parse, xhr => Promise.reject(parse(xhr)));
	}

	get(url: string, params?: any) {
		let q, i;

		if (params) {
			q = [];
			for (i in params)
				q.push(i + '=' + window.encodeURIComponent(params[i]));

			url += '?' + q.join('&');
		}

		return this.request({ url: url });
	}

	post(url: string, params?: any) {
		return this.request({ method: 'POST', url: url, data: params });
	}
}

export const ajax = new Ajax();
