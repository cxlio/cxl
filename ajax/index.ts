import { observable } from '@cxl/rx';

interface AjaxOptions {
	url: string;
	method?: string;
	contentType?: string;
	data?: string | Blob | ArrayBuffer;
	responseType?: XMLHttpRequestResponseType;
	progress?: (ev: ProgressEvent) => void;
	credentials?: boolean;
}

export type ResponseParser = (data: any) => any;
export const Parsers: Record<string, ResponseParser> = {
	'application/json': JSON.parse.bind(JSON),
};

const AjaxDefaults = {
	method: 'GET',
	baseURL: '',
	credentials: false,
};

function parse(xhr: XMLHttpRequest) {
	const contentType = xhr
		.getResponseHeader('Content-Type')
		?.split(';')[0]
		.trim();
	const parser = contentType && Parsers[contentType];

	return parser ? parser(xhr.response) : xhr.response;
}

export function request(options: AjaxOptions) {
	return observable<XMLHttpRequest>(subs => {
		xhr(options).then(
			res => {
				subs.next(res);
				subs.complete();
			},
			e => subs.error(e)
		);
	});
}

export function get<T>(url: string | AjaxOptions) {
	const options: AjaxOptions = typeof url === 'string' ? { url } : url;
	return request(options).map<T>(parse);
}

export function xhr(def: AjaxOptions) {
	return new Promise<XMLHttpRequest>((resolve, reject) => {
		const xhr = new XMLHttpRequest(),
			options = { ...AjaxDefaults, ...def };

		xhr.open(options.method, options.url);

		if (def.credentials) xhr.withCredentials = true;

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
				else reject(xhr);
			}
		};

		if (options.contentType)
			xhr.setRequestHeader('Content-Type', options.contentType);

		if (options.responseType) xhr.responseType = options.responseType;

		if (options.progress)
			xhr.addEventListener('progress', options.progress);

		xhr.send(options.data);
	});
}
