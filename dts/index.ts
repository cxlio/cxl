import * as ts from 'typescript';
import {
	ModifierFlags,
	ParseConfigFileHost,
	ParsedCommandLine,
	SyntaxKind as SK,
	TypeFlags as TF,
	createProgram,
	getParsedCommandLineOfConfigFile,
	sys,
} from 'typescript';
import { relative, resolve } from 'path';

type SerializerMap = {
	[K in SK]?: (node: any) => Node;
};

type Index = Record<number, Node>;

export enum Kind {
	Unknown = SK.Unknown,
	Variable = SK.VariableDeclaration,
	TypeAlias = SK.TypeAliasDeclaration,
	TypeParameter = SK.TypeParameter,
	Interface = SK.InterfaceDeclaration,
	TypeUnion = SK.UnionType,
	Reference = SK.TypeReference,
	Module = SK.SourceFile,
	Class = SK.ClassDeclaration,
	Parameter = SK.Parameter,
	Property = SK.PropertyDeclaration,
	Method = SK.MethodDeclaration,
	Getter = SK.GetAccessor,
	Setter = SK.SetAccessor,
	Constructor = SK.Constructor,
	Array = SK.ArrayType,
	Function = SK.FunctionDeclaration,
	FunctionType = SK.FunctionType,
	ConditionalType = SK.ConditionalType,
	Parenthesized = SK.ParenthesizedType,
	Infer = SK.InferType,
	IndexedType = SK.IndexedAccessType,
	Enum = SK.EnumDeclaration,
	Literal = SK.LiteralType,
	IndexSignature = SK.IndexSignature,
	Export = SK.ExportSpecifier,
	Keyof = SK.KeyOfKeyword,
	Typeof = SK.TypeQuery,
	ConstructorType = SK.ConstructorType,
	Tuple = SK.TupleType,
	ThisType = SK.ThisType,
	Constant = 1001,
	BaseType = 1002,
	ClassType = 1003,
	ObjectType = 1004,
	Component = 1005,
	Attribute = 1006,
}

export interface DocumentationContent {
	tag?: string;
	value: string;
}

export interface Documentation {
	decorator?: boolean;
	content?: DocumentationContent[];
	tagName?: string;
	role?: string;
}

export enum Flags {
	// From ts.ModifierFlags
	None = 0,
	Export = 1,
	Public = 4,
	Private = 8,
	Protected = 16,
	Static = 32,
	Readonly = 64,
	Abstract = 128,
	Async = 256,
	Default = 512,
	Deprecated = 8192,
	// Custom Flags
	Overload = 16384,
	External = 32768,
	DefaultLibrary = 65536,
	DeclarationMerge = 131072,
	Rest = 2 ** 18,
	Optional = 2 ** 19,
}

export interface Source {
	name: string;
	sourceFile: ts.SourceFile;
	index: number;
}

export interface Node {
	id?: number;
	name: string;
	kind: Kind;
	source?: Source | Source[];
	flags: Flags;
	docs?: Documentation;
	value?: string;
	type?: Node;
	typeParameters?: Node[];
	parameters?: Node[];
	children?: Node[];
	extendedBy?: Node[];
	parent?: Node;
}

export interface Output {
	index: Index;
	config: ParsedCommandLine;
	modules: Node[];
}

export const NumberType = createBaseType('number'),
	StringType = createBaseType('string'),
	BooleanType = createBaseType('boolean'),
	UndefinedType = createBaseType('undefined'),
	NullType = createBaseType('null'),
	VoidType = createBaseType('void'),
	AnyType = createBaseType('any'),
	UnknownType = createBaseType('unknown'),
	BigIntType = createBaseType('BigInt'),
	NeverType = createBaseType('never');

const dtsNode = Symbol('dtsNode');

let currentIndex: Index;
let program: ts.Program;
let compilerHost: ts.CompilerHost;
let config: ts.ParsedCommandLine;
let sourceFiles: ts.SourceFile[];
let typeChecker: ts.TypeChecker;
let currentId = 1;

