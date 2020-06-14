import * as ts from 'typescript';
import { relative, resolve } from 'path';
import {
	ParsedCommandLine,
	ParseConfigFileHost,
	ModifierFlags,
	getParsedCommandLineOfConfigFile,
	SyntaxKind as SK,
	TypeFlags as TF,
	createProgram,
	sys,
} from 'typescript';

type SerializerMap = {
	[K in SK]?: (node: any) => Node;
};

type Index = Record<number, Node>;

export enum Kind {
	Unknown = SK.Unknown,
	Constant = 1001,
	Variable = SK.VariableDeclaration,
	BaseType = 1002,
	TypeAlias = SK.TypeAliasDeclaration,
	TypeParameter = SK.TypeParameter,
	Interface = SK.InterfaceDeclaration,
	TypeUnion = SK.UnionType,
	Reference = SK.TypeReference,
	Module = SK.SourceFile,
	Class = SK.ClassDeclaration,
	ClassType = 1003,
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
}

interface Documentation {
	name: string;
	value?: string;
}

export enum Flags {
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
	Rest = 4096,
	Optional = 8192,
	Overload = 16384,
	External = 32768,
}

export interface Source {
	sourceFile: ts.SourceFile;
	index: number;
}

export interface Node {
	id?: number;
	name: string;
	kind: Kind;
	source?: Source | Source[];
	flags: Flags;
	docs?: Documentation[];
	value?: string;
	type?: Node;
	typeParameters?: Node[];
	parameters?: Node[];
	children?: Node[];
	extendedBy?: Node[];
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
		case SK.StringKeyword:
		case SK.NumberKeyword:
		case SK.BooleanKeyword:
			return Kind.BaseType;
	}
	return (node.kind as any) as Kind;
}

function getNodeSource(node: ts.Node) {
	const sourceFile = node.getSourceFile();
	return sourceFile ? { sourceFile, index: node.pos } : undefined;
}

function getNodeName(node: ts.Node) {
	if (ts.isLiteralTypeNode(node) || ts.isComputedPropertyName(node))
		return node.getText();

	const anode = node as any;

	if (anode.name) return anode.name.escapedText || anode.name.getText();

	return '';
}

function createNode(node: ts.Node, extra?: Partial<Node>): Node {
	const refNode = (node as any)[dtsNode];
	const source = getNodeSource(node);
	const kind = extra?.kind || getKind(node);

	const name = getNodeName(node);
	const result = {
		name,
		kind,
		flags: 0,
		...extra,
	};

	if (source)
		Object.defineProperty(result, 'source', {
			value: source,
			enumerable: false,
		});

	if (refNode) return Object.assign(refNode, result);

	return ((node as any)[dtsNode] = result);
}

function getNodeFromDeclaration(node: ts.Node): Node {
	let result = (node as any)[dtsNode];

	if (!result) {
		const sourceFile = node.getSourceFile();
		(node as any)[dtsNode] = result =
			!sourceFile ||
			program.isSourceFileFromExternalLibrary(sourceFile) ||
			program.isSourceFileDefaultLibrary(sourceFile)
				? createNode(node, { flags: Flags.External })
				: { id: currentId++ };
	}

	return result;
}

