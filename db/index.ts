import { Observable, ListEvent } from '../rx/index.js';
import * as firebase from 'firebase/app';
import 'firebase/database';

export class Reference<T> extends Observable<T> {
	readonly path: string;

	constructor(dir: string, readonly key: string) {
		super(subs => {
			const ref$ = firebase.database().ref(this.path);
			ref$.on('value', snap => subs.next(snap.val()));
			return () => ref$.off('value');
		});
		this.path = key ? `${dir}/${key}` : dir;
	}

	next(val: T) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.set(val);
	}

	then<R>(resolve: (val: T) => R, reject: (e: any) => void) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.once('value').then(snap => resolve(snap.val()), reject);
	}

	ref<K extends keyof T>(key: K) {
		return new Reference<T[K]>(this.path, key.toString());
	}
}

type Collection<T> = Reference<Record<string, T>>;
type CollectionEvent<T> = ListEvent<Reference<T>>;

export function collection<T>(ref: Collection<T>) {
	return new Observable<CollectionEvent<T>>(subs => {
		const path = ref.path;
		const ref$ = firebase.database().ref(path);
		subs.next({ type: 'empty' });
		ref$.on('child_added', snap =>
			subs.next({
				type: 'insert',
				item: new Reference<T>(path, `${snap.key}`),
			})
		);
		return () => ref$.off();
	});
}

export function push<T>(ref: Collection<T>, initial?: T) {
	const ref$ = firebase.database().ref(ref.path);
	const child = ref$.push(initial);
	if (child.key === null) throw new Error('Invalid key');
	return new Reference<T>(ref.path, child.key);
}

export function db<T>(path: string) {
	return new Reference<T>(path, '');
}