const parseConfigHost: ParseConfigFileHost = {
	useCaseSensitiveFileNames: true,
	readDirectory: sys.readDirectory,
	getCurrentDirectory: sys.getCurrentDirectory,
	fileExists: sys.fileExists,
	readFile: sys.readFile,
	onUnRecoverableConfigFileDiagnostic(e) {
		throw e;
	},
};

function createBaseType(name: string): Node {
	return { name, kind: Kind.BaseType, flags: 0 };
}

function parseTsConfig(tsconfig: string) {
	let parsed: ParsedCommandLine | undefined;
	try {
		parsed = getParsedCommandLineOfConfigFile(
			tsconfig,
			{},
			parseConfigHost
		);
	} catch (e) {
		throw new Error(e.messageText);
	}

	if (!parsed) throw new Error(`Could not parse config file "${tsconfig}"`);
	return parsed;
}

function getKind(node: ts.Node): Kind {
	switch (node.kind) {
		case SK.VariableDeclaration:
			return node.parent.flags === ts.NodeFlags.Const
				? Kind.Constant
				: Kind.Variable;
		case SK.TypeLiteral:
		case SK.ObjectLiteralExpression:
			return Kind.ObjectType;
		case SK.PropertySignature:
		case SK.EnumMember:
			return Kind.Property;
	}
	return (node.kind as any) as Kind;
}

function getNodeSource(node: ts.Node): Source {
	const sourceFile = node.getSourceFile();
	const result = sourceFile
		? {
				name: relative(process.cwd(), sourceFile.fileName),
				index: node.pos,
		  }
		: undefined;
	if (result)
		Object.defineProperty(result, 'sourceFile', {
			value: sourceFile,
			enumerable: false,
		});
	return result as Source;
}

function getNodeName(node: ts.Node): string {
	if (ts.isLiteralTypeNode(node) || ts.isComputedPropertyName(node))
		return node.getText();

	const anode = node as any;

	if (anode.name) return anode.name.escapedText || anode.name.getText();

	return '';
}

function createNode(node: ts.Node, extra?: Partial<Node>): Node {
	const result = (node as any)[dtsNode] || {};

	result.source = result.source || getNodeSource(node);
	result.kind = extra?.kind || result.kind || getKind(node);
	result.name = result.name || getNodeName(node);
	result.flags = result.flags || 0;

	if (extra) Object.assign(result, extra);

	return ((node as any)[dtsNode] = result);
}

function isOwnFile(sourceFile: ts.SourceFile) {
	return sourceFile && sourceFiles.includes(sourceFile);
}

function getNodeFromDeclaration(node: ts.Node): Node {
	let result = (node as any)[dtsNode];

	if (!result) {
		const sourceFile = node.getSourceFile();
		const flags = program.isSourceFileDefaultLibrary(sourceFile)
			? Flags.DefaultLibrary
			: program.isSourceFileFromExternalLibrary(sourceFile)
			? Flags.External
			: 0;
		(node as any)[dtsNode] = result =
			flags === 0 && isOwnFile(sourceFile)
				? { id: currentId++ }
				: createNode(node, { flags: flags });
	}

	return result;
}

function isClassMember(node: Node) {
	return (
		node.kind === Kind.Property ||
		node.kind === Kind.Method ||
		node.kind === Kind.Getter ||
		node.kind === Kind.Setter
	);
}

function serialize(node: ts.Node) {
	return (Serializer[node.kind] || createNode)(node);
}

function serializeExpression(node: ts.Expression) {
	return node.getText();
}

function getFlags(flags: ts.ModifierFlags) {
	return (flags as any) as Flags;
}

/*function findSymbol(scope: ts.Node, name: string) {
	const symbols = typeChecker.getSymbolsInScope(scope, ts.SymbolFlags.Type);
	const found = symbols.find(s => s.escapedName === name);
	if (!found) console.log(name);
	return found && getSymbolReference(found);
}*/

