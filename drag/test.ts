import { suite } from '@cxl/spec';
import { dragInside, onMouseDrag } from './index.js';

const sleep = (n: number) => new Promise(resolve => setTimeout(resolve, n));

function trigger(el: Element, name: string) {
	const ev = new CustomEvent(name, { bubbles: true });
	el.dispatchEvent(ev);
}

export default suite('drag', test => {
	test('dragInside', a => {
		const el = document.createElement('div');
		const subs = dragInside(el).subscribe();
		a.ok(subs, 'Should subscribe');
		subs.unsubscribe();
	});

	test('onMouseDrag', it => {
		it.should('emit events on mouse drag', async a => {
			const el = a.dom;
			const done = a.async();
			let count = 0;

			const subs = onMouseDrag({ element: el, delay: 0 }).subscribe(
				ev => {
					switch (count++) {
						case 0:
							a.equal(ev.dragType, 'start');
							break;
						case 1:
							a.equal(ev.dragType, 'move');
							break;
						case 2:
							a.equal(ev.dragType, 'end');
							subs.unsubscribe();
							done();
					}
				},
			);

			trigger(el, 'mousedown');
			await sleep(0);
			trigger(el, 'mousemove');
			trigger(el, 'mouseup');
		});
	});
});
