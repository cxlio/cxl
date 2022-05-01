import {
	AnyType,
	BooleanType,
	Flags,
	Kind,
	NumberType,
	StringType,
	VoidType,
	parse,
	printNode,
} from './index.js';
import { TestApi, spec } from '@cxl/spec';
import * as ts from 'typescript';

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
			'function fn(_a: boolean, b="test") { return true; }'
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
		a.equal(fn.type.kind, Kind.Function);
		a.assert(fn.type.type);
		a.equal(fn.type.type, BooleanType);
		a.equal(fn.type.name, '');
	});

	a.test('type declaration - type parameters', a => {
		const [type] = parse('export type Operator<T, T2 = T> = Map<T, T2>');

		a.ok(type.id);
		a.equal(type.name, 'Operator');
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

	test('type declaration - union type', (a: TestApi) => {
		const [type] = parse(
			'export type Operator = boolean | string | number'
		);

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

	test('interface - empty', (a: TestApi) => {
		const [kls] = parse('interface TestApi { }');

		a.ok(kls);
		a.equal(kls.name, 'TestApi');
		a.equal(kls.kind, Kind.Interface);
		a.ok(kls.source);
	});

	test('interface - multiple properties', (a: TestApi) => {
		const [kls] = parse(
			`interface TestApi { m1: string; m2: number, m3: boolean }`
		);

		a.ok(kls);
		a.equal(kls.name, 'TestApi');
		a.equal(kls.kind, Kind.Interface);
		a.assert(kls.children);
		a.equal(kls.children.length, 3);
	});

	test('interface - multiple inheritance', (a: TestApi) => {
		const [A, B, C] = parse(`
			interface A { }
			interface B { }
			interface C extends A, B {}
		`);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Interface);
		a.ok(B);
		a.equal(B.name, 'B');
		a.equal(B.kind, Kind.Interface);
		a.ok(C);
		a.equal(C.name, 'C');
		a.equal(C.kind, Kind.Interface);
	});

	test('class declaration - empty class', (a: TestApi) => {
		const [kls] = parse('class TestApi { }');

		a.ok(kls);
		a.equal(kls.name, 'TestApi');
		a.ok(kls.source);
	});

	a.test('interface - method overload', (a: TestApi) => {
		const [A] = parse(`interface A {
			m1(a: string): void;
			m1(b: boolean): boolean;
			m1(c: any): boolean | void;
		}`);

		a.assert(A.children);
		a.equal(A.children.length, 3);
		const [m1, m2, m3] = A.children;
		printNode(m1);
		printNode(m2);
		printNode(m3);
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

	test('class - method overload', (a: TestApi) => {
		const [A] = parse(`class A {
			m1(a: string): void;
			m1(b: boolean): boolean;
			m1(c: any) { if (c===true) return true; }
		}`);

		a.assert(A.children);
		a.equal(A.children.length, 3);
		const [m1, m2, m3] = A.children;
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

	test('class declaration', (a: TestApi) => {
		const [kls] = parse(`class TestApi<T> extends Set<T> {
			member: T;
		}`);

		a.ok(kls);
		a.equal(kls.name, 'TestApi');
		a.equal(kls.kind, Kind.Class);
		a.assert(kls.typeParameters);
		const [T] = kls.typeParameters;
		a.equal(T.name, 'T');
		a.equal(T.kind, Kind.TypeParameter);
		a.ok(!T.type);
		a.assert(kls.children);
		a.equal(kls.children.length, 1);
		const member = kls.children[0];
		a.equal(member.name, 'member');
		a.assert(member.type);
		a.equal(member.type.kind, Kind.Reference);
		a.equal(member.type.type, T);
		a.assert(kls.type);
		a.assert(kls.type.children);
		a.equal(kls.type.children.length, 1);
		a.equal(kls.type.children[0].name, 'Set');
		/*const Tm = kls.children[1];
		a.equal(Tm.name, 'T');
		a.equal(Tm.kind, Kind.TypeParameter);*/
	});

	test('class constructor', (a: TestApi) => {
		const [kls] = parse(
			`class Kls { constructor(public t: string, s: boolean) { } }`
		);
		a.assert(kls.children);
		a.equal(kls.children.length, 2);
		const [ctor, t] = kls.children;
		a.equal(ctor.name, 'constructor');
		a.assert(ctor.parameters);
		a.equal(ctor.parameters.length, 2);
		a.equal(ctor.kind, Kind.Constructor);
		a.equal(t.name, 't');
		a.equal(t.type, StringType);
		a.ok(t.flags & Flags.Public);
		a.equal(t.kind, Kind.Property);
	});

	test('class implements interface', (a: TestApi) => {
		const [A, B, C] = parse(`
			interface A { }
			interface B { }
			class C implements A, B {}
		`);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Interface);
		a.ok(B);
		a.equal(B.name, 'B');
		a.equal(B.kind, Kind.Interface);
		a.ok(C);
		a.equal(C.name, 'C');
		a.equal(C.kind, Kind.Class);

		a.assert(C.type);
		a.assert(C.type.children);
		a.equal(C.type.kind, Kind.ClassType);
		a.equal(C.type.children.length, 2);

		const [AType, BType] = C.type.children;
		a.equal(AType.type, A);
		a.equal(AType.name, 'A');
		a.equal(BType.type, B);
		a.equal(BType.name, 'B');
	});

	test('class decorators - cxl Augment', (a: TestApi) => {
		const [role, A, B] = parse(
			`
			function role(str: string) { }
			function Augment(a) { return ctor => { }; }
			@Augment(role('roleName'))
			class B { static tagName = 'cxl-test'; }`,
			{ experimentalDecorators: true }
		);
		a.ok(role);
		a.ok(A);
		a.equal(B.kind, Kind.Component);
		a.assert(B.docs);
		a.equal(B.docs.role, 'roleName');
		a.equal(B.docs.tagName, 'cxl-test');
	});

	test('class extends class and implements interface', (a: TestApi) => {
		const [A, B, C] = parse(`
			interface A { }
			class B { }
			class C extends B implements A {}
		`);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Interface);
		a.ok(B);
		a.equal(B.name, 'B');
		a.equal(B.kind, Kind.Class);
		a.ok(C);
		a.equal(C.name, 'C');
		a.equal(C.kind, Kind.Class);
	});

	test('class access modifier', (a: TestApi) => {
		const [A] = parse(`
			class A { static s1; public readonly m1 = 'str'; private m2 = 10; protected m3 = false; }
		`);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Class);
		a.assert(A.children);
		a.equal(A.children.length, 4);

		const [s1, m1, m2, m3] = A.children;
		a.ok(s1.flags & Flags.Static);
		a.ok(m1.flags & Flags.Public);
		a.ok(m1.flags & Flags.Readonly);
		a.ok(m2.flags & Flags.Private);
		a.ok(m3.flags & Flags.Protected);
	});

	test('class members', (a: TestApi) => {
		const [A] = parse(
			`
			class A { m1 = 'str'; m2() { } get m3() { return undefined; } set m3(val) {} m4 = new Set<any>(); }
		`,
			{ target: ts.ScriptTarget.ES2017 }
		);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Class);
		a.assert(A.children);
		a.equal(A.children.length, 5);

		const [m1, m2, m3, m4, m5] = A.children;
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

	test('class method', (a: TestApi) => {
		const [Alias, A] = parse(`
			type Alias = Set<any>;
			class A { m1(): Alias { return new Set<any>(); } }
		`);

		a.assert(A.children);
		const m1 = A.children[0];
		a.assert(m1.type);
		a.equal(m1.type.kind, Kind.Reference);
		a.equal(m1.type.type, Alias);
	});

	test('class - computed property name', (a: TestApi) => {
		const [name, A] = parse(`
			const name = 'm1';
			class A { [name]() { return true; } }
		`);

		a.equal(name.value, "'m1'");
		a.assert(A.children);
		a.equal(A.children[0].name, '[name]');
	});

	test('class methods', (a: TestApi) => {
		const [A] = parse(`
			abstract class A {
				m1() { return 'hello'; }
				static m2(): boolean { return false; }
				abstract m3(): number;
				constructor() {}
			}
		`);

		a.ok(A);
		a.assert(A.children);
		a.equal(A.children.length, 4);

		const [m1, m2, m3, m4] = A.children;
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

	test('class abstract', (a: TestApi) => {
		const [A] = parse(`
			abstract class A { abstract m1; }
		`);

		a.ok(A);
		a.equal(A.name, 'A');
		a.equal(A.kind, Kind.Class);
		a.ok(A.flags & Flags.Abstract);
		a.assert(A.children);
		a.equal(A.children.length, 1);

		const [m1] = A.children;
		a.ok(m1.flags & Flags.Abstract);
		a.ok(m1.flags & Flags.Public);
		a.equal(m1.name, 'm1');
	});

	test('export clause', (a: TestApi) => {
		const [A, B] = parse(`
			const A = 'test';
			export { A };
		`);

		a.ok(!B);
		a.ok(A);
		a.assert(A.type);
		a.equal(A.type.type, StringType);
		a.ok(A.flags & Flags.Export);
	});

	test('JSOoc comments', (a: TestApi) => {
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

	test('type alias - function', (a: TestApi) => {
		const [A] = parse(`type A<T> = (val: T) => void;`);
		a.assert(A.type);
		const type = A.type;
		a.equal(type.kind, Kind.FunctionType);
		a.assert(type.parameters);
		a.equal(type.parameters.length, 1);
		a.equal(type.type, VoidType);
	});

	test('type alias - exported', (a: TestApi) => {
		const [A] = parse(`export type A<T> = (val: T) => void;`);
		a.assert(A.type);
		a.equal(A.kind, Kind.TypeAlias);
		const type = A.type;
		a.equal(type.kind, Kind.FunctionType);
		a.assert(type.parameters);
		a.equal(type.parameters.length, 1);
		a.equal(type.type, VoidType);
	});

	test('type alias - Record', (a: TestApi) => {
		const [A] = parse(`type A = Record<keyof Map<any, any>, typeof Set>;`);
		a.assert(A.type);
		a.equal(A.kind, Kind.TypeAlias);
		const type = A.type;
		a.equal(type.kind, Kind.Reference);
		a.equal(type.name, 'Record');
		a.assert(type.typeParameters);
		const [p1, p2] = type.typeParameters;
		a.equal(p1.kind, Kind.Keyof);
		a.assert(p1.type);
		a.equal(p1.type.name, 'Map');
		a.equal(p2.name, 'Set');
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

	test('Type Reference - Type Alias', (a: TestApi) => {
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

	test('Enum', (a: TestApi) => {
		const [E] = parse('enum E { One, Two=3 }');
		a.assert(E.children);
		a.equal(E.children.length, 2);
		a.equal(E.children[0].name, 'One');
		a.equal(E.children[0].kind, Kind.Property);
		a.equal(E.children[1].name, 'Two');
		a.equal(E.children[1].value, '3');
		a.equal(E.children[1].kind, Kind.Property);
	});

	test('object literal type', (a: TestApi) => {
		const [fn] = parse(`function fn(p: { children: Set<any> }) { }`);
		a.assert(fn.parameters);
		const [p] = fn.parameters;
		a.assert(p.type);
		a.equal(p.type.kind, Kind.ObjectType);
		a.assert(p.type.children);
		const children = p.type.children[0];
		a.equal(children.name, 'children');
		a.assert(children.type);
		a.equal(children.type.name, 'Set');
	});

	test('object literal infered type', (a: TestApi) => {
		const [fn] = parse(
			`function fn(four: string) { return { one: 1, two: new Set(), three() {return true}, four }; }`
		);
		a.assert(fn.type);
		a.equal(fn.type.kind, Kind.ObjectType);
		a.assert(fn.type.children);
		const [one, two, three, four] = fn.type.children;
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
	});

	test('index signature', (a: TestApi) => {
		const [A] = parse(`interface A { [key: string]: boolean; }`);
		a.assert(A.children);
		const key = A.children[0];
		a.equal(key.type, BooleanType);
		a.assert(key.parameters);
		a.equal(key.parameters[0].name, 'key');
		a.equal(key.parameters[0].type, StringType);
	});

	test('export', (a: TestApi) => {
		const [A, B] = parse(`function B() { } export { Set as A, B }`);
		a.equal(A.name, 'A');
		a.equal(B.name, 'B');
		a.assert(A.type);
		a.equal(A.type.name, 'Set');
		a.equal(A.kind, Kind.Export);
	});

	test('interface extends class', (a: TestApi) => {
		const [A, B] = parse(
			`export class A<T> { m1?: boolean; } export interface A<T> { m2: string; }`
		);
		a.ok(A);
		a.ok(B);
		a.assert(A.children);
		a.equal(A.children.length, 2);
		a.equal(A.children[0].name, 'm1');
		a.equal(A.children[1].name, 'm2');
	});

	test('@internal', (a: TestApi) => {
		const [A, B] = parse(
			`/* @internal */
				export class B { }
				// TODO test
				export class C { 
					/* @internal */ test?: number;
				}`
		);
		a.ok(A.flags & Flags.Internal);
		a.ok(!(B.flags & Flags.Internal));
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

	a.test('function interface', (a: TestApi) => {
		const [A] = parse(`interface ModeFactory<T> { (config: number): T; }`);
		a.equal(A.name, 'ModeFactory');
		a.equal(A.typeParameters?.length, 1);
		a.assert(A.children);
		const sig = A.children[0];
		a.equal(A.children.length, 1);
		a.equal(sig.name, '');
		a.equal(sig.parameters?.[0]?.name, 'config');
		a.equal(sig.type?.name, 'T');
	});

	a.test('interface new signature', (a: TestApi) => {
		const [A] = parse(`interface A { new (config: number): string; }`);
		a.equal(A.name, 'A');
		a.assert(A.children);
		const sig = A.children[0];
		a.equal(A.children.length, 1);
		a.equal(sig.name, '');
		a.equal(sig.parameters?.[0]?.name, 'config');
		a.equal(sig.type?.name, 'string');
	});

	a.test('Mapped type', (a: TestApi) => {
		const [A] = parse(`type A<T> = { [P in keyof T]: T[P]; }`);
		a.equal(A.name, 'A');
		a.assert(A.type);
		const sig = A.type;
		a.equal(sig.name, '');
	});

	a.test('Intersection type', (a: TestApi) => {
		const [A] = parse(
			`type A<T> = { [P in keyof T]: T[P]; } & { name: string };`
		);
		a.equal(A.name, 'A');
		a.assert(A.type);
		const sig = A.type;
		a.equal(sig.name, '');
	});

	a.test('Duplicate symbols', (a: TestApi) => {
		const [A, B] = parse(
			`interface A {} declare var A: { prototype: A; new(): A }`
		);
		a.ok(A);
		a.equal(B.type?.children?.[0].type?.type, A);
		a.equal(B.type?.children?.[1].type?.type, A);
	});

	a.test('Merge namespace declarations', (a: TestApi) => {
		const result = parse(
			`declare namespace A { export type B = 1; }
			 declare namespace A { export type C = string; }
			 export = A`
		);
		a.ok(result);
		const [A] = result;
		a.equal(A.kind, Kind.Namespace);
		a.equal(A.children?.length, 2);
		a.equal(A.children?.[0]?.name, 'B');
		a.equal(A.children?.[1]?.name, 'C');
	});

	/*a.testOnly('Namespace const declaration', (a: TestApi) => {
		const [A] = parse(`export namespace A { const B:number; }`);
		console.log(A);
		a.equal(A.name, 'A');
		a.assert(A.type);
		const sig = A.type;
		a.equal(sig.name, '');
	});*/
});
