import { observable } from '@cxl/rx';

interface AjaxOptions {
	url: string;
	method?: string;
	contentType?: string;
	data?: string | Blob | ArrayBuffer;
	responseType?: XMLHttpRequestResponseType;
	progress?: (ev: ProgressEvent) => void;
}

const AjaxDefaults = {
	method: 'GET',
	contentType: 'application/json',
	baseURL: '',
};

function isJSON(xhr: XMLHttpRequest) {
	const contentType = xhr.getResponseHeader('Content-Type');
	return contentType && contentType.indexOf('application/json') !== -1;
}

function parse(xhr: XMLHttpRequest) {
	return isJSON(xhr) ? JSON.parse(xhr.responseText) : xhr.responseText;
}

export function request<T>(options: AjaxOptions) {
	return observable<T>(subs => {
		xhr(options)
			.then(parse)
			.then(
				json => {
					subs.next(json);
					subs.complete();
				},
				e => subs.error(e)
			);
	});
}

export function get<T>(url: string | AjaxOptions) {
	const options: AjaxOptions = typeof url === 'string' ? { url } : url;
	return request<T>(options);
}

export function xhr(def: AjaxOptions) {
	return new Promise<XMLHttpRequest>((resolve, reject) => {
		const xhr = new XMLHttpRequest(),
			options = { ...AjaxDefaults, ...def };

		xhr.open(options.method, options.url);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
				else reject(xhr);
			}
		};

		xhr.setRequestHeader('Content-Type', options.contentType);

		if (options.responseType) xhr.responseType = options.responseType;

		if (options.progress)
			xhr.addEventListener('progress', options.progress);

		xhr.send(options.data);
	});
}