export function isClassMember(node: Node) {
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

function serializeJSDoc(node: ts.JSDocTag): Documentation {
	return {
		name: node.tagName.getText(),
		value: node.comment,
	};
}

function getNodeDocs(node: ts.Node) {
	const tags = ts.getJSDocTags(node);
	const docs = tags.map(serializeJSDoc);
	const jsDoc = (node as any).jsDoc as ts.JSDoc[];

	if (jsDoc) {
		jsDoc.forEach(doc =>
			docs.unshift({
				name: 'comment',
				value: doc.comment,
			})
		);
	}

	return docs.length ? docs : undefined;
}

function serializeDeclaration(node: ts.Declaration): Node {
	const result = createNode(node);

	if (!result.id) {
		result.id = currentId++;
		(node as any)[dtsNode] = result;
	}
	const id = result.id;
	const anode = node as any;
	const docs = getNodeDocs(node);

	result.flags = getFlags(ts.getCombinedModifierFlags(node));

	if (docs) result.docs = docs;

	if (
		isClassMember(result) &&
		!(result.flags & (ModifierFlags.Private | ModifierFlags.Protected))
	)
		result.flags = result.flags | ModifierFlags.Public;

	if (anode.typeParameters)
		result.typeParameters = anode.typeParameters.map(serialize);

	if (anode.type) result.type = serialize(anode.type);

	if (anode.members) result.children = anode.members.map(serialize);

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

	if (node.dotDotDotToken) result.flags = result.flags | Flags.Rest;
	if (node.questionToken) result.flags = result.flags | Flags.Optional;

	return result;
}

function getSymbolReference(
	symbol: ts.Symbol,
	typeArgs?: readonly ts.Type[]
): Node {
	const node = symbol.valueDeclaration || symbol.declarations[0];
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

function serializeType(type: ts.Type): Node {
	if (type.flags & TF.Any) return AnyType;
	if (type.flags & TF.Unknown) return UnknownType;
	if (type.flags & TF.Void) return VoidType;
	if (type.flags & TF.Boolean) return BooleanType;
	if (type.flags & TF.BigInt) return BigIntType;
	if (type.flags & TF.Number || type.isNumberLiteral()) return NumberType;
	if (type.flags & TF.String || type.isStringLiteral()) return StringType;
	if (type.flags & TF.Never) return NeverType;
	if (type.isLiteral()) {
		const baseType = typeChecker.getBaseTypeOfLiteralType(type);
		return serializeType(baseType);
	}

	if (type.aliasSymbol)
		return getSymbolReference(type.aliasSymbol, type.aliasTypeArguments);

	if (type.flags & TF.Object || type.flags & TF.TypeParameter) {
		if (
			(type as any).objectFlags & ts.ObjectFlags.Reference ||
			type.flags & TF.TypeParameter
		)
			return getSymbolReference(
				type.symbol,
				typeChecker.getTypeArguments(type as ts.TypeReference)
			);

		return serialize(type.symbol.valueDeclaration);
	}
	const name = typeChecker.typeToString(type);
	const kind: Kind = Kind.Unknown;

	return { name, kind, flags: 0 };
}

function serializeFunction(node: ts.FunctionLikeDeclaration) {
	const result = serializeDeclaration(node);
	const signature = typeChecker.getSignatureFromDeclaration(node);

	if (node.kind === SK.ArrowFunction) result.kind = Kind.Function;

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

function serializeDeclarationWithType(node: ts.Declaration): Node {
	const result = serializeDeclaration(node);
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

function serializeClass(node: ts.ClassDeclaration) {
	const result = serializeDeclaration(node);

	if (node.heritageClauses?.length) {
		const typeChildren: Node[] = [];
		result.type = {
			children: typeChildren,
			flags: 0,
			kind: Kind.ClassType,
			name: '',
		};

		node.heritageClauses.forEach(heritage => {
			typeChildren.push(...heritage.types.map(serialize));
		});

		typeChildren.forEach(c => {
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

function getReferenceName(node: ts.TypeReferenceType) {
	if (ts.isExpressionWithTypeArguments(node))
		return node.expression.getText();

	if (ts.isTypeReferenceNode(node))
		return ts.isQualifiedName(node.typeName)
			? `${serialize(node.typeName.left)}.${serialize(
					node.typeName.right
			  )}`
			: node.typeName.text;

	console.log(node);
	return '(Unknown)';
}

function serializeReference(node: ts.TypeReferenceType) {
	const name = getReferenceName(node);
	const type = typeChecker.getTypeFromTypeNode(node);
	const symbol = type.aliasSymbol || type.symbol;

	if (!symbol) return serializeType(type);

	const decl = symbol.declarations[0];
	return createNode(node, {
		name,
		kind: Kind.Reference,
		typeParameters: node.typeArguments?.map(serialize),
		type: getNodeFromDeclaration(decl),
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

function serializeIndexedAccessType(node: ts.IndexedAccessTypeNode) {
	return createNode(node, {
		children: [serialize(node.objectType), serialize(node.indexType)],
	});
}

const Serializer: SerializerMap = {
	[SK.AnyKeyword]: () => AnyType,
	[SK.StringKeyword]: () => StringType,
	[SK.NumberKeyword]: () => NumberType,
	[SK.BooleanKeyword]: () => BooleanType,
	[SK.VoidKeyword]: () => VoidType,
	[SK.NeverKeyword]: () => NeverType,
	[SK.FunctionType]: serializeFunction,

	[SK.ArrayType]: serializeArray,
	[SK.FunctionDeclaration]: serializeFunction,
	[SK.ArrowFunction]: serializeFunction,
	[SK.TypeReference]: serializeReference,
	[SK.ExpressionWithTypeArguments]: serializeReference,
	[SK.ConditionalType]: serializeConditionalType,
	[SK.ParenthesizedType]: serializeDeclarationWithType,
	[SK.InferType](node: ts.InferTypeNode) {
		return createNode(node, {
			type: serialize(node.typeParameter),
		});
	},

	[SK.IndexedAccessType]: serializeIndexedAccessType,
	[SK.UnionType](node: ts.UnionTypeNode) {
		return createNode(node, {
			kind: Kind.TypeUnion,
			children: node.types.map(serialize),
		});
	},

	[SK.Constructor]: serializeConstructor,
	[SK.PropertySignature]: serializeDeclarationWithType,
	[SK.Parameter]: serializeDeclarationWithType,
	[SK.PropertyDeclaration]: serializeDeclarationWithType,
	[SK.MethodDeclaration]: serializeFunction,
	[SK.ClassDeclaration]: serializeClass,
	[SK.TypeAliasDeclaration]: serializeDeclaration,
	[SK.TypeParameter]: serializeTypeParameter,
	[SK.InterfaceDeclaration]: serializeClass,
	[SK.VariableDeclaration]: serializeDeclarationWithType,
	[SK.GetAccessor]: serializeFunction,
	[SK.SetAccessor]: serializeFunction,
};

function setup(
	files: string[],
	options: ts.CompilerOptions,
	host: ts.CompilerHost = ts.createCompilerHost(options)
) {
	program = createProgram(files, options, host);

	/*const diagnostics = ts.getPreEmitDiagnostics(program);

	if (diagnostics.length) {
		console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
		throw new Error('Failed to create typescript program');
	}*/

	typeChecker = program.getTypeChecker();
	currentIndex = {};
}

function visit(n: ts.Node, children: Node[]): void {
	if (ts.isVariableStatement(n)) {
		children.push(...n.declarationList.declarations.map(serialize));
	} else
		switch (n.kind) {
			case SK.TypeAliasDeclaration:
			case SK.FunctionDeclaration:
			case SK.VariableDeclaration:
			case SK.ClassDeclaration:
			case SK.InterfaceDeclaration:
				children.push(serialize(n));
		}
}

function markExported(symbol: ts.Symbol) {
	symbol.declarations.forEach(d => {
		if (ts.isExportSpecifier(d) && !(d as any).$$exported) {
			const localSymbol = typeChecker.getExportSpecifierLocalTargetSymbol(
				d
			);
			if (localSymbol) markExported(localSymbol);
		} else (d as any).$$exported = true;
	});
}

function parseSourceFile(sourceFile: ts.SourceFile) {
	const result = createNode(sourceFile);
	const children: Node[] = (result.children = []);
	const symbol = typeChecker.getSymbolAtLocation(sourceFile);

	if (symbol && symbol.exports) symbol.exports.forEach(markExported);

	result.name = relative(process.cwd(), sourceFile.fileName);
	sourceFile.forEachChild(c => visit(c, children));

	return result;
}

export function parse(
	source: string,
	options: ts.CompilerOptions = { lib: ['es6.d.ts'] }
): Node[] {
	const host = ts.createCompilerHost(options);
	const fileName = `(${Date.now()}).tsx`;
	const oldGetSourceFile = host.getSourceFile;
	let sourceFile: any;

	host.getSourceFile = function (fn: string, target: ts.ScriptTarget) {
		return fn === fileName
			? (sourceFile = ts.createSourceFile(fileName, source, target))
			: oldGetSourceFile.apply(this, arguments as any);
	};

	setup([fileName], options || {}, host);

	const sourceNode = parseSourceFile(sourceFile);
	return sourceNode.children || [];
}

export function build(tsconfig = resolve('tsconfig.json')) {
	const config = parseTsConfig(tsconfig);
	setup(config.fileNames, config.options);

	const result: Output = {
		modules: [],
		index: currentIndex,
		config,
	};

	config.fileNames.forEach(file => {
		const source = program.getSourceFile(file);
		if (source) {
			result.modules.push(parseSourceFile(source));
		} else throw new Error(`Could not parse ${source}`);
	});

	return result;
}
