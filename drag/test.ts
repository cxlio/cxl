import { suite } from '../spec/index.js';
import { dragInside } from './index.js';

export default suite('drag', test => {
	test('dragInside', a => {
		const el = document.createElement('div');
		const subs = dragInside(el).subscribe();
		a.ok(subs, 'Should subscribe');
		subs.unsubscribe();
	});
});
