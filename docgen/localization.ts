import { Flags, Kind } from '@cxl/dts';

export const FlagsMap: Record<Flags, string> = {
	[Flags.None]: '',
	[Flags.Export]: 'export',
	[Flags.Ambient]: 'ambient',
	[Flags.Public]: 'public',
	[Flags.Private]: 'private',
	[Flags.Protected]: 'protected',
	[Flags.Static]: 'static',
	[Flags.Readonly]: 'readonly',
	[Flags.Abstract]: 'abstract',
	[Flags.Async]: 'async',
	[Flags.Default]: 'default',
	[Flags.Deprecated]: 'deprecated',
	// Custom Flags
	[Flags.Overload]: 'overload',
	[Flags.External]: 'external',
	[Flags.DefaultLibrary]: 'default-library',
	[Flags.DeclarationMerge]: 'declaration-merge',
	[Flags.Rest]: 'rest',
	[Flags.Optional]: 'optional',
	[Flags.Internal]: 'internal',
};

export const KindMap: Record<Kind, string> = {
	[Kind.Unknown]: 'Unknown',
	[Kind.Constant]: 'Constant',
	[Kind.Variable]: 'Variable',
	[Kind.BaseType]: 'BaseType',
	[Kind.TypeAlias]: 'Type Alias',
	[Kind.TypeParameter]: 'Type Parameter',
	[Kind.Interface]: 'Interface',
	[Kind.TypeUnion]: 'Union',
	[Kind.Reference]: 'Reference',
	[Kind.Module]: 'Module',
	[Kind.Class]: 'Class',
	[Kind.ClassType]: 'Class Type',
	[Kind.Parameter]: 'Parameter',
	[Kind.Property]: 'Property',
	[Kind.Method]: 'Method',
	[Kind.Getter]: 'Getter',
	[Kind.Setter]: 'Setter',
	[Kind.Constructor]: 'Constructor',
	[Kind.Array]: 'Array',
	[Kind.Function]: 'Function',
	[Kind.FunctionType]: 'Function Type',
	[Kind.ConditionalType]: 'Conditional Type',
	[Kind.Parenthesized]: 'Parenthesized',
	[Kind.Infer]: 'Infer',
	[Kind.IndexedType]: 'Indexed Type',
	[Kind.Enum]: 'Enum',
	[Kind.ObjectType]: 'Object Type',
	[Kind.Literal]: 'Literal',
	[Kind.IndexSignature]: 'Index Signature',
	[Kind.Export]: 'Export',
	[Kind.Component]: 'Component',
	[Kind.Attribute]: 'Attribute',
	[Kind.Keyof]: 'Keyof',
	[Kind.Typeof]: 'Typeof',
	[Kind.ConstructorType]: 'Constructor Type',
	[Kind.Tuple]: 'Tuple Type',
	[Kind.ThisType]: 'this',
	[Kind.Namespace]: 'Namespace',
	[Kind.CallSignature]: 'Call Signature',
	[Kind.ConstructSignature]: 'Construct Signature',
	[Kind.MappedType]: 'Mapped Type',
	[Kind.TypeIntersection]: 'Intersection Type',
	[Kind.ReadonlyKeyword]: 'Readonly Keyword',
	[Kind.UnknownType]: 'unknown',
	[Kind.Event]: 'Event',
	[Kind.Spread]: 'Spread',
};

export const GroupTitle: Record<number, string> = {
	[Kind.Constant]: 'Constants',
	[Kind.Variable]: 'Variables',
	[Kind.Interface]: 'Interfaces',
	[Kind.Class]: 'Classes',
	[Kind.Property]: 'Properties',
	[Kind.Method]: 'Methods',
	[Kind.Getter]: 'Getters',
	[Kind.Setter]: 'Setters',
	[Kind.Constructor]: 'Constructor',
	[Kind.Function]: 'Functions',
	[Kind.Enum]: 'Enums',
	[Kind.Component]: 'Components',
	[Kind.Attribute]: 'Attributes',
	[Kind.TypeAlias]: 'Type Alias',
	[Kind.CallSignature]: 'Call Signature',
	[Kind.ConstructSignature]: 'Construct Signature',
	[Kind.Event]: 'Events',
};

const content = {
	Members: 'Members',
	API: 'API',
	'Inherited from': 'Inherited from',
	Unknown: 'Unknown',
	Parameters: 'Parameters',
	Example: 'Example',
	Demo: 'Demo',
	'Extended By': 'Extended By',
};

const jsdocMap: Record<string, string> = {
	see: 'Related',
};

export function groupTitle(kind: Kind) {
	return GroupTitle[kind] || translate('Unknown');
}

export function kindToString(kind: Kind) {
	return KindMap[kind] || kind.toString();
}

export function translate(key: keyof typeof content) {
	return content[key] || key;
}

export function jsdocTitle(tag: string) {
	return jsdocMap[tag] || tag;
}
