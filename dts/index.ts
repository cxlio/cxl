import { relative, resolve } from 'path';

import type * as ts from 'typescript';

const tsPath = require.resolve('typescript', {
	paths: ['.', __dirname],
});
const tsLocal = require(tsPath) as typeof import('typescript');
const { ModifierFlags, getParsedCommandLineOfConfigFile, NodeFlags, sys } =
	tsLocal;

const SK = tsLocal.SyntaxKind;
const TF = tsLocal.TypeFlags;

type dtsNode = Node;

declare module 'typescript' {
	interface Node {
		[dtsNode]?: dtsNode;
		$$exported?: boolean;
		$$internal?: boolean;
		jsDoc?: ts.JSDoc[];
	}

	interface Symbol {
		$$moduleResult?: dtsNode;
	}
}

type SerializerMap = {
	/* eslint-disable-next-line */
	[K in ts.SyntaxKind]?: (node: any) => Node;
};

type Index = Record<number, Node>;

export enum Kind {
	Unknown = 0,
	Variable = 1,
	TypeAlias = 2,
	TypeParameter = 3,
	Interface = 4,
	TypeUnion = 5,
	Reference = 6,
	Module = 7,
	Class = 8,
	Parameter = 9,
	Property = 10,
	Method = 11,
	Getter = 12,
	Setter = 13,
	Constructor = 14,
	Array = 15,
	Function = 16,
	FunctionType = 17,
	ConditionalType = 18,
	Parenthesized = 19,
	Infer = 20,
	IndexedType = 21,
	Enum = 22,
	Literal = 23,
	IndexSignature = 24,
	Export = 25,
	Keyof = 26,
	Typeof = 27,
	ConstructorType = 28,
	Tuple = 29,
	ThisType = 30,
	Constant = 31,
	BaseType = 32,
	ClassType = 33,
	ObjectType = 34,
	Component = 35,
	Attribute = 36,
	Namespace = 37,
	CallSignature = 38,
	ConstructSignature = 39,
	MappedType = 40,
	TypeIntersection = 41,
	ReadonlyKeyword = 42,
	UnknownType = 43,
	Event = 44,
	Spread = 45,
}

const SyntaxKindMap: Record<number, Kind> = {
	[SK.Unknown]: Kind.Unknown,
	[SK.VariableDeclaration]: Kind.Variable,
	[SK.TypeAliasDeclaration]: Kind.TypeAlias,
	[SK.TypeParameter]: Kind.TypeParameter,
	[SK.InterfaceDeclaration]: Kind.Interface,
	[SK.UnionType]: Kind.TypeUnion,
	[SK.TypeReference]: Kind.Reference,
	[SK.SourceFile]: Kind.Module,
	[SK.ClassDeclaration]: Kind.Class,
	[SK.Parameter]: Kind.Parameter,
	[SK.PropertyDeclaration]: Kind.Property,
	[SK.MethodDeclaration]: Kind.Method,
	[SK.GetAccessor]: Kind.Getter,
	[SK.SetAccessor]: Kind.Setter,
	[SK.Constructor]: Kind.Constructor,
	[SK.ArrayType]: Kind.Array,
	[SK.FunctionDeclaration]: Kind.Function,
	[SK.FunctionType]: Kind.FunctionType,
	[SK.ConditionalType]: Kind.ConditionalType,
	[SK.ParenthesizedType]: Kind.Parenthesized,
	[SK.InferType]: Kind.Infer,
	[SK.IndexedAccessType]: Kind.IndexedType,
	[SK.EnumDeclaration]: Kind.Enum,
	[SK.LiteralType]: Kind.Literal,
	[SK.TemplateLiteralType]: Kind.Literal,
	[SK.IndexSignature]: Kind.IndexSignature,
	[SK.ExportSpecifier]: Kind.Export,
	[SK.KeyOfKeyword]: Kind.Keyof,
	[SK.TypeQuery]: Kind.Typeof,
	[SK.ConstructorType]: Kind.ConstructorType,
	[SK.TupleType]: Kind.Tuple,
	[SK.ThisType]: Kind.ThisType,
	[SK.ModuleDeclaration]: Kind.Namespace,
	[SK.CallSignature]: Kind.CallSignature,
	[SK.ConstructSignature]: Kind.ConstructSignature,
	[SK.MappedType]: Kind.MappedType,
	[SK.IntersectionType]: Kind.TypeIntersection,
	[SK.ReadonlyKeyword]: Kind.ReadonlyKeyword,
	[SK.UnknownKeyword]: Kind.UnknownType,
	[SK.SpreadAssignment]: Kind.Spread,
};

