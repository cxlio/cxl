// Diff Worker
import { diff } from './index.js';

self.onmessage = ev => {
	const { id, payload } = ev.data;
	const { type, data } = payload;

	if (type === 'diff') {
		const payload = diff(data.a, data.b);
		postMessage({ id, type: 'next', payload });
		postMessage({ id, type: 'complete' });
	}
};
