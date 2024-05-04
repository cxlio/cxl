import {
	AnyType,
	BooleanType,
	Flags,
	Kind,
	NumberType,
	StringType,
	VoidType,
	parse as _parse,
	printNode as _printNode,
} from './index.js';
import { TestApi, spec } from '@cxl/spec';
import * as ts from 'typescript';

function parse(source: string, compilerOptions?: ts.CompilerOptions) {
	return _parse({
		source,
		compilerOptions,
		exportsOnly: false,
		cxlExtensions: true,
	});
}

function parseExports(source: string, compilerOptions?: ts.CompilerOptions) {
	return _parse({ source, compilerOptions });
}

export default spec('dts', a => {
	const test = a.test.bind(a);

	a.test('single literal const', (a: TestApi) => {
		const [out] = parse('export const x = 10;');
		a.ok(out.id);
		a.equal(out.kind, Kind.Constant);
		a.assert(out.type);
		a.equal(out.type.name, '10');
		a.equal(out.type.type, NumberType);
		a.equal(out.value, '10');
	});

	a.test('multiple literal const', (a: TestApi) => {
		const [x, y] = parse('export const x = "hello", y = 10;');

		a.ok(x.id);
		a.equal(x.kind, Kind.Constant);
		a.equal(x.name, 'x');
		a.assert(x.type);
		a.equal(x.type.name, '"hello"');
		a.equal(x.value, '"hello"');
		a.ok(x.flags & Flags.Export);
		a.ok(x.source);
		a.ok(y.source);

		a.ok(y.id);
		a.equal(y.kind, Kind.Constant);
		a.equal(y.name, 'y');
		a.assert(y.type);
		a.equal(y.type.type, NumberType);
		a.equal(y.value, '10');
	});

	a.test('const reference', (a: TestApi) => {
		const [x, y] = parse('export const x = "hello", y = x;');
		a.ok(x.id);
		a.ok(y.id);
		a.equal(x.value, '"hello"');
		a.assert(x.type);
		a.equal(x.type.type, StringType);
		a.equal(y.value, 'x');
		a.assert(y.type);
		a.equal(y.type.type, StringType);
		a.ok(x.source);
		a.ok(y.source);
	});

	a.test('function - empty', (a: TestApi) => {
		const [fn] = parse('function fn() { return true; }');
		a.equal(fn.name, 'fn');
		a.equal(fn.type, BooleanType);
		a.ok(fn.source);
	});

	a.test('function - optional parameter', (a: TestApi) => {
		const [fn] = parse('function fn(p?: any) { return true; }');
		a.equal(fn.name, 'fn');
		a.equal(fn.type, BooleanType);
		a.assert(fn.parameters);
		const p = fn.parameters[0];
		a.equal(p.type, AnyType);
		a.equal(p.flags, Flags.Optional);
	});

	a.test('function - parameters', (a: TestApi) => {
		const [fn] = parse(
			'function fn(_a: boolean, b="test") { return true; }',
		);
		a.equal(fn.name, 'fn');
		a.assert(fn.parameters);
		a.equal(fn.parameters.length, 2);
		a.equal(fn.type, BooleanType);

		const [_a, b] = fn.parameters;
		a.equal(_a.type, BooleanType);
		a.equal(b.type, StringType);
		a.equal(b.value, '"test"');
		a.equal(_a.name, '_a');
		a.equal(b.name, 'b');
	});

	a.test('function - deconstructed parameters', (a: TestApi) => {
		const [fn] = parse('function fn({ A, B }: { A: number;B: string}) { }');
		a.equal(fn.name, 'fn');
		a.assert(fn.parameters);
		a.equal(fn.parameters.length, 1);

		const [A] = fn.parameters;
		a.equal(A.name, '{ A, B }');
	});

	a.test('function - rest parameters', (a: TestApi) => {
		const [fn] = parse('function fn(...p: string[]) { return "hello"; }');
		a.equal(fn.name, 'fn');
		a.equal(fn.kind, Kind.Function);
		a.equal(fn.type, StringType);
		a.assert(fn.parameters);
		const [p] = fn.parameters;
		a.ok(p.flags & Flags.Rest);
		a.equal(p.kind, Kind.Parameter);
		a.assert(p.type);
		a.equal(p.type.kind, Kind.Array);
		a.equal(p.type.type, StringType);
	});

	a.test('function - signatures', (a: TestApi) => {
		const [fn1, fn2, fn] = parse(`
			function fn(_a: string);
			function fn(_a: boolean);
			function fn(_a: any): number { return 10; }`);

		a.equal(fn1.name, 'fn');
		a.equal(fn2.name, 'fn');
		a.equal(fn.name, 'fn');
		a.equal(fn.type, NumberType);
	});

	a.test('function - infered type', (a: TestApi) => {
		const [fn] = parse(`function fn() { return () => true; }`);

		a.assert(fn.type);
		a.equal(fn.type.kind, Kind.FunctionType);
		a.assert(fn.type.type);
		a.equal(fn.type.type, BooleanType);
		a.equal(fn.type.name, '');
	});

	a.test('class', a => {
		const [A, B, C, D, , , E, , , F, G, H, I, J1, J, , K, L, M] = parse(
			`
			class A { }
			class B {
				m1(a: string): void;
				m1(b: boolean): boolean;
				m1(c: any) { if (c===true) return true; }
			}
			class C<T> extends Set<T> { member: T; }
			class D { constructor(public t: string, s: boolean) { } }
			
			interface E1 { }
			interface E2 { }
			class E implements A, B {}
			
			function role(str: string) { }
			function Augment(a) { return ctor => { }; }
			@Augment(role('roleName'))
			class F { static tagName = 'cxl-test'; }
			
			class G extends A implements E1 {}
			class H { static s1; public readonly m1 = 'str'; private m2 = 10; protected m3 = false; }	
			class I { m1 = 'str'; m2() { } get m3() { return undefined; } set m3(val) {} m4 = new Set<any>(); }
			
			type J1 = Set<any>;
			class J { m1(): J1 { return new Set<any>(); } }
			
			const K1 = 'm1';
			class K { [K1]() { return true; } }
			
			abstract class L {
				m1() { return 'hello'; }
				static m2(): boolean { return false; }
				abstract m3(): number;
				constructor() {}
			}
			
			abstract class M { abstract m1; }
		`,
			{ experimentalDecorators: true },
		);

		a.test('empty class', (a: TestApi) => {
			a.ok(A);
			a.equal(A.name, 'A');
			a.ok(A.source);
		});

		a.test('method overload', (a: TestApi) => {
			a.assert(B.children);
			a.equal(B.children.length, 3);
			const [m1, m2, m3] = B.children;
			a.equal(m1.name, 'm1');
			a.equal(m1.type, VoidType);
			a.assert(m1.parameters);
			a.equal(m1.parameters[0].name, 'a');
			a.ok(m1.flags & Flags.Overload);
			a.equal(m2.name, 'm1');
			a.equal(m2.type, BooleanType);
			a.assert(m2.parameters);
			a.equal(m2.parameters[0].name, 'b');
			a.equal(m3.name, 'm1');
			a.assert(m3.parameters);
			a.equal(m3.parameters[0].name, 'c');
		});

		a.test('declaration', (a: TestApi) => {
			a.ok(C);
			a.equal(C.name, 'C');
			a.equal(C.kind, Kind.Class);
			a.assert(C.typeParameters);
			const [T] = C.typeParameters;
			a.equal(T.name, 'T');
			a.equal(T.kind, Kind.TypeParameter);
			a.ok(!T.type);
			a.assert(C.children);
			a.equal(C.children.length, 1);
			const member = C.children[0];
			a.equal(member.name, 'member');
			a.assert(member.type);
			a.equal(member.type.kind, Kind.Reference);
			a.equal(member.type.type, T);
			a.assert(C.type);
			a.assert(C.type.children);
			a.equal(C.type.children.length, 1);
			a.equal(C.type.children[0].name, 'Set');
		});

		a.test('constructor', (a: TestApi) => {
			a.assert(D.children);
			a.equal(D.children.length, 2);
			const [ctor, t] = D.children;
			a.equal(ctor.name, 'constructor');
			a.assert(ctor.parameters);
			a.equal(ctor.parameters.length, 2);
			a.equal(ctor.kind, Kind.Constructor);
			a.equal(t.name, 't');
			a.equal(t.type, StringType);
			a.ok(t.flags & Flags.Public);
			a.equal(t.kind, Kind.Property);
		});

		a.test('implements interface', (a: TestApi) => {
			a.equal(E.name, 'E');
			a.equal(E.kind, Kind.Class);
			a.assert(E.type?.children);
			a.equal(E.type.kind, Kind.ClassType);
			a.equal(E.type.children.length, 2);

			const [AType, BType] = E.type.children;
			a.equal(AType.type, A);
			a.equal(AType.name, 'A');
			a.equal(BType.type, B);
			a.equal(BType.name, 'B');
		});

		a.test('cxl Augment', (a: TestApi) => {
			a.equal(F.kind, Kind.Component);
			a.assert(F.docs);
			a.equal(F.docs.role, 'roleName');
			a.equal(F.docs.tagName, 'cxl-test');
		});

		a.test('extends class and implements interface', (a: TestApi) => {
			a.equal(G.name, 'G');
			a.equal(G.kind, Kind.Class);
		});

		a.test('access modifier', (a: TestApi) => {
			a.equal(H.name, 'H');
			a.equal(H.kind, Kind.Class);
			a.assert(H.children);
			a.equal(H.children.length, 4);

			const [s1, m1, m2, m3] = H.children;
			a.ok(s1.flags & Flags.Static);
			a.ok(m1.flags & Flags.Public);
			a.ok(m1.flags & Flags.Readonly);
			a.ok(m2.flags & Flags.Private);
			a.ok(m3.flags & Flags.Protected);
		});

		a.test('members', (a: TestApi) => {
			a.equal(I.name, 'I');
			a.equal(I.kind, Kind.Class);
			a.assert(I.children);
			a.equal(I.children.length, 5);

			const [m1, m2, m3, m4, m5] = I.children;
			a.ok(m1.flags & Flags.Public);
			a.ok(m2.flags & Flags.Public);
			a.ok(m3.flags & Flags.Public);
			a.ok(m4.flags & Flags.Public);
			a.assert(m5.type);
			a.equal(m5.type.name, 'Set');
			a.assert(m5.type.typeParameters);
			a.equal(m5.type.typeParameters.length, 1);
			a.equal(m5.type.typeParameters[0], AnyType);
			a.assert(m5.type.type);
			a.equal(m5.type.type.name, 'Set');
			a.equal(m5.type.type.flags, Flags.DefaultLibrary);
		});

		a.test('method', (a: TestApi) => {
			a.assert(J.children);
			const m1 = J.children[0];
			a.assert(m1.type);
			a.equal(m1.type.kind, Kind.Reference);
			a.equal(m1.type.type, J1);
		});

		a.test('computed property name', (a: TestApi) => {
			a.assert(K.children);
			a.equal(K.children[0].name, '[K1]');
		});

		a.test('methods', (a: TestApi) => {
			a.assert(L.children);
			a.equal(L.children.length, 4);

			const [m1, m2, m3, m4] = L.children;
			a.ok(m1.flags & Flags.Public);
			a.equal(m1.name, 'm1');
			a.equal(m1.type, StringType);
			a.ok(m2.flags & Flags.Public);
			a.ok(m2.flags & Flags.Static);
			a.equal(m2.type, BooleanType);
			a.ok(m3.flags & Flags.Public);
			a.ok(m3.flags & Flags.Abstract);
			a.equal(m3.type, NumberType);
			a.equal(m4.kind, Kind.Constructor);
		});

		a.test('abstract', (a: TestApi) => {
			a.equal(M.name, 'M');
			a.equal(M.kind, Kind.Class);
			a.ok(M.flags & Flags.Abstract);
			a.assert(M.children);
			a.equal(M.children.length, 1);

			const [m1] = M.children;
			a.ok(m1.flags & Flags.Abstract);
			a.ok(m1.flags & Flags.Public);
			a.equal(m1.name, 'm1');
		});
	});

	a.test('export clause', (a: TestApi) => {
		const [A, B] = parseExports(
			`const A = 'test'; const B = false; export { A };`,
		);
		a.ok(!B);
		a.ok(A);
		a.assert(A.type);
		a.equal(A.type.type, StringType);
		a.ok(A.flags & Flags.Export);
	});

	a.test('JSOoc comments', (a: TestApi) => {
		const [A] = parse(`
			/**
			 * Function Description
			 * @return Return Comment
			 * Second Line Comment
			 * @custom Custom Tag
			 * @param p1 param1
			 * @param p2 param2
			 * @deprecated
			 */
			 function fn(p1: boolean, p2: string) { }
		`);

		a.assert(A.docs);
		a.assert(A.docs.content);
		a.equal(A.docs.content[0].value, 'Function Description');
		a.equal(A.docs.content[1].tag, 'return');
		a.equal(A.docs.content[1].value, 'Return Comment\nSecond Line Comment');
		a.equal(A.docs.content[2].tag, 'custom');
		a.equal(A.docs.content[2].value, 'Custom Tag');
		a.ok(A.flags & Flags.Deprecated);
		a.assert(A.parameters);
		const [p1, p2] = A.parameters;
		a.assert(p1.docs);
		a.assert(p2.docs);
		a.equal(p1.docs.content?.[0].value, 'param1');
		a.equal(p2.docs.content?.[0].value, 'param2');
	});

	test('JSDOC - example', (a: TestApi) => {
		const [A] = parse(`
			/**
			 * Content
			 * @example <caption>Demo Title</caption>
			 *   <div>Hello</div>
			 * @example
			 * <div>Example 2</div>
			 */
			 function fn() { }
		`);

		a.assert(A.docs);
		a.assert(A.docs.content);
		a.equal(A.docs.content.length, 3);
		const [c1, c2, c3] = A.docs.content;
		a.equal(c1.value, 'Content');
		a.equal(c2.value, '<caption>Demo Title</caption>\n<div>Hello</div>');
		a.equal(c3.value, '<div>Example 2</div>');
	});

	test('JSDOC - see', (a: TestApi) => {
		const [fn] = parse(`
			/**
			 * @see A
			 */
			 function fn() { }
		`);

		a.assert(fn, 'Documentation generated');
		a.assert(fn.docs);
		a.assert(fn.docs.content);
		a.equal(fn.docs.content.length, 1);

		const see = fn.docs.content[0];
		a.equal(see.tag, 'see');
		a.equal(see.value, 'A');
	});

	a.test('JSDOC - see with reference', (a: TestApi) => {
		const [fn] = parse(`
			/**
			 * Description
			 * @see A
			 * @example
			 * <cxl-test></cxl-test>
			 */
			 function fn() { }
			 class A { }
		`);

		a.assert(fn, 'Documentation generated');
		a.assert(fn.docs);
		a.assert(fn.docs.content);
		a.equal(fn.docs.content.length, 3);

		const see = fn.docs.content[1];
		a.equal(see.tag, 'see');
		a.equal(see.value, 'A');
	});

	a.test('@link reference', (a: TestApi) => {
		const [fn] = parse(`
/**
 * Link {@link ABC} inline.
 */
export interface A {}
export interface ABC {};
		`);
		a.assert(fn.docs?.content?.[0].value);
		const val = fn.docs.content[0].value;
		a.assert(Array.isArray(val));
		a.equal(val.length, 3);
		a.equal(val[1].tag, 'link');
		a.equal(val[1].value, 'ABC');
	});

	a.test('type alias', a => {
		const [B, type, E, I, A, C, D, F, G, H] = parse(`
			export type B<T> = (val: T) => void;	
			export type Operator = boolean | string | number;
			export type E = 'a' | 'b' | 'c';
			export type Operator2<T, T2 = T> = Map<T, T2>	
			type A<T> = (val: T) => void;
			type C = Record<keyof Map<any, any>, typeof Set>;
			type D = 'a' | 'b' | 'c';
			type F<T> = { [P in keyof T]: T[P]; }
			type G<T> = { [P in keyof T]: T[P]; } & { name: string };
			type H = \`\${number} \${true|false}\`	
		`);

		a.test('function', (a: TestApi) => {
			a.assert(A.type);
			const type = A.type;
			a.equal(type.kind, Kind.FunctionType);
			a.assert(type.parameters);
			a.equal(type.parameters.length, 1);
			a.equal(type.type, VoidType);
		});

		a.test('exported', (a: TestApi) => {
			a.assert(B.type);
			a.equal(B.kind, Kind.TypeAlias);
			const type = B.type;
			a.equal(type.kind, Kind.FunctionType);
			a.assert(type.parameters);
			a.equal(type.parameters.length, 1);
			a.equal(type.type, VoidType);
		});

		a.test('export literal union', (a: TestApi) => {
			a.equal(E.kind, Kind.TypeAlias);
			a.assert(E.type?.children);
			a.equal(E.type.children.length, 3);
			a.equal(E.type.children[0].name, `'a'`);
			a.equal(E.type.children[1].name, `'b'`);
			a.equal(E.type.children[2].name, `'c'`);
		});

		a.test('type parameters', a => {
			const type = I;
			a.ok(type.id);
			a.equal(type.name, 'Operator2');
			a.equal(type.kind, Kind.TypeAlias);
			a.ok(type.typeParameters);

			if (type.typeParameters) {
				const [T, T2] = type.typeParameters;

				a.equal(type.typeParameters.length, 2);
				a.equal(T.name, 'T');
				a.equal(T.kind, Kind.TypeParameter);
				a.equal(T2.name, 'T2');
				a.equal(T2.value, 'T');
			}
		});

		a.test('Record', (a: TestApi) => {
			a.assert(C.type);
			a.equal(C.kind, Kind.TypeAlias);
			const type = C.type;
			a.equal(type.kind, Kind.Reference);
			a.equal(type.name, 'Record');
			a.assert(type.typeParameters);
			const [p1, p2] = type.typeParameters;
			a.equal(p1.kind, Kind.Keyof);
			a.assert(p1.type);
			a.equal(p1.type.name, 'Map');
			a.equal(p2.name, 'Set');
		});

		a.test('type declaration - union type', (a: TestApi) => {
			a.ok(type.id);
			a.equal(type.name, 'Operator');
			a.equal(type.kind, Kind.TypeAlias);

			a.assert(type.type);
			a.assert(type.type.children);

			a.equal(type.type.children.length, 3);
			const [t1, t2, t3] = type.type.children;
			a.equal(t1, BooleanType);
			a.equal(t2, StringType);
			a.equal(t3, NumberType);
		});

		a.test('literal union', (a: TestApi) => {
			a.equal(D.kind, Kind.TypeAlias);
			a.assert(D.type?.children);
			a.equal(D.type.children.length, 3);
			a.equal(D.type.children[0].name, `'a'`);
			a.equal(D.type.children[1].name, `'b'`);
			a.equal(D.type.children[2].name, `'c'`);
		});

		a.test('Mapped type', (a: TestApi) => {
			a.equal(F.name, 'F');
			a.assert(F.type);
			const sig = F.type;
			a.equal(sig.name, '');
		});

		a.test('Intersection type', (a: TestApi) => {
			a.equal(G.name, 'G');
			a.assert(G.type);
			const sig = G.type;
			a.equal(sig.name, '');
		});

		a.test('String Literal Types', (a: TestApi) => {
			a.assert(H.type);
			a.equal(H.type.name, '`${number} ${true | false}`');
			a.equal(H.type.kind, Kind.Literal);
		});
	});

	test('constructor type', (a: TestApi) => {
		const [A] = parse(`function fn(ctor: new (a: string)=>boolean) {}`);
		a.assert(A.parameters);
		const type = A.parameters[0].type;
		a.assert(type);
		a.equal(type.kind, Kind.ConstructorType);
		a.assert(type.parameters);
		a.equal(type.parameters[0].type, StringType);
		a.equal(type.type, BooleanType);
	});

	test('tuple type', (a: TestApi) => {
		const [A] = parse(`let A:[string, boolean, ...number[]];`);
		a.assert(A.type);
		a.assert(A.type.children);
		const [t1, t2, t3] = A.type.children;
		a.equal(t1, StringType);
		a.equal(t2, BooleanType);
		a.equal(t3.kind, Kind.Array);
		a.ok(t3.flags & Flags.Rest);
	});

	test('function - full', (a: TestApi) => {
		const [A] = parse(`/**
 * Catches errors on the observable.
 *
 * @param selector A function that takes as arguments the error err,  and source, which
 *  is the source observable. The observable
 *  returned will be used to continue the observable chain.
 *
 */
export function catchError<T, T2>(
	selector: (err: any, source: Set<T>) => Set<T2> | void
) { return {} as any; }`);
		a.ok(A);
		a.assert(A.docs);
		a.equal(A.docs.content?.[0].value, 'Catches errors on the observable.');
		a.ok(A.flags & Flags.Export);
		a.equal(A.name, 'catchError');
		a.assert(A.typeParameters);
		a.equal(A.typeParameters.length, 2);
		const [T, T2] = A.typeParameters;
		a.equal(T.name, 'T');
		a.equal(T2.name, 'T2');

		a.assert(A.parameters);
		a.equal(A.parameters.length, 1);
		const [selector] = A.parameters;
		a.equal(selector.name, 'selector');
		a.assert(selector.type);
		const fnType = selector.type;
		a.equal(fnType.kind, Kind.FunctionType);
		a.assert(fnType.type);
		a.equal(fnType.type.kind, Kind.TypeUnion);
		a.assert(fnType.type.children);
		const [u1, u2] = fnType.type.children;
		a.assert(u1.typeParameters);
		a.equal(u1.typeParameters.length, 1);
		a.equal(u2, VoidType);
	});

	test('conditional type', (a: TestApi) => {
		const [A] = parse(`
function concat<R extends Set<any>[]>(
	...observables: R
): R extends (infer U)[] ? Set<U> : never { return {} as any; }
		`);

		a.ok(A);
		a.assert(A.type);
		a.equal(A.type.kind, Kind.ConditionalType);
	});

	test('Type Reference', (a: TestApi) => {
		const [Operator, map] = parse(`
class Operator<T> { };
function op<T>() { return new Operator<T>(); }
		`);
		a.ok(Operator);
		a.ok(map);
		a.assert(map.type);
		a.equal(map.type.kind, Kind.Reference);
		a.equal(map.type.type, Operator);
		a.assert(map.type.typeParameters);
		a.assert(map.typeParameters);
		a.equal(map.type.typeParameters[0].type, map.typeParameters[0]);
	});

	a.test('Type Reference - Type Alias', (a: TestApi) => {
		const [Operator, operator, map] = parse(`
type Operator<T> = Set<T>;
export function operator<T>(): Operator<T> { return new Set<T> }
function map<T>() {	return operator<T>(); }
		`);
		a.ok(Operator);
		a.ok(operator);
		a.ok(map);
		a.assert(map.type);
		a.equal(map.type.kind, Kind.Reference);
		a.equal(map.type.type, Operator);
		a.assert(map.type.typeParameters);
		a.assert(map.typeParameters);
		a.equal(map.type.typeParameters[0].type, map.typeParameters[0]);
	});

	a.test('Enum', (a: TestApi) => {
		const [E] = parse('enum E { Zero, One="1", Two=3 }');
		a.assert(E.children);
		a.equal(E.children.length, 3);
		a.equal(E.children[0].name, 'Zero');
		a.equal(E.children[0].value, '0');
		a.equal(E.children[1].name, 'One');
		a.equal(E.children[1].value, '"1"');
		a.equal(E.children[1].kind, Kind.Property);
		a.equal(E.children[2].name, 'Two');
		a.equal(E.children[2].value, '3');
		a.equal(E.children[2].kind, Kind.Property);
	});

	a.test('object literal parameter type', (a: TestApi) => {
		const [fn] = parse(`function fn(p: { children: Set<any> }) { }`);
		a.assert(fn.parameters);
		const [p] = fn.parameters;
		a.assert(p.type);
		a.equal(p.type.kind, Kind.ObjectType);
		a.assert(p.type.children);
		const children = p.type.children[0];
		a.equal(children.name, 'children');
		a.assert(children.type);
		a.equal(children.kind, Kind.Property);
		a.equal(children.type.name, 'Set');
	});

	a.test('object literal type', (a: TestApi) => {
		const [A] = parse(
			`const A: { children?(): void; b?: { nested: boolean } } = {}`,
		);
		a.assert(A.type);
		a.assert(A.type.children);
		a.equal(A.type.children.length, 2);
		a.equal(A.type.kind, Kind.ObjectType);
		const [children, b] = A.type.children;
		a.equal(children.name, 'children');
		a.assert(children.type);
		a.equal(children.kind, Kind.Method);
		a.equal(children.type.name, 'void');

		a.equal(b.name, 'b');
		a.assert(b.type?.children);
		a.equal(b.type.children.length, 1);
		a.equal(b.type.children[0].kind, Kind.Property);
	});

	a.test('object literal infered type', (a: TestApi) => {
		const [fn] = parse(
			`function fn(four: string) { return { one: 1, two: new Set(), three() {return true}, four, five: { nested: true } }; }`,
		);
		a.assert(fn.type);
		a.equal(fn.type.kind, Kind.ObjectType);
		a.assert(fn.type.children);
		a.equal(fn.type.children.length, 5);
		const [one, two, three, four, five] = fn.type.children;
		a.equal(one.name, 'one');
		a.equal(two.name, 'two');
		a.equal(one.type, NumberType);
		a.assert(two.type);
		a.equal(two.type.name, 'Set');
		a.assert(three.type);
		a.equal(three.name, 'three');
		a.equal(three.type, BooleanType);
		a.equal(four.name, 'four');
		a.equal(four.type, StringType);
		a.equal(five.name, 'five');
		a.assert(five.type?.children);
		a.equal(five.type.children.length, 1);
		a.equal(five.type.children[0].kind, Kind.Property);
	});

	a.test('@internal', (a: TestApi) => {
		const [A, B, C, D] = parse(
			`
	export class A { }
	/* @internal */	
	export class B { }
	export class C {
		/* @internal */ test?: number;
	}
	/*@internal*/
	export const D = "**/*";
			`,
		);
		a.ok(!(A.flags & Flags.Internal));
		a.ok(B.flags & Flags.Internal);
		a.ok(!(C.flags & Flags.Internal));
		a.assert(C.children?.[0]);
		a.ok(C.children[0].flags & Flags.Internal);
		a.ok(D.flags & Flags.Internal);
	});

	a.test('method spread parameters', (a: TestApi) => {
		const [A] = parse(`class A { test(...args) { } }`);
		a.equal(A.name, 'A');
		a.assert(A.children);
		a.equal(A.children.length, 1);
		const test = A.children[0];
		a.equal(test.name, 'test');
		a.assert(test.parameters);
		a.equal(test.parameters[0].name, 'args');
	});

	test('function spread parameters', (a: TestApi) => {
		const [A] = parse(`function test(...args) { }`);
		a.equal(A.name, 'test');
		a.assert(A.parameters);
		a.equal(A.parameters.length, 1);
		a.equal(A.parameters[0].name, 'args');
	});

	a.test('Duplicate symbols', (a: TestApi) => {
		const [A, B] = parse(
			`interface A {} declare var A: { prototype: A; new(): A }`,
		);
		a.ok(A);
		a.equal(B.type?.children?.[0].type?.type, A);
		a.equal(B.type?.children?.[1].type?.type, A);
	});

	a.test('Merge namespace declarations', (a: TestApi) => {
		const result = parse(
			`declare namespace A { export type B = 1; }
			 declare namespace A { export type C = string; }`,
		);
		const [A] = result;
		a.equal(A.kind, Kind.Namespace);
		a.equal(A.children?.length, 2);
		a.equal(A.children?.[0]?.name, 'B');
		a.equal(A.children?.[1]?.name, 'C');
	});

	a.test('namespace', (a: TestApi) => {
		const [ns, ns1] = parseExports(`
export namespace ns {
	const fn1 = function fn1() { };
	namespace ns1 {
		const f = false;
		
		export namespace ns2 { const f2 = true; }
	}
	export const fn2 = function fn2() { };
}
`);
		a.equal(ns.name, 'ns');
		a.ok(ns.flags & Flags.Export);
		a.assert(ns.children);
		a.ok(!ns1);
		const [fn2] = ns.children;

		a.test('non exported function', (a: TestApi) => {
			a.equal(fn2.name, 'fn2');
		});
	});

	a.test('namespace - nested', (a: TestApi) => {
		const [ns3, ns2, ns] = parse(`
declare module "ns" {
	namespace ns2 {
		namespace ns3 {
			const A: boolean;
		}
	}
}
`);
		a.equal(ns.name, '"ns"');
		a.equal(ns2.name, '"ns".ns2');
		a.equal(ns3.name, '"ns".ns2.ns3');
	});

	a.test('Enum Accessor', (a: TestApi) => {
		const [, C] = parse(`enum Kind { A, B } let C: Kind.A;`);
		a.equal(C.name, 'C');
		a.assert(C.type);
		const sig = C.type;
		a.equal(sig.kind, Kind.Reference);
		a.equal(sig.name, 'Kind.A');
		a.assert(sig.type);
		a.equal(sig.type.kind, Kind.Property);
	});

	a.test('interface', (a: TestApi) => {
		const [A, B, C, D, E, F, G, H, I, J, J1] = parse(`
			interface A { "a1": string; "b-2": string; }
			interface B { }
			interface C { m1: string; m2: number, m3: boolean }
			interface D extends A, B {}
			interface E {
				m1(a: string): void;
				m1(b: boolean): boolean;
				m1(c: any): boolean | void;
			}
			interface ModeFactory<T> { (config: number): T; }
			interface G { new (config: number): string; }
			interface H { [key: string]: boolean; }
			interface I { m1: string } interface I { m2: boolean }
			interface J { a: J1; } type J1 = number;
		`);

		a.test('Interface with string literal names', (a: TestApi) => {
			a.assert(A.children);
			const [a1, b2] = A.children;
			a.equal(a1.name, '"a1"');
			a.equal(b2.name, '"b-2"');
		});
		a.test('empty', (a: TestApi) => {
			a.ok(B);
			a.equal(B.name, 'B');
			a.equal(B.kind, Kind.Interface);
			a.ok(B.source);
		});

		a.test('multiple properties', (a: TestApi) => {
			a.equal(C.name, 'C');
			a.equal(C.kind, Kind.Interface);
			a.assert(C.children);
			a.equal(C.children.length, 3);
		});

		a.test('multiple inheritance', (a: TestApi) => {
			a.equal(D.name, 'D');
			a.equal(D.kind, Kind.Interface);
			a.assert(D.type);
			a.equal(D.type.kind, Kind.ClassType);
			a.assert(D.type.children);
			a.equal(D.type.children.length, 2);
			a.equal(D.type.children[0].name, 'A');
			a.equal(D.type.children[1].name, 'B');
		});

		a.test('method overload', (a: TestApi) => {
			a.assert(E.children);
			a.equal(E.children.length, 3);
			const [m1, m2, m3] = E.children;
			a.equal(m1.name, 'm1');
			a.equal(m1.type, VoidType);
			a.assert(m1.parameters);
			a.equal(m1.parameters[0].name, 'a');
			a.ok(m1.flags & Flags.Overload);
			a.equal(m2.name, 'm1');
			a.equal(m2.type, BooleanType);
			a.ok(m2.flags & Flags.Overload);
			a.assert(m2.parameters);
			a.equal(m2.parameters[0].name, 'b');
			a.equal(m3.name, 'm1');
			a.ok(m3.flags & Flags.Overload);
			a.assert(m3.parameters);
			a.equal(m3.parameters[0].name, 'c');
		});
		a.test('function interface', (a: TestApi) => {
			a.equal(F.name, 'ModeFactory');
			a.equal(F.typeParameters?.length, 1);
			a.assert(F.children);
			const sig = F.children[0];
			a.equal(F.children.length, 1);
			a.equal(sig.name, '');
			a.equal(sig.parameters?.[0]?.name, 'config');
			a.equal(sig.type?.name, 'T');
		});

		a.test('new signature', (a: TestApi) => {
			a.equal(G.name, 'G');
			a.assert(G.children);
			const sig = G.children[0];
			a.equal(G.children.length, 1);
			a.equal(sig.name, '');
			a.equal(sig.parameters?.[0]?.name, 'config');
			a.equal(sig.type?.name, 'string');
		});
		a.test('index signature', (a: TestApi) => {
			a.assert(H.children);
			const key = H.children[0];
			a.equal(key.kind, Kind.IndexSignature);
			a.equal(key.type, BooleanType);
			a.equal(key.name, '__index');
			a.assert(key.parameters);
			a.equal(key.parameters[0].name, 'key');
			a.equal(key.parameters[0].type, StringType);
		});

		a.test('merged declaration', (a: TestApi) => {
			a.assert(I.children);
			a.equal(I.children.length, 2);
			const [m1, m2] = I.children;
			a.equal(m1.name, 'm1');
			a.equal(m2.name, 'm2');
		});

		a.test('Type Alias reference', (a: TestApi) => {
			a.assert(J.children);
			a.equal(J.children.length, 1);
			const [m1] = J.children;
			a.equal(m1.name, 'a');
			a.equal(m1.type?.type, J1);
		});
	});
	a.test('interface extends class', (a: TestApi) => {
		const [A, B] = parse(
			`export class A<T> { m1?: boolean; } export interface A<T> { m2: string; }`,
		);
		a.equal(A.kind, Kind.Class);
		a.equal(B.kind, Kind.Interface);
		a.assert(A.children);
		a.equal(A.children.length, 2);
		a.equal(A.children[0].name, 'm1');
		a.equal(A.children[1].name, 'm2');
	});

	a.test('ReturnType', (a: TestApi) => {
		const [I, A] = parse(
			`interface I { m1: A }; type A = ReturnType<typeof fn>; function fn() { return { test: true } as const; }`,
		);
		a.assert(I.children);
		const [m1] = I.children;
		a.equal(m1.type?.type, A.type?.type);
	});

	a.test('EventAttribute', (a: TestApi) => {
		const [I] = parse(
			`class I { @EventAttribute() m1?: any }; function EventAttribute() { return (ctor: any)=> {} }`,
			{ experimentalDecorators: true },
		);
		a.assert(I.children);
		const [m1] = I.children;
		a.equal(m1.kind, Kind.Event);
		a.ok(m1.flags & Flags.Optional);
	});

	a.test('Resolved Type', a => {
		const [, B, C, , D, E] = parse(
			`
			type A = {a:string;b:string;c:string}; type B = keyof A; let C:B='c';
			type D1 = keyof { a: string; b: string }; type D = D1 | 'c';
			let E: D;
		`,
		);
		a.test('TypeAlias', (a: TestApi) => {
			a.assert(D.resolvedType);
			a.equal(D.resolvedType.kind, Kind.TypeUnion);
			a.equal(D.resolvedType.children?.length, 3);
		});

		a.test('Resolved Type', (a: TestApi) => {
			a.assert(B.type?.resolvedType);
			a.equal(B.type.resolvedType.kind, Kind.TypeUnion);
			a.equal(B.type.resolvedType.children?.length, 3);
			a.equal(C.type?.type?.kind, B.kind);
		});
		a.test('Variable Type', (a: TestApi) => {
			a.assert(E.type?.resolvedType);
			a.equal(E.type.resolvedType.children?.length, 3);
		});
	});

	a.test('Const destructuring', (a: TestApi) => {
		const [A, B] = parse(
			`const { a, b } = { a: true, b: 'string' }, c = 10`,
		);
		a.assert(A.children);
		const [a1, b1] = A.children;
		a.equal(a1.name, 'a');
		a.equal(b1.name, 'b');
		a.equal(B.name, 'c');
	});

	a.test('Type Types', (a: TestApi) => {
		const [A] = parse(
			`const A = [-1,2,"3",true,Symbol('symbol')] as const`,
		);
		a.assert(A.type?.type?.children);
		const [m1, m2, m3, m4, m5] = A.type.type.children;
		a.equal(m1.name, '-1');
		a.equal(m2.name, '2');
		a.equal(m3.name, '"3"');
		a.equal(m4.name, 'true');
		a.equal(m5.kind, Kind.Symbol);
	});

	a.test('markdown', (a: TestApi) => {
		const [A, B] = parseExports(`
/**
 * Regular Comment
 * @usageNotes
 * Text
 * \`\`\`
 *   import {NgIf} from '@angular/common';
 *   @Component({
 *       moreCode();
 *       line2();
 *   })
 * \`\`\`
 */
export function A() {}
 
/**
 * Regular Comment
 * @example
 * \`\`\`
 * import {NgIf} from '@angular/common';
 * @Component
 *   ({ })
 *   respect whitespace
 * @Inline tag
 * \`\`\`
 */
export function B() {}
 `);
		a.test('merge invalid jsdoc tags', (a: TestApi) => {
			a.assert(A.docs);
			a.assert(A.docs.content);
			a.equal(A.docs.content.length, 1);
		});
		a.test('merge tags inside code blocks', (a: TestApi) => {
			a.assert(B.docs);
			a.assert(B.docs.content);
			a.equal(B.docs.content.length, 2);
			a.equal(B.docs.content[1].tag, 'example');
		});
	});

	a.test('export', (a: TestApi) => {
		const [A, B, C, D, E, E2] = parseExports(
			`
			export const A = await import("url"); export type B = typeof import("url")
			export * as C from "url"
			import * as D from "url"; export { D }
			const e1=1; function E2() { } export { e1 as E, E2 }	
		`,
			{ types: ['node'] },
		);

		a.test('import type', (a: TestApi) => {
			a.equal(A.kind, Kind.Constant);
			a.equal(A.type?.kind, Kind.ImportType);
			a.equal(A.type?.name, '"url"');

			a.assert(B.type);
			a.equal(B.type.kind, Kind.ImportType);
			a.equal(B.type.name, '"url"');
		});

		a.test('export * as x', (a: TestApi) => {
			a.assert(C.type);
			a.equal(C.type.kind, Kind.ImportType);
			a.equal(C.type.name, '"url"');
		});

		a.test('export import type', (a: TestApi) => {
			a.assert(D.type);
			a.equal(D.type.kind, Kind.ImportType);
			a.equal(D.type.name, '"url"');
		});
		a.test('export', (a: TestApi) => {
			a.equal(E.name, 'E');
			a.equal(E2.name, 'E2');
			a.assert(E.type);
			a.equal(E.type.name, '1');
			a.equal(E.kind, Kind.Constant);
		});
	});
});
