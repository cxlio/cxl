import { Observable } from '../rx/index.js';
import * as firebase from 'firebase/app';
import 'firebase/database';

export class Reference<T> extends Observable<T> {
	constructor(public readonly path: string) {
		super(subs => {
			const ref$ = firebase.database().ref(path);
			ref$.on('value', snap => subs.next(snap.val()));
			return () => ref$.off('value');
		});
	}

	ref<K extends keyof T>(path: K): Reference<T[K]> {
		return new Reference(`${this.path}/${path}`);
	}

	next(value: T) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.set(value);
	}
}

export function db<T>(path: string) {
	return new Reference<T>(path);
}