function getNodeDocs(node: ts.Node, result: Node): Documentation {
	const jsDoc = (node as any).jsDoc as ts.JSDoc[];
	const content: DocumentationContent[] = [];
	const docs: any = { content };

	jsDoc?.forEach(doc => doc.comment && content.push({ value: doc.comment }));

	ts.getJSDocTags(node).forEach(doc => {
		const tag = doc.tagName.getText();
		const value = doc.comment;

		if (tag === 'deprecated') result.flags |= Flags.Deprecated;

		if (value && !(tag === 'param' && node.kind !== SK.Parameter))
			content.push({ tag, value });
	});

	return content.length ? docs : undefined;
}

function serializeDeclaration(node: ts.Declaration): Node {
	const result = createNode(node);

	if (!result.id) {
		result.id = currentId++;
		(node as any)[dtsNode] = result;
	}

	result.flags = getFlags(ts.getCombinedModifierFlags(node));

	const id = result.id;
	const anode = node as any;
	const docs = getNodeDocs(node, result);

	if (docs) result.docs = docs;

	if (
		isClassMember(result) &&
		!(result.flags & (ModifierFlags.Private | ModifierFlags.Protected))
	)
		result.flags = result.flags | ModifierFlags.Public;

	if (anode.typeParameters)
		result.typeParameters = anode.typeParameters.map(serialize);

	if (anode.type) result.type = serialize(anode.type);

	if (anode.initializer)
		result.value = serializeExpression(anode.initializer);

	if (anode.$$exported) result.flags = result.flags | Flags.Export;

	if (id) currentIndex[id] = result;

	return result;
}

function serializeTypeParameter(node: ts.TypeParameterDeclaration) {
	const result = serializeDeclaration(node);
	if (node.default) result.value = node.default.getText();
	return result;
}

function serializeParameter(symbol: ts.Symbol) {
	const node = symbol.valueDeclaration as ts.ParameterDeclaration;

	if (!node) throw new Error('Invalid Parameter');

	const result = serializeDeclarationWithType(node);

	if (result.flags & (Flags.Private | Flags.Public | Flags.Protected))
		result.kind = Kind.Property;

	if (node.dotDotDotToken) result.flags = result.flags | Flags.Rest;
	if (node.questionToken) result.flags = result.flags | Flags.Optional;

	return result;
}

function getSymbolReference(
	symbol: ts.Symbol,
	typeArgs?: readonly ts.Type[]
): Node {
	const node = symbol.valueDeclaration || symbol.declarations[0];

	if (ts.isExportSpecifier(node)) {
		const local = typeChecker.getExportSpecifierLocalTargetSymbol(node);
		if (!local) throw new Error('Invalid Symbol');
		const result = getSymbolReference(local);
		result.name = symbol.getName();
		return result;
	}

	return {
		name: symbol.getName(),
		flags: 0,
		source: getNodeSource(node),
		kind: Kind.Reference,
		type: getNodeFromDeclaration(node),
		typeParameters:
			typeArgs && typeArgs.length
				? typeArgs.map(serializeType)
				: undefined,
	};
}

function isReferenceType(type: ts.Type) {
	return (
		type.flags & TF.Enum ||
		type.flags & TF.UniqueESSymbol ||
		type.isClassOrInterface() ||
		type.isTypeParameter() ||
		(type as any).objectFlags & ts.ObjectFlags.Reference
	);
}

function serializeIndexedAccessType(type: ts.IndexedAccessType): Node {
	return {
		name: '',
		kind: Kind.IndexedType,
		flags: 0,
		children: [
			serializeType(type.objectType),
			serializeType(type.indexType),
		],
	};
}

function serializeSymbol(symbol: ts.Symbol): Node {
	return serialize(symbol.valueDeclaration || symbol.declarations[0]);
}

function serializeKeyofType(type: ts.IndexType): Node {
	return {
		name: typeChecker.typeToString(type),
		kind: Kind.Keyof,
		type: serializeType(type.type),
		flags: 0,
	};
}

function serializeLiteralType(type: ts.Type, baseType: ts.Type): Node {
	return {
		name: typeChecker.typeToString(type),
		kind: Kind.Literal,
		type: serializeType(baseType),
		flags: 0,
	};
}

