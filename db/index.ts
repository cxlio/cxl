import { Observable } from '../rx/index.js';
import * as firebase from 'firebase/app';
import 'firebase/database';

export class Reference<T> extends Observable<T> {
	protected ref$: firebase.database.Reference;

	constructor(public readonly path: string) {
		super(subs => {
			ref$.on('value', snap => subs.next(snap.val()));
			return () => ref$.off('value');
		});
		const ref$ = (this.ref$ = firebase.database().ref(path));
	}

	ref<K extends keyof T>(path: K): Reference<T[K]> {
		return new Reference(`${this.path}/${path}`);
	}

	next(value: T) {
		return this.ref$.set(value);
	}
}

export function db<T>(path: string) {
	return new Reference<T>(path);
}
