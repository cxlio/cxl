const start = performance.now(),
	console = window.console;

function notify(method: (...args: any[]) => void) {
	return (msg: string, ...args: any[]) => {
		if (args.length) {
			console.groupCollapsed(msg);
			method(...args);
			console.groupEnd();
		} else method(msg);
	};
}

export const log = notify(console.log.bind(console));
export const warn = notify(console.warn.bind(console));

type Return<T> = T extends (...args: any) => any ? ReturnType<T> : never;

export function override<T, K extends keyof T>(
	obj: T,
	fn: K,
	pre: T[K] extends Function ? T[K] : never,
	post?: (this: T, result: Return<T[K]>, ...args: any[]) => void
) {
	const old = obj && obj[fn];
	(obj as any)[fn] = function (...args: any[]) {
		if (pre) pre.apply(this, args);

		const result = (old as any).apply(this, args);

		if (post) {
			args = Array.prototype.slice.call(args);
			args.unshift(result);
			(post as any).apply(this, args);
		}

		return result;
	};
}

if (typeof window !== 'undefined') {
	window.addEventListener('DOMContentLoaded', () => {
		const now = performance.now();
		log(`[debug] Page loaded in ${now - start}ms`);
	});
}