function serializeType(type: ts.Type): Node {
	if (type.aliasSymbol)
		return getSymbolReference(type.aliasSymbol, type.aliasTypeArguments);

	if (type.flags & TF.Any) return AnyType;
	if (type.flags & TF.Unknown) return UnknownType;
	if (type.flags & TF.Void) return VoidType;
	if (type.flags & TF.Boolean) return BooleanType;
	if (type.flags & TF.BigInt) return BigIntType;
	if (type.flags & TF.Null) return NullType;
	if (type.flags & TF.Number) return NumberType;
	if (type.flags & TF.String) return StringType;
	if (type.flags & TF.Undefined) return UndefinedType;
	if (type.flags & TF.Never) return NeverType;
	if (type.flags & TF.Literal) {
		const baseType = typeChecker.getBaseTypeOfLiteralType(type);

		if (type.isStringLiteral() || type.isNumberLiteral())
			return serializeLiteralType(type, baseType);

		return serializeType(baseType);
	}

	if (type.flags & TF.Index) return serializeKeyofType(type as ts.IndexType);
	if (type.flags & TF.IndexedAccess)
		return serializeIndexedAccessType(type as ts.IndexedAccessType);

	if (isReferenceType(type))
		return getSymbolReference(
			type.symbol,
			typeChecker.getTypeArguments(type as ts.TypeReference)
		);

	if (type.isUnionOrIntersection())
		return {
			name: '',
			flags: 0,
			kind: Kind.TypeUnion,
			children: type.types.map(serializeType),
		};

	if (type.symbol) return serializeSymbol(type.symbol);

	return {
		name: typeChecker.typeToString(type),
		kind: Kind.Unknown,
		flags: 0,
	};
}

function serializeFunction(
	node: ts.FunctionLikeDeclaration | ts.MethodSignature
) {
	const result = serializeDeclaration(node);
	const signature = typeChecker.getSignatureFromDeclaration(node);

	if (node.kind === SK.ArrowFunction || node.kind === SK.FunctionExpression)
		result.kind = Kind.Function;
	else if (node.kind === SK.MethodSignature) result.kind = Kind.Method;

	if (node.typeParameters)
		result.typeParameters = node.typeParameters.map(serialize);

	result.parameters = signature
		? signature.getParameters().map(serializeParameter)
		: node.parameters.map(serialize);

	const type = typeChecker.getTypeAtLocation(node);
	const allSignatures = typeChecker.getSignaturesOfType(
		type,
		ts.SignatureKind.Call
	);

	if (
		allSignatures?.length > 1 &&
		!typeChecker.isImplementationOfOverload(node)
	)
		result.flags = result.flags | Flags.Overload;

	if (signature && !result.type) {
		const type = signature.getReturnType();
		result.type = type && serializeType(type);
	}

	return result;
}

function serializeArray(node: ts.ArrayTypeNode) {
	const result = createNode(node, { name: 'Array' });
	// Should we store it as typeParameter?
	result.type = serialize(node.elementType);
	return result;
}

function getCxlDecorator(node: ts.Declaration, name: string) {
	return (
		node.decorators &&
		node.decorators.find(
			deco =>
				ts.isCallExpression(deco.expression) &&
				ts.isIdentifier(deco.expression.expression) &&
				deco.expression.expression.escapedText === name
		)
	);
}

function isCxlAttribute(node: ts.Declaration): boolean {
	return !!(
		getCxlDecorator(node, 'Attribute') ||
		getCxlDecorator(node, 'StyleAttribute')
	);
}

function getCxlRole(node: ts.CallExpression): string {
	const id = node.arguments[0];
	return ts.isStringLiteral(id) ? id.text : '';
}

function getCxlClassMeta(node: ts.ClassDeclaration, result: Node): boolean {
	const augment = getCxlDecorator(node, 'Augment');
	const args = (augment?.expression as ts.CallExpression)?.arguments;
	const docs: Documentation = result.docs || {};

	if (augment) result.kind = Kind.Component;
	else return false;

	if (result.children) {
		const tagNode = result.children.find(
			m =>
				m.name === 'tagName' &&
				m.kind === Kind.Property &&
				m.flags & Flags.Static
		);
		if (tagNode && tagNode.value) docs.tagName = tagNode.value.slice(1, -1);
	}

	if (args) {
		args.forEach((arg, i) => {
			if (i === 0 && ts.isStringLiteral(arg)) docs.tagName = arg.text;
			else if (
				ts.isCallExpression(arg) &&
				ts.isIdentifier(arg.expression) &&
				arg.expression.escapedText === 'role'
			)
				docs.role = getCxlRole(arg);
		});
	}

	if (docs.tagName || docs.role) result.docs = docs;

	return !!augment;
}