export interface DocumentationContent {
	tag?: string;
	value: string;
}

export interface Documentation {
	decorator?: boolean;
	content?: DocumentationContent[];
	tagName?: string;
	role?: string;
	beta?: boolean;
}

export enum Flags {
	// From ts.ModifierFlags
	None = 0,
	Export = 1,
	Ambient = 2,
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
	Internal = 2 ** 20,
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
	resolvedType?: Node;
	typeParameters?: Node[];
	parameters?: Node[];
	children?: Node[];
	extendedBy?: Node[];
	parent?: Node;
}

export interface Output {
	index: Index;
	config: ts.ParsedCommandLine;
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

const printer = tsLocal.createPrinter();

let currentIndex: Index;
let currentSourceFile: ts.SourceFile | undefined;
let currentNode: ts.Node | undefined;
let program: ts.Program;
let compilerHost: ts.CompilerHost;
let config: ts.ParsedCommandLine;
let sourceFiles: ts.SourceFile[];
let typeChecker: ts.TypeChecker;
let currentId = 1;
let extraModules: Node[];

const parseConfigHost: ts.ParseConfigFileHost = {
	useCaseSensitiveFileNames: true,
	readDirectory: sys.readDirectory,
	getCurrentDirectory: sys.getCurrentDirectory,
	fileExists: sys.fileExists,
	readFile: sys.readFile,
	onUnRecoverableConfigFileDiagnostic(e) {
		const msg = tsLocal.formatDiagnosticsWithColorAndContext(
			[e],
			compilerHost
		);
		throw new Error(msg);
	},
};

type PrintableNode = {
	id?: number;
	source?: string | string[];
	name: string;
	flags: string[];
	kind: string;
	docs?: Documentation;
	value?: string;
	type?: PrintableNode;
	typeParameters?: PrintableNode[];
	parameters?: PrintableNode[];
	children?: PrintableNode[];
	extendedBy?: PrintableNode[];
	parent?: PrintableNode;
};

function _printNode(node: Node, visited: Node[] = []): PrintableNode {
	const {
		typeParameters,
		type,
		value,
		parameters,
		docs,
		source,
		id,
		kind,
		name,
		children,
		extendedBy,
		flags,
	} = node;
	const flagText: string[] = [];
	if (flags) for (const i in Flags) if (flags & +Flags[i]) flagText.push(i);

	if (visited.includes(node))
		return { name: `circular: ${name}`, flags: flagText, kind: Kind[kind] };
	visited.push(node);

	const sources = Array.isArray(source)
		? source.map(s => s.name)
		: source?.name || '?';

	return {
		id,
		name,
		kind: Kind[kind],
		source: sources,
		docs,
		value,
		flags: flagText,
		type: type && _printNode(type, visited),
		typeParameters: typeParameters?.map(n => _printNode(n, visited)),
		parameters: parameters?.map(n => _printNode(n, visited)),
		children: children?.map(n => _printNode(n, visited)),
		extendedBy: extendedBy?.map(n => _printNode(n, visited)),
	};
}

export function printNode(node: Node) {
	console.log(JSON.stringify(_printNode(node), null, 2));
}

export function printTsNode(node: ts.Node) {
	function print(node: ts.Node) {
		return {
			...node,
			kind: SK[node.kind],
		};
	}

	console.log(print(node));
}

function createBaseType(name: string): Node {
	return { name, kind: Kind.BaseType, flags: 0 };
}

function parseTsConfig(tsconfig: string) {
	let parsed: ts.ParsedCommandLine | undefined;
	try {
		parsed = getParsedCommandLineOfConfigFile(
			tsconfig,
			{},
			parseConfigHost
		);
	} catch (e) {
		if (e instanceof Error) throw e;
		const msg = typeof e === 'string' ? e : String(e);
		throw new Error(msg);
	}

	if (!parsed) throw new Error(`Could not parse config file "${tsconfig}"`);
	return parsed;
}

function getKind(node: ts.Node): Kind {
	switch (node.kind) {
		case SK.BindingElement:
			return node.parent.parent.parent.flags & NodeFlags.Const
				? Kind.Constant
				: Kind.Variable;
		case SK.VariableDeclaration:
			return node.parent.flags & NodeFlags.Const
				? Kind.Constant
				: Kind.Variable;
		case SK.TypeLiteral:
		case SK.ObjectLiteralExpression:
			return Kind.ObjectType;
		case SK.PropertySignature:
		case SK.PropertyAssignment:
		case SK.EnumMember:
			return Kind.Property;
	}
	return SyntaxKindMap[node.kind] || Kind.Unknown;
}

function getNodeSource(node: ts.Node): Source {
	const sourceFile = node.getSourceFile();
	const root = config?.options.rootDir || ''; //process.cwd();
	const result = sourceFile
		? {
				name: relative(root, sourceFile.fileName),
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
	if ((node as ts.TypeParameterDeclaration).name)
		node = (node as ts.TypeParameterDeclaration).name;
	else if ((node as ts.TypeReferenceNode).typeName)
		node = (node as ts.TypeReferenceNode).typeName;

	if ((node as ts.Identifier).escapedText !== undefined)
		return (node as ts.Identifier).escapedText as string;

	if (tsLocal.isTemplateLiteralTypeNode(node)) {
		return currentSourceFile
			? printer.printNode(
					tsLocal.EmitHint.Unspecified,
					node,
					currentSourceFile
			  )
			: '';
	}

	if (tsLocal.isLiteralTypeNode(node)) {
		return currentSourceFile
			? printer.printNode(
					tsLocal.EmitHint.Unspecified,
					node,
					currentSourceFile
			  )
			: node.pos === -1
			? (node.literal as ts.StringLiteral).text || ''
			: node.getFullText();
	}

	if (tsLocal.isComputedPropertyName(node) || tsLocal.isQualifiedName(node))
		return node.pos === -1
			? (node as unknown as ts.StringLiteral).text || ''
			: node.getText();

	if ((node as ts.StringLiteral).text) return (node as ts.StringLiteral).text;

	const moduleName = (node as ts.SourceFile).moduleName;
	return moduleName || '';
}

function createNode(node: ts.Node, extra?: Partial<Node>): Node {
	const result: Partial<Node> = node[dtsNode] || {};

	result.source = result.source || getNodeSource(node);
	result.kind = extra?.kind || result.kind || getKind(node);
	result.name = result.name || getNodeName(node);
	result.flags = result.flags || 0;
	const docs = getNodeDocs(node, result as Node);
	if (docs) result.docs = docs;

	if (extra) Object.assign(result, extra);

	return (node[dtsNode] = result as Node);
}

function isOwnFile(sourceFile: ts.SourceFile) {
	return sourceFile && sourceFiles.includes(sourceFile);
}

function getNodeFromDeclaration(node: ts.Node): Node {
	let result = node[dtsNode];
	if (!result) {
		const sourceFile = node.getSourceFile();
		const flags = program.isSourceFileDefaultLibrary(sourceFile)
			? Flags.DefaultLibrary
			: program.isSourceFileFromExternalLibrary(sourceFile)
			? Flags.External
			: 0;
		node[dtsNode] = result =
			flags === 0 && isOwnFile(sourceFile)
				? /*? tsLocal.isLiteralExpression(node)
					? serialize(node)
					: { id: currentId++, flags, name: '', kind: Kind.Unknown }*/
				  //serialize(node)
				  { id: currentId++, flags, name: '', kind: Kind.Unknown }
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

function hasInternalAnnotation(node: ts.Node, text: string) {
	do {
		if (node.$$internal) return true;

		const ranges = tsLocal.getLeadingCommentRanges(text, node.pos);
		if (ranges)
			for (const r of ranges) {
				const rangeText = text.substring(r.pos, r.end);
				if (rangeText.indexOf('@internal') !== -1) {
					return (node.$$internal = true);
				}
			}
	} while ((node = node.parent));
	return false;
}

function getFlags(node: ts.Node, flags: ts.ModifierFlags) {
	const tsFlags = tsLocal.ModifierFlags;
	const isDecl = node.getSourceFile()?.isDeclarationFile;
	let result = 0;

	if (flags & tsFlags.Export || isDecl) result |= Flags.Export;
	if (flags & tsFlags.Ambient) result |= Flags.Ambient;
	if (flags & tsFlags.Public) result |= Flags.Public;
	if (flags & tsFlags.Private) result |= Flags.Private;
	if (flags & tsFlags.Protected) result |= Flags.Protected;
	if (flags & tsFlags.Static) result |= Flags.Static;
	if (flags & tsFlags.Readonly) result |= Flags.Readonly;
	if (flags & tsFlags.Abstract) result |= Flags.Abstract;
	if (flags & tsFlags.Async) result |= Flags.Async;
	if (flags & tsFlags.Default) result |= Flags.Default;
	if (flags & tsFlags.Deprecated) result |= Flags.Deprecated;

	const sourceFile = tsLocal.isSourceFile(node) ? node : node.getSourceFile();

	if (sourceFile && hasInternalAnnotation(node, sourceFile.getFullText()))
		result |= Flags.Internal;

	if ((node as ts.PropertyDeclaration).questionToken)
		result |= Flags.Optional;

	return result;
}

function parseJsDocComment(node: ts.JSDoc, content: DocumentationContent[]) {
	if (!node.comment) return;

	if (typeof node.comment === 'string') content.push({ value: node.comment });
	else node.comment.forEach(n => content.push({ value: n.text }));
}

function getResolvedType(type: ts.Type) {
	const widened = typeChecker.getWidenedType(type);

	if (widened === type) {
		const resolved = typeChecker.typeToTypeNode(
			widened,
			undefined,
			tsLocal.NodeBuilderFlags.NoTypeReduction |
				tsLocal.NodeBuilderFlags.InTypeAlias |
				tsLocal.NodeBuilderFlags.NoTruncation
		);

		return resolved ? serialize(resolved) : undefined;
	}
	return serializeType(widened);
}

function getNodeDocs(node: ts.Node, result: Node) {
	const jsDoc = node.jsDoc as ts.JSDoc[];
	const content: DocumentationContent[] = [];
	const docs: Documentation = { content };

	jsDoc?.forEach(doc => doc.comment && parseJsDocComment(doc, content));

	tsLocal.getJSDocTags(node).forEach(doc => {
		const tag = doc.tagName.escapedText as string;
		const name = (doc as ts.JSDocSeeTag).name?.getText();
		let value = doc.comment || name;
		if (tag === 'deprecated') result.flags |= Flags.Deprecated;
		if (tag === 'see' && doc.comment === '*') value = name;
		if (tag === 'beta') docs.beta = true;

		if (value && !(tag === 'param' && node.kind !== SK.Parameter))
			content.push({
				tag,
				value: tsLocal.getTextOfJSDocComment(value) || '',
			});
	});

	return content.length ? docs : undefined;
}

function serializeDeclaration(node: ts.Declaration): Node {
	const result = createNode(node);
	if (!result.id) {
		result.id = currentId++;
		node[dtsNode] = result;
	}
	result.flags |= getFlags(node, tsLocal.getCombinedModifierFlags(node));

	const id = result.id;

	if (
		isClassMember(result) &&
		!(result.flags & (ModifierFlags.Private | ModifierFlags.Protected))
	)
		result.flags = result.flags | ModifierFlags.Public;

	const typeParameters = (node as ts.ClassLikeDeclaration).typeParameters;
	if (typeParameters) result.typeParameters = typeParameters.map(serialize);

	const type = (node as ts.VariableDeclaration).type;
	if (type) result.type = serialize(type);

	if (tsLocal.isTypeAliasDeclaration(node)) {
		const typeObj = typeChecker.getTypeAtLocation(node);
		result.resolvedType = getResolvedType(typeObj);
	}

	if (tsLocal.isEnumMember(node))
		result.value = JSON.stringify(typeChecker.getConstantValue(node));
	else if ((node as ts.PropertyAssignment).initializer)
		result.value = serializeExpression(
			(node as ts.PropertyAssignment).initializer
		);

	if (node.$$exported) result.flags = result.flags | Flags.Export;

	if (id) currentIndex[id] = result;

	return result;
}

function serializeTypeParameter(node: ts.TypeParameterDeclaration) {
	const result = serializeDeclaration(node);
	if (node.default) result.value = node.default.getText();
	if (node.constraint) result.children = [serialize(node.constraint)];
	return result;
}

function error(msg: string, ...extra: unknown[]): never {
	if (currentSourceFile) {
		console.error(currentSourceFile.fileName);
		if (currentNode)
			console.error(
				tsLocal.getLineAndCharacterOfPosition(
					currentSourceFile,
					currentNode.pos
				)
			);
	}
	if (extra.length) console.error(...extra);
	throw new Error(msg);
}

function serializeUnknownSymbol(symbol: ts.Symbol): Node {
	const result = {
		name: symbol.name,
		kind: Kind.Unknown,
		flags: 0,
	};
	return result;
}

function serializeParameter(symbol: ts.Symbol) {
	const node = symbol.valueDeclaration as ts.ParameterDeclaration;

	if (!node) return serializeUnknownSymbol(symbol);

	const result = serializeDeclarationWithType(node);
	if (!result.name) result.name = node.name.getText();

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
	const node = symbol.declarations?.[0] || symbol.valueDeclaration;
	if (!node) {
		return {
			name: symbol.getName(),
			flags: 0,
			kind: Kind.Reference,
			typeParameters:
				typeArgs && typeArgs.length
					? typeArgs.map(serializeType)
					: undefined,
		};
	}
	if (tsLocal.isExportSpecifier(node)) {
		const local = typeChecker.getExportSpecifierLocalTargetSymbol(node);
		if (!local) error('Invalid Symbol');
		const result = getSymbolReference(local);
		result.name = symbol.getName();
		return result;
	}
	return {
		name: symbol.getName(), //(symbol.escapedName as string) || symbol.getName(),
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
		(type as ts.ObjectType).objectFlags & tsLocal.ObjectFlags.Reference
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

function getSymbolDeclaration(symbol: ts.Symbol) {
	const result = symbol.valueDeclaration || symbol.declarations?.[0];
	if (!result) {
		throw new Error(
			`No symbol declaration found for "${symbol.escapedName}"`
		);
	}
	return result;
}

function serializeSymbol(symbol: ts.Symbol): Node {
	return serialize(getSymbolDeclaration(symbol));
}

function serializeKeyofType(type: ts.IndexType): Node {
	return {
		name: typeChecker.typeToString(type),
		kind: Kind.Keyof,
		type: serializeType(type.type),
		resolvedType: getResolvedType(type),
		flags: 0,
	} as Node;
}

function serializeLiteralType(type: ts.Type, baseType: ts.Type): Node {
	return {
		name: typeChecker.typeToString(type),
		kind: Kind.Literal,
		type: baseType !== type ? serializeType(baseType) : undefined,
		flags: 0,
	};
}

function serializeTypeObject(type: ts.ObjectType): Node {
	const result = typeChecker.typeToTypeNode(
		type,
		undefined,
		tsLocal.NodeBuilderFlags.InObjectTypeLiteral |
			tsLocal.NodeBuilderFlags.NoTruncation
	);
	if (!result) {
		return {
			name: typeChecker.typeToString(type),
			kind: Kind.ObjectType,
			flags: 0,
		};
	}

	return serialize(result);
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
	if (type.flags & TF.Literal || type.flags & TF.TemplateLiteral) {
		const baseType = typeChecker.getBaseTypeOfLiteralType(type);
		if (
			type.isStringLiteral() ||
			type.isNumberLiteral() ||
			type.isLiteral() ||
			type.flags & TF.TemplateLiteral
		)
			return serializeLiteralType(type, baseType);
		return serializeType(baseType);
	}

	if (type.flags & TF.Index) return serializeKeyofType(type as ts.IndexType);
	if (type.flags & TF.IndexedAccess)
		return serializeIndexedAccessType(type as ts.IndexedAccessType);

	if (isReferenceType(type) && type.symbol)
		return getSymbolReference(
			type.symbol,
			typeChecker.getTypeArguments(type as ts.TypeReference)
		);

	if (type.isUnionOrIntersection())
		return {
			name: '',
			flags: 0,
			kind: type.isUnion() ? Kind.TypeUnion : Kind.TypeIntersection,
			children: type.types.map(serializeType),
		};

	if (type.flags & TF.Object)
		return serializeTypeObject(type as ts.ObjectType);

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
		tsLocal.SignatureKind.Call
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
	if (!tsLocal.canHaveDecorators(node)) return undefined;
	const decorators = tsLocal.getDecorators(node);
	return (
		decorators &&
		decorators.find(
			deco =>
				tsLocal.isCallExpression(deco.expression) &&
				tsLocal.isIdentifier(deco.expression.expression) &&
				(deco.expression.expression.escapedText as string).endsWith(
					name
				)
		)
	);
}

function isCxlAttribute(node: ts.Declaration, result: Node) {
	const deco = getCxlDecorator(node, 'Attribute');
	if (deco) {
		const text = (
			(deco.expression as ts.CallExpression).expression as ts.Identifier
		).escapedText;
		result.kind = text === 'EventAttribute' ? Kind.Event : Kind.Attribute;
	}
}

function getCxlRole(node: ts.CallExpression): string {
	const id = node.arguments[0];
	return tsLocal.isStringLiteral(id) ? id.text : '';
}

function getCxlClassMeta(
	node: ts.ClassDeclaration | ts.InterfaceDeclaration,
	result: Node
): boolean {
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
			if (i === 0 && tsLocal.isStringLiteral(arg))
				docs.tagName = arg.text;
			else if (
				tsLocal.isCallExpression(arg) &&
				tsLocal.isIdentifier(arg.expression) &&
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

	if (
		tsLocal.isVariableDeclaration(node) &&
		(tsLocal.isArrayBindingPattern(node.name) ||
			tsLocal.isObjectBindingPattern(node.name))
	) {
		// Object or Array destructuring items are stored as children
		result.children = node.name.elements.map(serialize);
	}

	isCxlAttribute(node, result);

	if (!result.type) {
		if (
			tsLocal.isFunctionDeclaration(node) ||
			tsLocal.isMethodDeclaration(node)
		) {
			const sig = typeChecker.getSignatureFromDeclaration(node);
			if (sig) result.type = serializeType(sig.getReturnType());
		} else {
			try {
				const type = typeChecker.getTypeAtLocation(node);
				if (type) result.type = serializeType(type);
			} catch (e) {
				console.error(e);
			}
		}
	}

	return result;
}

function pushChildren(parent: Node, children: Node[]) {
	children.forEach(n => {
		return (
			!n.parent &&
			Object.defineProperty(n, 'parent', {
				value: parent,
				enumerable: false,
			})
		);
	});
	if (!parent.children) parent.children = children;
	else parent.children.push(...children);
}

function serializeObject(
	node: ts.TypeLiteralNode | ts.ObjectLiteralExpression
) {
	const result = createNode(node);
	if (!result.children) {
		const children = tsLocal.isObjectLiteralExpression(node)
			? node.properties.map(serialize)
			: node.members.map(serialize);
		pushChildren(result, children);
	}
	return result;
}

function serializeClass(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
	const result = serializeDeclaration(node);
	const symbol =
		typeChecker.getSymbolAtLocation(node) ||
		(node.name && typeChecker.getSymbolAtLocation(node.name));

	if (node.members) {
		pushChildren(result, node.members.map(serialize));
	}

	if (symbol) {
		if (
			tsLocal.isInterfaceDeclaration(node) &&
			symbol.flags & tsLocal.SymbolFlags.Class
		) {
			result.flags |= Flags.DeclarationMerge;
		} else {
			const exportedSymbol = typeChecker.getExportSymbolOfSymbol(symbol);
			exportedSymbol?.members?.forEach(
				s =>
					!(s.flags & tsLocal.SymbolFlags.TypeParameter) &&
					s.declarations &&
					pushChildren(
						result,
						s.declarations.flatMap(d => {
							const existing = d[dtsNode];
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
			type: result,
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
	const typeObj = typeChecker.getTypeFromTypeNode(node);
	const symbol = typeObj.aliasSymbol || typeObj.symbol;
	const decl =
		symbol && (symbol.declarations?.[0] || symbol.valueDeclaration);
	/*const typeNode =
		!decl &&
		typeChecker.typeToTypeNode(
			typeObj,
			undefined,
			tsLocal.NodeBuilderFlags.NoTypeReduction |
				tsLocal.NodeBuilderFlags.InTypeAlias |
				tsLocal.NodeBuilderFlags.NoTruncation
		);*/
	const type = decl ? getNodeFromDeclaration(decl) : serializeType(typeObj);

	const name = getNodeName(
		tsLocal.isTypeReferenceNode(node) ? node.typeName : node.expression
	);

	return createNode(node, {
		name,
		kind: Kind.Reference,
		type,
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
	const result = createNode(node, {
		kind: SyntaxKindMap[node.operator],
		type: serialize(node.type),
	});

	const type =
		node.flags & tsLocal.NodeFlags.Synthesized
			? undefined
			: typeChecker.getTypeFromTypeNode(node);
	if (type) {
		const resolvedType = type && serializeType(type);
		if (resolvedType && resolvedType.kind !== result.kind)
			result.resolvedType = resolvedType;
	}
	return result;
}

function serializeTypeQuery(node: ts.TypeQueryNode) {
	const result = createNode(node);
	result.name = getNodeName(node.exprName);
	return result;
}

function serializeTuple(node: ts.TupleTypeNode) {
	return createNode(node, {
		children: node.elements.map(serialize),
	});
}

function serializeRestType(node: ts.RestTypeNode) {
	const result = serialize(node.type);
	result.flags |= Flags.Rest;
	return result;
}

function serializeMappedType(node: ts.MappedTypeNode) {
	const result = createNode(node);
	if (node.typeParameter) {
		const type = serialize(node.typeParameter);
		result.children = [type];
		if (type.children?.[0]) {
			result.children.push(type.children?.[0]);
			type.children = undefined;
		}
	}
	if (node.type) result.type = serialize(node.type);
	return result;
}

function serializeModule(node: ts.ModuleDeclaration) {
	const result = serializeDeclaration(node);
	node.forEachChild(c => {
		if (tsLocal.isModuleBlock(c))
			for (const child of c.statements) {
				visit(child, result);
			}
	});
	if (!extraModules.includes(result)) {
		const symbol =
			typeChecker.getSymbolAtLocation(node) ||
			(node.name && typeChecker.getSymbolAtLocation(node.name));
		if (symbol) {
			// If module already exists, merge declarations
			if (symbol.$$moduleResult) {
				if (result.children)
					(symbol.$$moduleResult.children ||= []).push(
						...result.children
					);
				return result;
			} else symbol.$$moduleResult = result;

			const symbolNode =
				symbol.valueDeclaration || symbol.declarations?.[0];
			const moduleName = (symbolNode as ts.SourceFile).moduleName;
			if (moduleName) result.name = moduleName;
		}
		result.flags = result.flags | Flags.Export;
		extraModules.push(result);
	}
	return result;
}

function serializeSpread(node: ts.SpreadAssignment) {
	const result = createNode(node);
	result.children = [serialize(node.expression)];
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
	[SK.CallSignature]: serializeFunction,
	[SK.ConstructSignature]: serializeFunction,
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
	[SK.IntersectionType](node: ts.UnionTypeNode) {
		return createNode(node, {
			kind: Kind.TypeIntersection,
			children: node.types.map(serialize),
		});
	},
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
	[SK.BindingElement]: serializeDeclarationWithType,
	[SK.ConstructorType]: serializeConstructor,
	[SK.GetAccessor]: serializeFunction,
	[SK.SetAccessor]: serializeFunction,
	[SK.TypeOperator]: serializeTypeOperator,

	[SK.TypeLiteral]: serializeObject,
	[SK.TemplateLiteralType]: serializeDeclaration,
	[SK.ObjectLiteralExpression]: serializeObject,
	[SK.PropertyAssignment]: serializeDeclarationWithType,
	[SK.ShorthandPropertyAssignment]: serializeDeclarationWithType,

	[SK.IndexSignature]: serializeIndexSignature,
	[SK.MappedType]: serializeMappedType,
	[SK.SpreadAssignment]: serializeSpread,
};

function setup(
	files: string[],
	options: ts.CompilerOptions,
	host?: ts.CompilerHost
) {
	options.noEmit = true;
	if (!host) host = tsLocal.createCompilerHost(options);

	compilerHost = host;
	extraModules = [];
	program = tsLocal.createProgram(files, options, host);
	typeChecker = program.getTypeChecker();
	currentIndex = {};

	const diagnostics = [
		...program.getOptionsDiagnostics(),
		...program.getConfigFileParsingDiagnostics(),
		...program.getGlobalDiagnostics(),
	];
	if (diagnostics.length)
		console.log(
			tsLocal.formatDiagnosticsWithColorAndContext(diagnostics, host)
		);
}

function visit(n: ts.Node, parent: Node): void {
	currentNode = n;
	if (tsLocal.isVariableStatement(n)) {
		pushChildren(
			parent,
			n.declarationList.declarations.map(serialize)
			//.filter(n => n.flags & Flags.Export)
		);
	} else
		switch (n.kind) {
			case SK.InterfaceDeclaration:
			case SK.TypeAliasDeclaration:
			case SK.FunctionDeclaration:
			case SK.EnumDeclaration:
			case SK.VariableDeclaration:
			case SK.ClassDeclaration:
				pushChildren(parent, [serialize(n)]);
				break;
			case SK.ModuleDeclaration:
				serializeModule(n as ts.ModuleDeclaration);
		}
}

function isLocalSymbol(symbol: ts.Symbol, sourceFile: ts.SourceFile) {
	return !!symbol.declarations?.find(
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
		symbol.declarations?.forEach(d => {
			if (tsLocal.isExportSpecifier(d) && !d.$$exported) {
				const localSymbol =
					typeChecker.getExportSpecifierLocalTargetSymbol(d);
				if (localSymbol) {
					if (!isLocalSymbol(localSymbol, sourceFile)) {
						pushChildren(parent, [
							serializeExternalExport(d, localSymbol),
						]);
					} else markExported(localSymbol, parent, sourceFile);
				}
			} else d.$$exported = true;
		});
}

function parseSourceFile(sourceFile: ts.SourceFile) {
	const root = config?.options.rootDir || ''; //process.cwd();
	const result = createNode(sourceFile, {
		name: relative(root, sourceFile.fileName),
		flags: getFlags(sourceFile, 0),
	});
	const symbol = typeChecker.getSymbolAtLocation(sourceFile);

	currentSourceFile = sourceFile;

	if (symbol) {
		typeChecker
			.getExportsOfModule(symbol)
			.forEach(s => markExported(s, result, sourceFile));
	} else {
		const diagnostics = tsLocal.getPreEmitDiagnostics(program, sourceFile);
		if (diagnostics.length)
			console.log(
				tsLocal.formatDiagnosticsWithColorAndContext(
					diagnostics,
					compilerHost
				)
			);
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
	options: ts.CompilerOptions = {
		lib: ['lib.es2015.d.ts'],
		declaration: false,
		noEmit: true,
	},
	fileName = `(${Date.now()}).tsx`
): Node[] {
	const host = (compilerHost = tsLocal.createCompilerHost(options));
	const oldGetSourceFile = host.getSourceFile;
	let sourceFile: ts.SourceFile | undefined;
	currentId = 1;

	host.getSourceFile = function (
		fn: string,
		target: ts.ScriptTarget,
		onError?: (message: string) => void,
		shouldCreateNewSourceFile?: boolean
	) {
		return fn === fileName
			? (sourceFile = tsLocal.createSourceFile(fileName, source, target))
			: oldGetSourceFile.call(
					this,
					fn,
					target,
					onError,
					shouldCreateNewSourceFile
			  );
	};

	setup([fileName], options || {}, host);
	if (!sourceFile) throw new Error('Invalid Source File');
	sourceFiles = [sourceFile];

	const sourceNode = parseSourceFile(sourceFile);
	return sourceNode.children || extraModules || [];
}

export function buildTsconfig(config: ts.ParsedCommandLine): Output {
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

	result.modules.unshift(...extraModules);

	return result;
}

export function buildConfig(json: unknown, basePath: string): Output {
	config = tsLocal.parseJsonConfigFileContent(
		json,
		parseConfigHost,
		basePath
	);
	return buildTsconfig(config);
}

/**
 * Generate AST from a tsconfig file
 *
 * @param tsconfig Path to tsconfig.json file
 */
export function build(tsconfig = resolve('tsconfig.json')): Output {
	config = parseTsConfig(tsconfig);
	return buildTsconfig(config);
}
