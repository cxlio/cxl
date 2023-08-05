export interface ExtraDocumentation {
	title: string;
	icon?: string;
	file: string;
	index?: boolean;
}

export interface RuntimeConfig {
	activeVersion: string;
	userScripts: string[];
	versions: string;
	repository?: string;
}

export interface Section {
	title?: string;
	items: ExtraDocumentation[];
}

export interface DocsJson {
	extra: Section[];
}

export interface VersionJson {
	all: string[];
}

const ENTITIES_REGEX = /[&<"]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
	'"': '&quot;',
};

export function escape(str: string) {
	return str.replace(
		ENTITIES_REGEX,
		e => ENTITIES_MAP[e as keyof typeof ENTITIES_MAP]
	);
}

export function parseExample(value: string) {
	if (value.startsWith('<caption>')) {
		const newLine = value.indexOf('\n');

		return {
			title: value.slice(0, newLine).trim().replace('</caption>', ''),
			value: (value = value.slice(newLine).trim()),
		};
	}

	return { title: '', value };
}