function serializeDeclarationWithType(node: ts.Declaration): Node {
	const result = serializeDeclaration(node);

	if (isCxlAttribute(node)) result.kind = Kind.Attribute;

	if (!result.type) {
		if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
			const sig = typeChecker.getSignatureFromDeclaration(node);
			if (sig) result.type = serializeType(sig.getReturnType());
		} else {
			const type = typeChecker.getTypeAtLocation(node);
			if (type) result.type = serializeType(type);
		}
	}

	return result;
}

function pushChildren(parent: Node, children: Node[]) {
	children.forEach(
		n =>
			!n.parent &&
			Object.defineProperty(n, 'parent', {
				value: parent,
				enumerable: false,
			})
	);
	if (!parent.children) parent.children = children;
	else parent.children.push(...children);
}

function serializeObject(
	node: ts.TypeLiteralNode | ts.ObjectLiteralExpression
) {
	const result = createNode(node);
	const children = ts.isObjectLiteralExpression(node)
		? node.properties.map(serialize)
		: node.members.map(serialize);
	pushChildren(result, children);
	return result;
}

function serializeClass(node: ts.ClassDeclaration) {
	const result = serializeDeclaration(node);
	const symbol =
		typeChecker.getSymbolAtLocation(node) ||
		(node.name && typeChecker.getSymbolAtLocation(node.name));

	if (node.members) {
		pushChildren(result, node.members.map(serialize));
	}

	if (symbol) {
		if (
			ts.isInterfaceDeclaration(node) &&
			symbol.flags & ts.SymbolFlags.Class
		)
			result.flags |= Flags.DeclarationMerge;
		else {
			const exportedSymbol = typeChecker.getExportSymbolOfSymbol(symbol);
			exportedSymbol?.members?.forEach(
				s =>
					!(s.flags & ts.SymbolFlags.TypeParameter) &&
					pushChildren(
						result,
						s.declarations.flatMap(d => {
							const existing: Node = (d as any)[dtsNode];
							return existing &&
								result.children?.indexOf(existing) !== -1
								? []
								: serialize(d);
						})
					)
			);
		}
	}

	getCxlClassMeta(node, result);

	if (node.heritageClauses?.length) {
		const type: Node = (result.type = {
			flags: 0,
			kind: Kind.ClassType,
			name: '',
		});

		node.heritageClauses.forEach(heritage =>
			pushChildren(type, heritage.types.map(serialize))
		);

		type.children?.forEach(c => {
			if (c.kind === Kind.Reference && c.type)
				(c.type.extendedBy || (c.type.extendedBy = [])).push({
					name: result.name,
					type: result,
					kind: Kind.Reference,
					flags: 0,
				});
		});
	}

	return result;
}

function serializeReference(node: ts.TypeReferenceType) {
	const type = typeChecker.getTypeFromTypeNode(node);
	const symbol = type.aliasSymbol || type.symbol;
	const decl = symbol && (symbol.valueDeclaration || symbol.declarations[0]);
	const name = (ts.isTypeReferenceNode(node)
		? node.typeName
		: node.expression
	).getText();

	return createNode(node, {
		name,
		kind: Kind.Reference,
		type: decl && getNodeFromDeclaration(decl),
		typeParameters: node.typeArguments?.map(serialize),
	});
}

function serializeConditionalType(node: ts.ConditionalTypeNode) {
	return createNode(node, {
		children: [
			serialize(node.checkType),
			serialize(node.extendsType),
			serialize(node.trueType),
			serialize(node.falseType),
		],
	});
}

function serializeConstructor(node: ts.ConstructorDeclaration) {
	const result = serializeFunction(node);
	result.name = 'constructor';
	return result;
}

