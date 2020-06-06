import { Kind } from '../dts/index.js';

const KindMap: Record<Kind, string> = {
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
	[Kind.FunctionOverload]: 'Function',
	[Kind.FunctionType]: 'Function Type',
};

export function kindToString(kind: Kind) {
	return KindMap[kind] || kind.toString();
}
