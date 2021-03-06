import { relative } from 'path';
import { Kind, Output } from '@cxl/dts';
import type { DocGen, File } from './index.js';

function serialize(key: string, value: any) {
	const cwd = process.cwd();

	if (key === 'source') {
		const pos = value.sourceFile.getLineAndCharacterOfPosition(value.index);
		return {
			fileName: relative(cwd, value.sourceFile.fileName),
			line: pos.line,
			ch: pos.character,
		};
	}

	if (value && value.kind === Kind.Reference)
		return {
			id: value.type?.id,
			name: value.name,
			kind: Kind.Reference,
			typeParameters: value.typeParameters,
		};

	return value;
}

export function render(_app: DocGen, output: Output): File[] {
	return [
		{
			name: 'docs.json',
			content: JSON.stringify({ modules: output.modules }, serialize, 2),
		},
	];
}