function serializeIndexedAccessTypeNode(node: ts.IndexedAccessTypeNode) {
	return createNode(node, {
		children: [serialize(node.objectType), serialize(node.indexType)],
	});
}

function serializeIndexSignature(node: ts.IndexSignatureDeclaration) {
	return createNode(node, {
		parameters: node.parameters.map(serialize),
		type: node.type && serialize(node.type),
	});
}

function serializeTypeOperator(node: ts.TypeOperatorNode) {
	return createNode(node, {
		kind: node.operator as any,
		type: serialize(node.type),
	});
}

function serializeTypeQuery(node: ts.TypeQueryNode) {
	return createNode(node, { name: node.exprName.getText() });
}

function serializeTuple(node: ts.TupleTypeNode) {
	return createNode(node, {
		children: node.elementTypes.map(serialize),
	});
}

function serializeRestType(node: ts.RestTypeNode) {
	const result = serialize(node.type);
	result.flags |= Flags.Rest;
	return result;
}

const Serializer: SerializerMap = {
	[SK.AnyKeyword]: () => AnyType,
	[SK.StringKeyword]: () => StringType,
	[SK.NumberKeyword]: () => NumberType,
	[SK.BooleanKeyword]: () => BooleanType,
	[SK.VoidKeyword]: () => VoidType,
	[SK.NeverKeyword]: () => NeverType,
	[SK.NullKeyword]: () => NullType,
	[SK.FunctionType]: serializeFunction,
	[SK.UndefinedKeyword]: () => UndefinedType,

	[SK.ArrayType]: serializeArray,
	[SK.FunctionDeclaration]: serializeFunction,
	[SK.ArrowFunction]: serializeFunction,
	[SK.FunctionExpression]: serializeFunction,
	[SK.TypeReference]: serializeReference,
	[SK.ExpressionWithTypeArguments]: serializeReference,
	[SK.ConditionalType]: serializeConditionalType,
	[SK.ParenthesizedType]: serializeDeclarationWithType,
	[SK.InferType](node: ts.InferTypeNode) {
		return createNode(node, {
			type: serialize(node.typeParameter),
		});
	},

	[SK.TypeQuery]: serializeTypeQuery,
	[SK.IndexedAccessType]: serializeIndexedAccessTypeNode,
	[SK.UnionType](node: ts.UnionTypeNode) {
		return createNode(node, {
			kind: Kind.TypeUnion,
			children: node.types.map(serialize),
		});
	},
	[SK.TupleType]: serializeTuple,
	[SK.EnumDeclaration]: serializeClass,
	[SK.EnumMember]: serializeDeclarationWithType,
	[SK.RestType]: serializeRestType,

	[SK.PropertySignature]: serializeDeclarationWithType,
	[SK.Constructor]: serializeConstructor,
	[SK.PropertySignature]: serializeDeclarationWithType,
	[SK.Parameter]: serializeDeclarationWithType,
	[SK.PropertyDeclaration]: serializeDeclarationWithType,
	[SK.MethodDeclaration]: serializeFunction,
	[SK.MethodSignature]: serializeFunction,
	[SK.ClassDeclaration]: serializeClass,
	[SK.TypeAliasDeclaration]: serializeDeclaration,
	[SK.TypeParameter]: serializeTypeParameter,
	[SK.InterfaceDeclaration]: serializeClass,
	[SK.VariableDeclaration]: serializeDeclarationWithType,
	[SK.ConstructorType]: serializeFunction,
	[SK.GetAccessor]: serializeFunction,
	[SK.SetAccessor]: serializeFunction,
	[SK.TypeOperator]: serializeTypeOperator,

	[SK.TypeLiteral]: serializeObject,
	[SK.ObjectLiteralExpression]: serializeObject,
	[SK.PropertyAssignment]: serializeDeclarationWithType,
	[SK.ShorthandPropertyAssignment]: serializeDeclarationWithType,

	[SK.IndexSignature]: serializeIndexSignature,
};

function setup(
	files: string[],
	options: ts.CompilerOptions,
	host: ts.CompilerHost = ts.createCompilerHost(options)
) {
	program = createProgram(files, options, host);
	typeChecker = program.getTypeChecker();
	currentIndex = {};
}

