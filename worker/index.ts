///<amd-module name="@cxl/worker"/>
import { Observable, Subject, Subscriber, operatorNext } from '@cxl/rx';
import type { Worker as NodeWorker } from 'worker_threads';

declare const process: any;

declare global {
	function decodeBuffer(buffer?: ArrayBuffer | string, type?: string): string;
	const IS_NODE: boolean;
}

export type HandlerEvent<T, R> = {
	data: T;
	next(r: R): void;
	error(err: any): void;
	complete(): void;
};

const IS_NODE =
	typeof process !== 'undefined' && process.versions && process.versions.node;

const SHARED_RUNTIME = `
	const subscriber = {
		next(val) {
			postMessage({ id, type: 'next', payload: val });
		},
		error(val) {
			postMessage({ id, type: 'error', payload: val });
		},
		complete(val) {
			postMessage({ id, type: 'complete' });
		}
	};
	try {
		worker(ev.payload, subscriber);
	} catch(e) {
		subscriber.error(e);
	}
`;
const RUNTIME = IS_NODE
	? `
const { parentPort } = require('worker_threads'); 
parentPort.on('message', ev => {
	const id=ev.id,postMessage=parentPort.postMessage.bind(parentPort);
	${SHARED_RUNTIME}
});
`
	: `onmessage=function(message) { const ev=message.data,id=ev.id;${SHARED_RUNTIME}}`;

type WorkerFunction = (payload: any, subscriber: Subscriber<any>) => void;

interface InternalMessage<T> {
	id: number;
	type: 'next' | 'error' | 'complete';
	payload: T;
}

export interface WorkerOptions {
	timeout?: number;
	transform?: (payload: any) => any;
}

export interface AbstractWorker {
	postMessage(payload: any): void;
	addEventListener(event: 'message', handler: (ev: any) => void): void;
	removeEventListener(event: 'message', handler: (ev: any) => void): void;
}

export class WorkerManager {
	public get connected() {
		return this.refCount === 0;
	}

	private id = 0;
	private subject = new Subject<InternalMessage<any>>();
	private onMessage = IS_NODE
		? (ev: any) => this.subject.next(ev)
		: (ev: any) => this.subject.next(ev.data);
	private refCount = 0;

	private $$worker?: AbstractWorker | NodeWorker;
	public get worker(): AbstractWorker | NodeWorker {
		return (this.$$worker ||= this.getWorker());
	}

	constructor(
		protected getWorker: () => AbstractWorker | NodeWorker,
		protected options: WorkerOptions = {}
	) {}

	request<ResponseT, MessageT>(payload: MessageT): Observable<ResponseT> {
		return this.subject.pipe(
			operatorNext(subs => {
				if (this.refCount++ === 0) this.connect();
				const id = this.id++;
				const timeout = this.options.timeout
					? setTimeout(() => {
							subs.error('Timeout');
							complete();
					  }, this.options.timeout)
					: 0;
				if (this.options.transform)
					payload = this.options.transform(payload);

				this.post(id, payload);

				const complete = () => {
					subs.complete();
					if (--this.refCount === 0) this.disconnect();
				};

				return (val: InternalMessage<ResponseT>) => {
					if (val.id === id) {
						if (timeout) clearTimeout(timeout);
						if (val.type === 'error') {
							subs.error(val.payload);
							complete();
						} else if (val.type === 'next') subs.next(val.payload);
						else if (val.type === 'complete') complete();
					}
				};
			})
		);
	}

	private connect() {
		const worker = this.worker as any;
		if (IS_NODE) worker.on('message', this.onMessage);
		else worker.addEventListener('message', this.onMessage);
	}

	private disconnect() {
		const worker = this.worker as any;
		if (IS_NODE) {
			worker.unref();
			worker.off('message', this.onMessage);
		} else worker.removeEventListener('message', this.onMessage);
	}

	private post(id: number, payload: any) {
		const worker = this.worker;
		if (worker instanceof MessagePort) worker.postMessage({ id, payload });
		else worker.postMessage({ id, payload });
		return id;
	}
}

export interface RemoteWorkerOptions {
	url: string;
	serialize?(data: any): string | Promise<string>;
	getHeaders?(): Record<string, string>;
}

export class RemoteWorker implements AbstractWorker {
	protected handlers: Set<(ev: any) => void> = new Set();

	constructor(public readonly options: RemoteWorkerOptions) {}

	async postMessage(payload: any) {
		try {
			const headers = this.options.getHeaders?.();
			const serialize =
				this.options.serialize || JSON.stringify.bind(JSON);

			const json = await fetch(this.options.url, {
				method: 'POST',
				body: await serialize(payload),
				headers,
			}).then(res => {
				if (res.status !== 200) throw res;
				return res.json();
			});

			for (const handler of this.handlers) {
				for (const msg of json)
					handler({
						data: { id: payload.id, type: 'next', payload: msg },
					});
				handler({ data: { id: payload.id, type: 'complete' } });
			}
		} catch (e: any) {
			for (const handler of this.handlers)
				handler({
					data: { id: payload.id, type: 'error', payload: e },
				});
		}
	}

	addEventListener(_type: 'message', handler: (ev: any) => void) {
		this.handlers.add(handler);
	}

	removeEventListener(_type: 'message', handler: (ev: any) => void) {
		this.handlers.delete(handler);
	}
}

export function createWorker(source: string): Worker {
	const NativeWorker = IS_NODE
		? (require('worker_threads').Worker as any)
		: Worker;
	const blob = IS_NODE
		? source
		: URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
	return new NativeWorker(blob, { eval: true } as any);
}

export function compile(workerFn: WorkerFunction) {
	const source = `const worker=${workerFn.toString()};${RUNTIME};`;
	return new WorkerManager(() => createWorker(source));
}

const WORKER_RUNTIME = `
onmessage=function(message) { const ev=message.data,id=ev.id;
	function resolve(val) { postMessage({ id, type: 'resolve', payload: val }); }
	try {
worker(ev.payload, resolve);}catch(e){postMessage({ id, type: 'reject', payload: e });}
}`;

let globalId = 0;

interface PromiseWorkerRef<T> {
	resolve(response: T): void;
	reject(e: any): void;
}

export class PromiseWorker<PayloadT, ResponseT> {
	protected ref: Record<number, PromiseWorkerRef<ResponseT>> = {};
	protected webWorker: Worker;
	private listener: any;

	constructor(
		workerFn: (
			payload: PayloadT,
			resolve: (response: ResponseT) => void
		) => void
	) {
		const source = `const worker=${workerFn.toString()};${WORKER_RUNTIME};`;
		const ref = this.ref;
		const webWorker = (this.webWorker = createWorker(source));

		this.listener = function ({ data }: any) {
			const cb = ref[data.id];
			if (!cb) return;
			delete ref[data.id];
			if (data.type === 'resolve') cb.resolve(data.payload);
			else cb.reject(data.payload);
		};
		webWorker.addEventListener('message', this.listener);
	}

	query(
		payload: PayloadT,
		resolve: (response: ResponseT) => void,
		reject: (e: any) => void
	) {
		const id = globalId++;
		this.ref[id] = { resolve, reject };
		this.webWorker.postMessage({
			id,
			payload,
		});
	}

	promise(payload: PayloadT): Promise<ResponseT> {
		return new Promise<ResponseT>((resolve, reject) =>
			this.query(payload, resolve, reject)
		);
	}
	destroy() {
		this.webWorker.removeEventListener('message', this.listener);
		this.webWorker.terminate();
	}
}
