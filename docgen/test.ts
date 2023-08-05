import { spec } from '@cxl/spec';
import { SignatureText } from './render-html.js';
import { Kind, Node, parse /*, printNode*/ } from '@cxl/dts';

export function node(p: Partial<Node>): Node {
	return { name: 'A', kind: Kind.Unknown, flags: 0, ...p };
}

export default spec('docgen', s => {
	s.test('render-html', it => {
		it.test('MappedType', it => {
			it.should('render type alias', a => {
				const [A] = parse({
					source: `type A<T> = { [P in keyof T]: T[P]; }`,
				});
				const R = SignatureText(A);
				a.equal(
					R,
					'A&lt;T&gt; = { [P in keyof <a href="#s2">T</a>]: <a href="#s2">T</a>[<a href="#s3">P</a>] }'
				);
			});

			it.test('render function result', a => {
				const [A, B, C] = parse({
					source: `
	abstract class Component extends Array { }
	const registeredComponents: Record<string, typeof Component> = {};
	export function getRegisteredComponents() {
		return { ...registeredComponents };
	}
				`,
				});
				console.log(A, B, C);
				const R = SignatureText(C);
				a.equal(
					R,
					'getRegisteredComponents(): { [x: string]: typeof Component }'
				);
			});
		});

		it.test('UnionType', it => {
			it.should('render function type', a => {
				const [A] = parse({
					source: `function A(): { type: 'A' | 'B' } { return { type: 'A' } }`,
				});
				const R = SignatureText(A);
				a.equal(R, `A(): { type: 'A' | 'B' }`);
			});
			/*it.test('render function type', a => {
				const [A] = parse(`
					function A() { return B(); }
					function B(): Array<Event> { return [{ type: 'A' }] };
					type Event = { type: 'A' | 'B' } | { type: 'C' }
					`);
				const R = SignatureText(A);
				a.equal(R, `A(): { type: 'A' | 'B' }`);
			});*/
		});

		it.test('TypeAlias', it => {
			it.should('render union', a => {
				const [A] = parse({
					source: `type A<T> = { [P in keyof T]: T[P]; } & { name: string };`,
				});
				const R = SignatureText(A);
				a.equal(
					R,
					'A&lt;T&gt; = { [P in keyof <a href="#s2">T</a>]: <a href="#s2">T</a>[<a href="#s3">P</a>] } & { name: string }'
				);
			});

			it.should('render extends', a => {
				const [A] = parse({
					fileName: 'extends.ts',
					source: `
					type A<T extends Component> = keyof T;
					interface Component { }
				`,
				});
				const R = SignatureText(A);
				a.equal(
					R,
					'A&lt;T extends <a href="extends--Component.html">Component</a>&gt; = keyof <a href="#s2">T</a>'
				);
			});
		});
	});
});
