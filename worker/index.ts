import { Observable, Subject, operator, throwError, Subscription } from '../rx';

declare const process: any;

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

declare const require: any;

type WorkerFunction = (payload: any, subscriber: Subscription<any>) => void;

export function compile(workerFn: WorkerFunction) {
	const NativeWorker = IS_NODE ? require('worker_threads').Worker : Worker;
	const source = `const worker=${workerFn.toString()};${RUNTIME};`,
		blob = IS_NODE
			? source
			: URL.createObjectURL(
					new Blob([source], { type: 'text/javascript' })
			  );
	const worker = new NativeWorker(blob, { eval: true } as any);

	return new WorkerManager(worker);
}

interface InternalMessage<T> {
	id: number;
	type: 'next' | 'error' | 'complete';
	payload: any;
}

export class WorkerManager {
	public get connected() {
		return this.refCount === 0;
	}

	private id = 0;
	private subject = new Subject<InternalMessage<any>>();
	private onMessage = (ev: any) => {
		this.subject.next(IS_NODE ? ev : ev.data);
	};
	private refCount = 0;

	constructor(public worker: Worker) {}

	request<ResponseT, MessageT>(payload: MessageT): Observable<ResponseT> {
		return this.subject.pipe(
			operator(subs => {
				if (this.refCount++ === 0) this.connect();
				const id = this.id++;

				this.post(id, payload);

				const complete = () => {
					subs.complete();
					if (--this.refCount === 0) this.disconnect();
				};

				return (val: InternalMessage<ResponseT>) => {
					if (val.id === id) {
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
		this.worker.postMessage({
			id,
			payload
		});
		return id;
	}
}