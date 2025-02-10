import { relative, resolve } from 'path';
import { Kind, Flags } from './enum.js';

import type * as ts from 'typescript';

const tsPath = require.resolve('typescript', {
	paths: ['.', __dirname],
});
/*eslint @typescript-eslint/no-require-imports:off */
const tsLocal = require(tsPath) as typeof import('typescript');
const { getParsedCommandLineOfConfigFile, NodeFlags, sys } = tsLocal;

const SK = tsLocal.SyntaxKind;
const TF = tsLocal.TypeFlags;

export { Kind, Flags } from './enum.js';

type dtsNode = Node;

declare module 'typescript' {
	interface Node {
		[dtsNode]?: dtsNode;
		$$internal?: boolean;
		jsDoc?: ts.JSDoc[];
	}

	interface Symbol {
		$$moduleResult?: dtsNode;
		$$fqn?: string;
	}
}

type SerializerMap = {
	/* eslint-disable-next-line */
	[K in ts.SyntaxKind]?: (node: any) => Node;
};

type Index = Record<number, Node>;

export interface BuildOptions {
	customJsDocTags?: string[];
	packageRoot?: string;
	rootDir: string | undefined;
	exportsOnly: boolean;
	cxlExtensions: boolean;
	forceExports?: string[];
	followReferences?: boolean;
}

export interface ParseOptions extends Partial<BuildOptions> {
	compilerOptions?: ts.CompilerOptions;
	fileName?: string;
	source: string;
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
	[SK.ImportType]: Kind.ImportType,
	[SK.SymbolKeyword]: Kind.Symbol,
};

export interface DocumentationContent {
	tag?: string;
	value: string | { tag?: string; value: string }[];
}

export interface Documentation {
	decorator?: boolean;
	content?: DocumentationContent[];
	tagName?: string;
	role?: string;
	beta?: boolean;
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
	env: { typescript: string };
}

export const defaultOptions: BuildOptions = {
	exportsOnly: true,
	rootDir: undefined,
	cxlExtensions: false,
};

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
let program: ts.Program;
let config: ts.ParsedCommandLine | undefined;
let sourceFiles: readonly ts.SourceFile[];
let typeChecker: ts.TypeChecker;
let currentId = 1;
let extraModules: Node[];
let exportIndex: Record<string, Node>;
let currentOptions: BuildOptions;
let moduleMap: Record<string, Node>;
let builtReferences: string[];

