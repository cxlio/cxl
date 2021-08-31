import { spec } from '@cxl/spec';
import { renderType } from './render-html.js';
import { Kind, Node, parse } from '@cxl/dts';

export function node(p: Partial<Node>): Node {
	return { name: 'A', kind: Kind.Unknown, flags: 0, ...p };
}

export default spec('docgen', s => {
	s.test('render-html', it => {
		it.should('render MappedType', a => {
			const [A] = parse(`type A<T> = { [P in keyof T]: T[P]; }`);
			const R = renderType(A);
			a.equal(
				R,
				'A&lt;T&gt; = { [P in keyof <a href="#s2">T</a>]: <a href="#s2">T</a>[<a href="#s3">P</a>] }'
			);
		});

		it.should('render type alias', a => {
			const [A] = parse(
				`type A<T> = { [P in keyof T]: T[P]; } & { name: string };`
			);
			const R = renderType(A);
			a.equal(
				R,
				'A&lt;T&gt; = { [P in keyof <a href="#s5">T</a>]: <a href="#s5">T</a>[<a href="#s6">P</a>] } & { name: string }'
			);
		});
	});
});