function visit(n: ts.Node, parent: Node): void {
	if (ts.isVariableStatement(n)) {
		pushChildren(parent, n.declarationList.declarations.map(serialize));
	} else
		switch (n.kind) {
			case SK.InterfaceDeclaration:
			case SK.TypeAliasDeclaration:
			case SK.FunctionDeclaration:
			case SK.EnumDeclaration:
			case SK.VariableDeclaration:
			case SK.ClassDeclaration:
				pushChildren(parent, [serialize(n)]);
		}
}

function isLocalSymbol(symbol: ts.Symbol, sourceFile: ts.SourceFile) {
	return !!symbol.declarations.find(
		decl => decl.getSourceFile() === sourceFile
	);
}

function serializeExternalExport(node: ts.Node, symbol: ts.Symbol) {
	return createNode(node, {
		kind: Kind.Export,
		flags: Flags.Export,
		type: getSymbolReference(symbol),
	});
}

function markExported(
	symbol: ts.Symbol,
	parent: Node,
	sourceFile: ts.SourceFile
) {
	if (!isLocalSymbol(symbol, sourceFile))
		pushChildren(parent, [
			{
				name: symbol.name,
				kind: Kind.Export,
				flags: Flags.Export,
				type: getSymbolReference(symbol),
			},
		]);
	else
		symbol.declarations.forEach(d => {
			if (ts.isExportSpecifier(d) && !(d as any).$$exported) {
				const localSymbol = typeChecker.getExportSpecifierLocalTargetSymbol(
					d
				);
				if (localSymbol) {
					if (!isLocalSymbol(localSymbol, sourceFile)) {
						pushChildren(parent, [
							serializeExternalExport(d, localSymbol),
						]);
					} else markExported(localSymbol, parent, sourceFile);
				}
			} else (d as any).$$exported = true;
		});
}

function parseSourceFile(sourceFile: ts.SourceFile) {
	const result = createNode(sourceFile, {
		name: relative(process.cwd(), sourceFile.fileName),
	});
	const symbol = typeChecker.getSymbolAtLocation(sourceFile);

	if (symbol) {
		typeChecker
			.getExportsOfModule(symbol)
			.forEach(s => markExported(s, result, sourceFile));
	} else {
		const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
		if (diagnostics.length)
			ts.formatDiagnosticsWithColorAndContext(diagnostics, compilerHost);
	}

	sourceFile.forEachChild(c => visit(c, result));

	return result;
}

/**
 * Generate AST from a source string
 *
 * @param source Source to parse
 * @param options Typescript compiler options
 */
export function parse(
	source: string,
	options: ts.CompilerOptions = { lib: ['es6.d.ts'] }
): Node[] {
	const host = (compilerHost = ts.createCompilerHost(options));
	const fileName = `(${Date.now()}).tsx`;
	const oldGetSourceFile = host.getSourceFile;
	let sourceFile: any;

	host.getSourceFile = function (
		fn: string,
		target: ts.ScriptTarget,
		onError?: any,
		shouldCreateNewSourceFile?: boolean
	) {
		return fn === fileName
			? (sourceFile = ts.createSourceFile(fileName, source, target))
			: oldGetSourceFile.call(
					this,
					fn,
					target,
					onError,
					shouldCreateNewSourceFile
			  );
	};

	setup([fileName], options || {}, host);
	sourceFiles = [sourceFile];

	const sourceNode = parseSourceFile(sourceFile);
	return sourceNode.children || [];
}

/**
 * Generate AST from a tsconfig file
 *
 * @param tsconfig Path to tsconfig.json file
 */
export function build(tsconfig = resolve('tsconfig.json')) {
	config = parseTsConfig(tsconfig);
	setup(config.fileNames, config.options);

	const result: Output = {
		modules: [],
		index: currentIndex,
		config,
	};

	(sourceFiles = config.fileNames.flatMap(
		file => program.getSourceFile(file) || []
	)).forEach(source => {
		if (source) {
			result.modules.push(parseSourceFile(source));
		} else throw new Error(`Could not parse ${source}`);
	});

	return result;
}