const parseConfigHost: ts.FormatDiagnosticsHost & ts.ParseConfigFileHost = {
	useCaseSensitiveFileNames: true,
	readDirectory: sys.readDirectory,
	getCurrentDirectory: sys.getCurrentDirectory,
	getNewLine: () => '\n',
	fileExists: sys.fileExists,
	getCanonicalFileName: f => f,
	readFile: sys.readFile,
	onUnRecoverableConfigFileDiagnostic(e) {
		const msg = tsLocal.formatDiagnosticsWithColorAndContext(
			[e],
			parseConfigHost,
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

function flags(flags: number, all: Record<number, string>) {
	const result = [];
	for (const i in all) if (flags & +i) result.push(all[i]);
	return result;
}

export function typeFlags(node: ts.Type) {
	return flags(node.flags, tsLocal.TypeFlags);
}

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
		const flagText: string[] = [];
		if (node.flags)
			for (const i in NodeFlags)
				if (node.flags & +NodeFlags[i]) flagText.push(i);
		return {
			...node,
			parent: undefined,
			flagText,
			kind: SK[node.kind],
		};
	}

	console.log(print(node));
}

function createBaseType(name: string): Node {
	return { name, kind: Kind.BaseType, flags: 0 };
}

function parseTsConfig(tsconfig: string, _options?: BuildOptions) {
	let parsed: ts.ParsedCommandLine | undefined;
	try {
		parsed = getParsedCommandLineOfConfigFile(
			tsconfig,
			{},
			parseConfigHost,
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

function createNodeId(_tsNode: ts.Node, _node?: Node) {
	return currentId++;
}

function getNodeSource(node: ts.Node): Source {
	const root = currentOptions.packageRoot || process.cwd();
	const sourceFile = node.getSourceFile();
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
	if (tsLocal.isSourceFile(node)) {
		return normalizeSourceFileName(node.fileName);
	}
	if ((node as ts.TypeParameterDeclaration).name)
		node = (node as ts.TypeParameterDeclaration).name;
	else if ((node as ts.TypeReferenceNode).typeName)
		node = (node as ts.TypeReferenceNode).typeName;

	if ((node as ts.Identifier).escapedText !== undefined)
		return (node as ts.Identifier).escapedText as string;

	if (
		tsLocal.isTemplateLiteralTypeNode(node) ||
		tsLocal.isLiteralTypeNode(node) ||
		tsLocal.isLiteralExpression(node)
	) {
		return printer.printNode(
			tsLocal.EmitHint.Unspecified,
			node,
			node.getSourceFile(),
		);
	}

	if ((node as ts.StringLiteral).text) return (node as ts.StringLiteral).text;

	if (tsLocal.isComputedPropertyName(node) || tsLocal.isQualifiedName(node))
		return node.pos === -1
			? (node as unknown as ts.StringLiteral).text || ''
			: node.getText();

	const moduleName = (node as ts.SourceFile).moduleName;
	return moduleName || '';
}

function createNode(node: ts.Node, extra?: Partial<Node>): Node {
	const result: Partial<Node> = node[dtsNode] || {};

	result.source = result.source || getNodeSource(node);
	result.kind = extra?.kind ?? result.kind ?? getKind(node);
	result.name ||= extra?.name || getNodeName(node);
	result.flags ??= getFlags(node);

	const docs = getNodeDocs(node, result as Node);
	if (docs) result.docs = docs;

	if (extra) Object.assign(result, extra);

	return (node[dtsNode] = result as Node);
}

//function isOwnFile(sourceFile: ts.SourceFile) {
//	return sourceFile && sourceFiles.includes(sourceFile);
//}

function getNodeFromDeclaration(symbol: ts.Symbol, node: ts.Node): Node {
	const result = node[dtsNode];
	if (!result) {
		const sourceFile = node.getSourceFile();
		if (
			!program.isSourceFileDefaultLibrary(sourceFile) &&
			!program.isSourceFileFromExternalLibrary(sourceFile) &&
			sourceFile.isDeclarationFile &&
			symbol
		) {
			const fqn = getSymbolFullyQualifiedName(symbol);
			const externalNode = exportIndex[fqn];
			if (externalNode?.source) return externalNode;
		}

		return createNode(node);
	}

	return result;
}

function isClassMember(node: ts.Node) {
	return (
		node.kind === SK.PropertyDeclaration ||
		node.kind === SK.MethodDeclaration ||
		node.kind === SK.GetAccessor ||
		node.kind === SK.SetAccessor ||
		node.kind === SK.PropertySignature ||
		node.kind === SK.MethodSignature
	);
}

function serialize(node: ts.Node) {
	return (Serializer[node.kind] || createNode)(node);
}

function serializeExpression(node: ts.Expression) {
	return node.getText();
}

function hasInternalAnnotation(node: ts.Node, text: string) {
	let parent = node;
	if (node.kind === SK.ModuleDeclaration) return false;
	do {
		if (parent.$$internal) return true;
		else if (parent.$$internal === false) continue;

		const ranges = tsLocal.getLeadingCommentRanges(text, parent.pos);
		if (ranges)
			for (const r of ranges) {
				const rangeText = text.substring(r.pos, r.end);
				if (rangeText.indexOf('@internal') !== -1) {
					return (parent.$$internal = true);
				}
			}
	} while ((parent = parent.parent));

	return (node.$$internal = false);
}

function getDeclarationFlags(node: ts.Declaration, flags: ts.ModifierFlags) {
	const tsFlags = tsLocal.ModifierFlags;
	const isDecl = node.getSourceFile()?.isDeclarationFile;
	let result = 0;

	if (flags & tsFlags.Export || isDecl || node.kind === SK.NamespaceExport)
		result |= Flags.Export;
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

	if (isClassMember(node) && !(result & (Flags.Private | Flags.Protected)))
		result |= Flags.Public;

	return result;
}

function getFlags(node: ts.Node) {
	let result = 0;

	if ((node as ts.PropertyDeclaration).questionToken)
		result |= Flags.Optional;

	const sourceFile = tsLocal.isSourceFile(node) ? node : node.getSourceFile();

	if (sourceFile) {
		if (hasInternalAnnotation(node, sourceFile.getFullText()))
			result |= Flags.Internal;
		if (program.isSourceFileDefaultLibrary(sourceFile))
			result |= Flags.DefaultLibrary;
		if (program.isSourceFileFromExternalLibrary(sourceFile))
			result |= Flags.External;
	}

	/*if (
		isClassMember(node) &&
		!(result & (ModifierFlags.Private | ModifierFlags.Protected))
	)
		result |= ModifierFlags.Public;*/

	return result;
}

function getResolvedType(type: ts.Type) {
	const widened = typeChecker.getWidenedType(type);

	if (widened === type) {
		try {
			const resolved = typeChecker.typeToTypeNode(
				widened,
				undefined,
				tsLocal.NodeBuilderFlags.NoTypeReduction |
					tsLocal.NodeBuilderFlags.InTypeAlias |
					tsLocal.NodeBuilderFlags.NoTruncation,
			);

			return resolved ? serialize(resolved) : undefined;
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}
	return serializeType(widened);
}

//const linkRegex = /\{@link\s+(.+)\}/g;
const comments = /<!--(.*?)-->/g;
function processJsDoc(content: string) {
	return content.replace(comments, '');
}

function parseJsDocComment(comment: ts.JSDoc['comment']) {
	if (!comment) return;
	if (typeof comment === 'string') return processJsDoc(comment);

	return comment.map(n =>
		n.kind === SK.JSDocLink
			? {
					tag: 'link',
					value: `${n.name?.getText() || ''}${n.text}`,
			  }
			: { value: processJsDoc(n.text) },
	);
}

const jsDocRemoveStar = /^\s*\*\s/gm;

function getJsDocText(doc: ts.JSDocTag | ts.JSDocComment): string {
	const text = doc.getText().replace(jsDocRemoveStar, '');
	return text;
}

function mergeJsDocComment(content: DocumentationContent[], doc: ts.JSDocTag) {
	// Get whitespace after tag
	const newContent = `\n${getJsDocText(doc)}`;

	if (content.length > 0) {
		const old = content[content.length - 1].value || '';
		if (typeof old === 'string')
			content[content.length - 1].value = old + newContent;
		else old.push({ value: newContent });
	} else content.push({ value: newContent });
}

function getNodeDocs(node: ts.Node, result: Node) {
	const jsDoc = node.jsDoc as ts.JSDoc[];
	const content: DocumentationContent[] = [];
	const docs: Documentation = { content };

	jsDoc?.forEach(doc => {
		const value = parseJsDocComment(doc.comment);
		if (value) content.push({ value });
	});
	tsLocal.getJSDocTags(node).forEach(doc => {
		const tag =
			doc.tagName.escapedText === 'description'
				? undefined
				: (doc.tagName.escapedText as string);

		// Invalid tag, append to previous content
		if (
			doc.comment &&
			tag &&
			!currentOptions?.customJsDocTags?.includes(tag) &&
			tag !== tag.toLowerCase() &&
			content.length > 0
		) {
			mergeJsDocComment(content, doc);
			return;
		}
		const name = (doc as ts.JSDocSeeTag).name?.getText();
		let value = doc.comment ? parseJsDocComment(doc.comment) : name;

		if (tag === 'deprecated') result.flags |= Flags.Deprecated;
		if (tag === 'see' && doc.comment === '*') value = name;
		if (tag === 'beta') docs.beta = true;
		if (currentOptions.cxlExtensions) {
			if (tag === 'attribute') result.kind = Kind.Attribute;
			else if (tag === 'event') result.kind = Kind.Event;
		}

		if (value && !(tag === 'param' && node.kind !== SK.Parameter))
			content.push({
				tag,
				value,
			});
	});

	return content.length ? docs : undefined;
}

function serializeDeclaration(node: ts.Declaration): Node {
	const result = createNode(node);
	if (!result.id) {
		result.id = createNodeId(node, result);
	}
	result.flags |= getDeclarationFlags(
		node,
		tsLocal.getCombinedModifierFlags(node),
	);

	const id = result.id;

	const typeParameters = (node as ts.ClassLikeDeclaration).typeParameters;
	if (typeParameters) result.typeParameters = typeParameters.map(serialize);

	if (tsLocal.isEnumMember(node))
		result.value = JSON.stringify(typeChecker.getConstantValue(node));
	else if ((node as ts.PropertyAssignment).initializer)
		result.value = serializeExpression(
			(node as ts.PropertyAssignment).initializer,
		);

	if (id) currentIndex[id] = result;

	return result;
}

function serializeTypeParameter(node: ts.TypeParameterDeclaration) {
	const result = serializeDeclaration(node);
	if (node.default && node.getSourceFile())
		result.value = node.default.getText();
	if (node.constraint) result.children = [serialize(node.constraint)];
	return result;
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
	typeArgs?: readonly ts.Type[],
): Node {
	const node = symbol.declarations?.[0] || symbol.valueDeclaration;
	const name =
		symbol.flags & tsLocal.SymbolFlags.Namespace ||
		node?.kind === SK.EnumMember
			? normalizeModuleName(symbol)
			: symbol.getName();

	if (!node) {
		return {
			name,
			flags: 0,
			kind: Kind.Reference,
			typeParameters:
				typeArgs && typeArgs.length
					? typeArgs.map(serializeType)
					: undefined,
		};
	}

	return {
		name,
		flags: 0,
		kind: Kind.Reference,
		type: getNodeFromDeclaration(symbol, node),
		typeParameters:
			typeArgs && typeArgs.length
				? typeArgs.map(serializeType)
				: undefined,
	};
}

function isReferenceType(type: ts.Type) {
	return (
		type.flags & TF.Enum ||
		type.flags & TF.EnumLiteral ||
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

function getSymbolDeclaration(symbol?: ts.Symbol) {
	return symbol && (symbol.declarations?.[0] || symbol.valueDeclaration);
}

function serializeSymbol(symbol: ts.Symbol): Node {
	const tsNode = getSymbolDeclaration(symbol);
	const node = tsNode
		? serialize(tsNode)
		: {
				name: symbol.name,
				kind: Kind.Unknown,
				flags: 0,
		  };
	if (node.kind !== Kind.Namespace) node.name = symbol.name;
	return node;
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
			tsLocal.NodeBuilderFlags.NoTruncation,
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

function isArrayType(type: ts.Type) {
	return (
		typeChecker as unknown as { isArrayType: (type: ts.Type) => boolean }
	).isArrayType(type);
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
	if (type.flags & TF.Index) return serializeKeyofType(type as ts.IndexType);
	if (type.flags & TF.IndexedAccess)
		return serializeIndexedAccessType(type as ts.IndexedAccessType);

	if (isArrayType(type)) return serializeTypeObject(type as ts.ObjectType);

	if (type.symbol?.flags & tsLocal.SymbolFlags.Namespace) {
		const result = getSymbolReference(type.symbol);
		result.kind = Kind.ImportType;
		return result;
	}

	if (isReferenceType(type) && type.symbol)
		return getSymbolReference(
			type.symbol,
			typeChecker.getTypeArguments(type as ts.TypeReference),
		);

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
	node: ts.FunctionLikeDeclaration | ts.MethodSignature,
) {
	const result = serializeDeclaration(node);
	const signature = typeChecker.getSignatureFromDeclaration(node);

	if (node.kind === SK.ArrowFunction || node.kind === SK.FunctionExpression)
		result.kind = Kind.Function;
	else if (node.kind === SK.MethodSignature) result.kind = Kind.Method;

	if (node.type) result.type = serialize(node.type);

	if (node.typeParameters)
		result.typeParameters = node.typeParameters.map(serialize);

	result.parameters = signature
		? signature.getParameters().map(serializeParameter)
		: node.parameters.map(serialize);

	const type = typeChecker.getTypeAtLocation(node);
	const allSignatures = typeChecker.getSignaturesOfType(
		type,
		tsLocal.SignatureKind.Call,
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
					name,
				),
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
	result: Node,
): boolean {
	const augment = getCxlDecorator(node, 'Augment');
	const args = (augment?.expression as ts.CallExpression)?.arguments;
	const docs: Documentation = result.docs || {};
	const extendName = node.heritageClauses?.find(h =>
		h.types.find(t => t.expression.getText().trim() === 'Component'),
	);

	if (augment || extendName) result.kind = Kind.Component;
	else return false;

	if (result.children) {
		const tagNode = result.children.find(
			m =>
				m.name === 'tagName' &&
				m.kind === Kind.Property &&
				m.flags & Flags.Static,
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

	if (currentOptions.cxlExtensions) isCxlAttribute(node, result);

	if (!result.type) {
		const nodeType = (node as ts.VariableDeclaration).type;
		if (nodeType) result.type = serialize(nodeType);
		else if (
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

	if (tsLocal.isTypeAliasDeclaration(node)) {
		const typeObj = typeChecker.getTypeAtLocation(node);
		result.resolvedType = getResolvedType(typeObj);
	}

	return result;
}

function pushChildren(parent: Node, nodes: Node[]) {
	parent.children ||= [];

	for (const n of nodes) {
		if (!n.parent) {
			Object.defineProperty(n, 'parent', {
				value: parent,
				enumerable: false,
			});
			parent.children.push(n);
		}
	}
}

function serializeObject(
	node: ts.TypeLiteralNode | ts.ObjectLiteralExpression,
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

function findSymbolOriginalFileNode(symbol: ts.Symbol) {
	const decl = getSymbolDeclaration(symbol);
	const sf = decl && getDeclarationOriginalFile(decl);
	return sf ? moduleMap[sf] : undefined;
}

function getSymbolFullyQualifiedName(symbol: ts.Symbol) {
	return (symbol.$$fqn ??= typeChecker.getFullyQualifiedName(symbol));
}

function findExport(symbol?: ts.Symbol) {
	if (!symbol) return;

	if (currentOptions.followReferences) {
		const sourceFile = findSymbolOriginalFileNode(symbol);
		if (sourceFile) {
			const existing = sourceFile.children?.find(
				c => c.name === symbol.name,
			);
			if (existing) return existing;
		}
	}

	const existing = symbol && exportIndex[getSymbolFullyQualifiedName(symbol)];
	return existing?.source ? existing : undefined;
}

function serializeClass(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
	const symbol =
		typeChecker.getSymbolAtLocation(node) ||
		(node.name && typeChecker.getSymbolAtLocation(node.name));

	let result: Node | undefined;

	if (
		node.kind === SK.InterfaceDeclaration &&
		symbol &&
		!(symbol.flags & tsLocal.SymbolFlags.Class)
	) {
		result = findExport(symbol);

		if (!result && symbol.declarations) {
			const decl = symbol.declarations.find(decl => decl[dtsNode]);
			// Ensure interface node is initialized
			if (decl) result = serializeDeclaration(decl);
		}
	}

	if (!result) result = serializeDeclaration(node);

	if (
		node.members &&
		(!result.children || node.kind === SK.InterfaceDeclaration)
	)
		pushChildren(result, node.members.map(serialize));

	// Add constructor defined properties to container class
	if (result.children)
		for (const member of result.children)
			if (member.kind === Kind.Constructor && member.parameters)
				for (const param of member.parameters)
					if (param.kind === Kind.Property)
						pushChildren(result, [param]);

	if (symbol) {
		if (
			tsLocal.isInterfaceDeclaration(node) &&
			symbol.flags & tsLocal.SymbolFlags.Class
		) {
			const decl = symbol.declarations?.[0] || symbol.valueDeclaration;
			result.flags |= Flags.DeclarationMerge;
			if (result.children && decl) {
				const existingClass = getNodeFromDeclaration(symbol, decl);
				if (existingClass)
					pushChildren(
						existingClass,
						result.children.map(s => ({ ...s })),
					);
			}
		}
	}

	if (currentOptions.cxlExtensions) getCxlClassMeta(node, result);

	if (node.heritageClauses?.length) {
		const type: Node = (result.type = {
			flags: 0,
			kind: Kind.ClassType,
			name: '',
			type: result,
		});

		node.heritageClauses.forEach(heritage =>
			pushChildren(type, heritage.types.map(serialize)),
		);

		if (type.children)
			for (const c of type.children) {
				if (c.kind === Kind.Reference && c.type)
					(c.type.extendedBy || (c.type.extendedBy = [])).push({
						name: result.name,
						type: result,
						kind: Kind.Reference,
						flags: 0,
					});
			}
	}

	return result;
}

function getTypeDeclaration(type: ts.Type, symbol: ts.Symbol) {
	const OF = tsLocal.ObjectFlags;
	const kind =
		(type as ts.ObjectType).objectFlags & OF.Interface
			? SK.InterfaceDeclaration
			: undefined;
	const decl = kind
		? symbol.declarations?.find(d => d.kind === kind)
		: symbol.declarations?.[0] || symbol.valueDeclaration;
	return decl;
}

function serializeReference(node: ts.TypeReferenceType) {
	const typeObj = typeChecker.getTypeFromTypeNode(node);

	let symbol: ts.Symbol | undefined = typeObj.aliasSymbol || typeObj.symbol;
	if (!symbol && tsLocal.isTypeReferenceNode(node))
		symbol = typeChecker.getSymbolAtLocation(node.typeName);

	const decl = symbol && getTypeDeclaration(typeObj, symbol);
	const type =
		decl && symbol
			? getNodeFromDeclaration(symbol, decl)
			: node.flags & tsLocal.NodeFlags.Synthesized
			? undefined
			: serializeType(typeObj);
	const name = getNodeName(
		tsLocal.isTypeReferenceNode(node) ? node.typeName : node.expression,
	);
	if (type && !type.name) type.name = name;
	const resolvedType =
		type && decl && tsLocal.isTypeAliasDeclaration(decl)
			? getResolvedType(typeObj)
			: undefined;

	return createNode(node, {
		name,
		kind: Kind.Reference,
		type,
		resolvedType,
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
		id: createNodeId(node),
		name: '__index',
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

function serializeExportSpecifier(node: ts.ExportSpecifier) {
	const symbol = typeChecker.getExportSpecifierLocalTargetSymbol(node);
	if (symbol) {
		const result = serializeSymbol(symbol);
		result.name = node.name.text;
		result.flags |= Flags.Export;
		if (result.kind === Kind.Unknown) result.kind = Kind.Export;
		return result;
	}
	return serializeDeclarationWithType(node);
}

function normalizeSourceFileName(name: string) {
	const root = currentOptions.rootDir ?? config?.options.rootDir ?? '';
	return relative(root, name);
}

function normalizeModuleName(symbol: ts.Symbol) {
	let parent: ts.Symbol | undefined = symbol;
	const result = [
		symbol.valueDeclaration?.kind === SK.SourceFile &&
		symbol.name.startsWith('"')
			? `"${normalizeSourceFileName(symbol.name.slice(1, -1))}"`
			: symbol.name,
	];

	while ((parent = (parent as unknown as { parent?: ts.Symbol }).parent)) {
		if (parent.valueDeclaration?.kind !== SK.SourceFile)
			result.unshift(parent.name);
	}

	return result.join('.');
}

function findModuleResultNode(
	node: ts.ModuleDeclaration,
	symbol: ts.Symbol | undefined,
) {
	const moduleName = symbol ? normalizeModuleName(symbol) : undefined;
	if (symbol) {
		if (symbol.$$moduleResult) return symbol.$$moduleResult;
		if (moduleName && currentOptions.followReferences) {
			const existing =
				parseModule(symbol, node.getSourceFile()) ||
				moduleMap[moduleName];
			if (existing) return (symbol.$$moduleResult = existing);
		}
	}

	const result = serializeDeclaration(node);
	if (symbol) symbol.$$moduleResult = result;
	if (moduleName) {
		if (currentOptions.forceExports?.includes(moduleName))
			result.flags |= Flags.Export;

		result.name = moduleName;
		moduleMap[moduleName] = result;
	}
	return result;
}

function shouldPublishNamespace(symbol: ts.Symbol | undefined, result: Node) {
	if (!symbol) return false;

	if (extraModules.includes(result)) return false;

	if (currentOptions.exportsOnly) {
		// Publish namespace only if all parents are exported
		let parent: ts.Symbol | undefined = symbol;
		do {
			if (parent.valueDeclaration?.kind === SK.SourceFile) break;
			const dtsNode = parent.$$moduleResult;
			if (!dtsNode || !(dtsNode.flags & Flags.Export)) return false;
		} while (
			(parent = (parent as unknown as { parent?: ts.Symbol }).parent)
		);
	}
	return true;
}

function serializeModule(node: ts.ModuleDeclaration) {
	const symbol =
		typeChecker.getSymbolAtLocation(node) ||
		(node.name && typeChecker.getSymbolAtLocation(node.name));

	const result = findModuleResultNode(node, symbol);
	node.body?.forEachChild(c => visit(c, result));

	if (symbol && result.flags & Flags.Export) collectExports(symbol);

	if (shouldPublishNamespace(symbol, result)) {
		extraModules.push(result);
	}

	return result;
}

function serializeImportType(node: ts.ImportTypeNode) {
	const symbol = typeChecker.getSymbolAtLocation(node);
	if (symbol) {
		const result = getSymbolReference(symbol);
		result.kind = Kind.ImportType;
		return result;
	}

	return createNode(node, {});
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
	[SK.Parameter]: serializeDeclarationWithType,
	[SK.PropertyDeclaration]: serializeDeclarationWithType,
	[SK.MethodDeclaration]: serializeFunction,
	[SK.MethodSignature]: serializeFunction,
	[SK.ClassDeclaration]: serializeClass,
	[SK.TypeAliasDeclaration]: serializeDeclarationWithType,
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
	[SK.ModuleDeclaration]: serializeModule,
	[SK.NamespaceExport]: serializeDeclarationWithType,
	[SK.NamespaceImport]: serializeDeclarationWithType,
	[SK.ExportSpecifier]: serializeExportSpecifier,
	[SK.ImportType]: serializeImportType,
	[SK.SymbolKeyword]: serializeDeclaration,
};

function setup(
	{ options, errors, fileNames, projectReferences }: ts.ParsedCommandLine,
	_dtsOptions?: BuildOptions,
	host?: ts.CompilerHost,
) {
	options.noEmit = true;
	if (!host) host = tsLocal.createCompilerHost(options);

	program = tsLocal.createProgram({
		configFileParsingDiagnostics: errors,
		rootNames: fileNames,
		projectReferences,
		options,
		host,
	});
	typeChecker = program.getTypeChecker();
}

/**
 * Returns node original file if it comes from a project reference.
 */
function getDeclarationOriginalFile(decl: ts.Declaration) {
	const sourceFile =
		decl.kind === SK.SourceFile
			? (decl as ts.SourceFile)
			: decl.getSourceFile();
	return sourceFile.isDeclarationFile
		? (sourceFile as unknown as { originalFileName?: string })
				.originalFileName
		: undefined;
}

function findSourceFileReference(path: string) {
	const references = program.getResolvedProjectReferences();
	if (references)
		return references.find(
			ref => ref?.commandLine.fileNames.includes(path),
		);
}

function parseModule(symbol: ts.Symbol, from: ts.SourceFile) {
	const sf = getSymbolDeclaration(symbol);

	if (sf && tsLocal.isSourceFile(sf) && !sourceFiles.includes(sf)) {
		if (sf.isDeclarationFile) {
			if (currentOptions.followReferences) {
				const originalPath = getDeclarationOriginalFile(sf);
				const project =
					originalPath && findSourceFileReference(originalPath);
				if (project) {
					buildReference(project.commandLine);
					const moduleName = normalizeSourceFileName(originalPath);
					return extraModules.find(m => m.name === moduleName);
				}
			}
			if (from.isDeclarationFile) return parseSourceFile(sf);
		} else return parseSourceFile(sf);
	}
}

function visit(n: ts.Node, parent: Node) {
	function push(node: ts.Node) {
		const child = serialize(node);
		if (!currentOptions.exportsOnly || child.flags & Flags.Export)
			pushChildren(parent, [child]);
	}
	if (tsLocal.isVariableStatement(n)) {
		n.declarationList.declarations.map(push);
	} else if (tsLocal.isExportDeclaration(n)) {
		if (n.exportClause) {
			if (tsLocal.isNamedExports(n.exportClause))
				n.exportClause.elements.forEach(push);
			else push(n.exportClause);
		} else if (n.moduleSpecifier) {
			// Handle export * from 'module';
			const symbol = typeChecker.getSymbolAtLocation(n.moduleSpecifier);
			if (symbol) parseModule(symbol, n.getSourceFile());
		}
	} else
		switch (n.kind) {
			case SK.InterfaceDeclaration:
			case SK.TypeAliasDeclaration:
			case SK.FunctionDeclaration:
			case SK.EnumDeclaration:
			case SK.VariableDeclaration:
			case SK.ClassDeclaration:
				push(n);
				break;
			case SK.ModuleDeclaration:
				serializeModule(n as ts.ModuleDeclaration);
		}
}

function collectExports(symbol: ts.Symbol) {
	symbol.exports?.forEach(s => {
		const node = getSymbolDeclaration(s);
		if (
			node?.[dtsNode]?.source &&
			!(node[dtsNode].flags & Flags.Internal)
		) {
			exportIndex[getSymbolFullyQualifiedName(s)] = node[dtsNode];
		}
	});
}

function parseSourceFile(sourceFile: ts.SourceFile) {
	if (moduleMap[sourceFile.fileName]) return moduleMap[sourceFile.fileName];
	const result = createNode(sourceFile);

	moduleMap[sourceFile.fileName] = result;

	if (result.flags & Flags.Internal) return result;
	sourceFile.forEachChild(c => visit(c, result));

	const symbol = typeChecker.getSymbolAtLocation(sourceFile);
	if (symbol) collectExports(symbol);

	if (sourceFile.isDeclarationFile)
		sourceFile.referencedFiles.forEach(ref => {
			const fn = ref.fileName;
			if (config?.fileNames.includes(fn)) return;

			const sf = program.getSourceFile(fn);
			if (
				sf &&
				!program.isSourceFileDefaultLibrary(sf) &&
				!program.isSourceFileFromExternalLibrary(sf)
			) {
				parseSourceFile(sf);
			}
		});

	if (result.children?.length) extraModules.push(result);

	return result;
}

/**
 * Generate AST from a source string
 *
 * @param source Source to parse
 * @param options Typescript compiler options
 */
export function parse(options: ParseOptions): Node[] {
	const compilerOptions = {
		...{
			lib: ['lib.es2022.d.ts'],
			module: tsLocal.ModuleKind.ESNext,
			target: tsLocal.ScriptTarget.ESNext,
			types: [],
			declaration: false,
			noEmit: true,
		},
		...options.compilerOptions,
	};
	const fileName = options.fileName || `(${Date.now()}).tsx`;

	const host = tsLocal.createCompilerHost(compilerOptions);
	const oldGetSourceFile = host.getSourceFile;
	let sourceFile: ts.SourceFile | undefined;
	currentOptions = {
		...defaultOptions,
		...options,
	};
	currentIndex = {};
	extraModules = [];
	moduleMap = {};
	exportIndex = {};
	currentId = 1;

	host.getSourceFile = function (
		fn: string,
		target: ts.ScriptTarget,
		onError?: (message: string) => void,
		shouldCreateNewSourceFile?: boolean,
	) {
		return fn === fileName
			? (sourceFile = tsLocal.createSourceFile(
					fileName,
					options.source,
					target,
			  ))
			: oldGetSourceFile.call(
					this,
					fn,
					target,
					onError,
					shouldCreateNewSourceFile,
			  );
	};

	setup(
		{ fileNames: [fileName], options: compilerOptions, errors: [] },
		currentOptions,
		host,
	);
	if (!sourceFile) throw new Error('Invalid Source File');
	sourceFiles = [sourceFile];

	const sourceNode = parseSourceFile(sourceFile);
	return sourceNode.children || extraModules || [];
}

function buildProject(config: ts.ParsedCommandLine) {
	setup(config);
	sourceFiles = config.fileNames.flatMap(
		fp => program.getSourceFile(fp) || [],
	);
	sourceFiles.forEach(parseSourceFile);
}

function buildReference(config: ts.ParsedCommandLine) {
	const path = (config.options as { configFilePath: string }).configFilePath;

	if (!builtReferences.includes(path)) {
		const oldProgram = program;
		const oldTypeChecker = typeChecker;

		builtReferences.push(path);
		buildProject(config);

		program = oldProgram;
		typeChecker = oldTypeChecker;
	}
}

function buildTsconfig(
	config: ts.ParsedCommandLine,
	options: BuildOptions,
): Output {
	currentOptions = options;
	moduleMap = {};
	exportIndex = {};
	builtReferences = [];

	const result = {
		modules: (extraModules ||= []),
		index: (currentIndex ||= {}),
		config,
		env: {
			typescript: tsLocal.version,
		},
	};

	config.projectReferences?.forEach(ref => {
		if (ref.prepend)
			buildReference(
				parseTsConfig(tsLocal.resolveProjectReferencePath(ref)),
			);
	});

	buildProject(config);

	return result;
}

export function buildConfig(
	json: unknown,
	basePath: string,
	options?: BuildOptions,
): Output {
	config = tsLocal.parseJsonConfigFileContent(
		json,
		parseConfigHost,
		basePath,
	);
	return buildTsconfig(config, {
		...defaultOptions,
		...options,
	});
}

/**
 * Generate AST from a tsconfig file
 *
 * @param tsconfig Path to tsconfig.json file
 */
export function build(
	tsconfig = resolve('tsconfig.json'),
	options?: Partial<BuildOptions>,
): Output {
	const allOptions = {
		...defaultOptions,
		...options,
	};
	config = parseTsConfig(tsconfig, allOptions);
	return buildTsconfig(config, allOptions);
}
