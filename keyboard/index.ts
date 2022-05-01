///<amd-module name="@cxl/keyboard"/>
export type KeyNameMap = Record<number, string>;

export interface Key {
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
	key: string;
}

export interface KeyboardOptions {
	element: HTMLElement;
	onKey: (key: string, sequence: string[]) => boolean;
	/** @default 250 */
	delay?: number;
	/** @default en-US */
	layout?: KeyboardLayout;
	capture?: boolean;
}

export interface KeyboardLayout {
	shiftedKeys: string[];
	shiftMap: Record<string, string>;
	modKey: 'metaKey' | 'ctrlKey';
}

export const Pass = {};

const navigator =
	typeof window !== 'undefined'
		? window.navigator
		: { language: 'en-US', platform: 'nodejs' };

const IS_MAC = /Mac|iPod|iPhone|iPad/;
const PARSE_KEY = /(shift|ctrl|control|alt|option|meta|command|cmd|mod|[^\s+]+)(\s*\+|\s)?/g;
const SHIFT_MAP = {
	'/': '?',
	'.': '>',
	',': '<',
	"'": '"',
	';': ':',
	'[': '{',
	']': '}',
	'\\': '|',
	'`': '~',
	'=': '+',
	'-': '_',
	'1': '!',
	'2': '@',
	'3': '#',
	'4': '$',
	'5': '%',
	'6': '^',
	'7': '&',
	'8': '*',
	'9': '(',
	'0': ')',
};

const KeyboardLayoutData: Record<string, KeyboardLayout> = {
	'en-US': {
		shiftedKeys: Object.values(SHIFT_MAP),
		shiftMap: SHIFT_MAP,
		modKey: IS_MAC.test(navigator.platform) ? 'metaKey' : 'ctrlKey',
	},
};

export const TranslateKey: Record<string, string> = {
	Shift: '',
	Alt: '',
	Meta: '',
	Control: '',
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
	Escape: 'esc',
};

function keyboardEventToString(
	ev: Key,
	{ shiftedKeys }: KeyboardLayout
): string {
	const key = ev.key;
	if (
		!key ||
		key === 'Shift' ||
		key === 'Alt' ||
		key === 'Meta' ||
		key === 'Control'
	)
		return '';

	const ch = TranslateKey[key] || key.toLowerCase();
	let result;
	if (ev.ctrlKey) result = 'ctrl';
	if (ev.altKey) result = result ? result + '+alt' : 'alt';
	if (ev.shiftKey && !shiftedKeys.includes(ch))
		result = result ? result + '+shift' : 'shift';
	if (ev.metaKey) result = result ? result + '+meta' : 'meta';

	return result ? result + '+' + ch : ch;
}

export function handleKeyboard({
	element,
	onKey,
	delay,
	layout,
	capture,
}: KeyboardOptions): () => void {
	const D = delay === undefined ? 250 : delay;
	const locale = navigator.language;
	let sequence: string[] = [];
	let lastT = 0;

	const newLayout =
		layout || KeyboardLayoutData[locale] || KeyboardLayoutData['en-US'];

	function handler(ev: KeyboardEvent) {
		const k = keyboardEventToString(ev, newLayout);
		let t = Date.now();
		if (!k) return;

		if (t - lastT < D) sequence.push(k);
		else sequence = [k];

		const seq = sequence.slice(0);

		do {
			if (onKey(seq.join(' '), sequence) !== false) {
				ev.stopPropagation();
				ev.preventDefault();
				t = 0;
				break;
			}
			seq.shift();
		} while (seq.length);

		lastT = t;
	}
	element.addEventListener('keydown', handler, { capture });
	return () => element.removeEventListener('keydown', handler, { capture });
}

export function getDefaultLayout(): KeyboardLayout {
	return (
		KeyboardLayoutData[navigator?.language] || KeyboardLayoutData['en-US']
	);
}

function newKey(): Key {
	return {
		ctrlKey: false,
		shiftKey: false,
		metaKey: false,
		altKey: false,
		key: '',
	};
}

export function parseKey(
	key: string,
	{ modKey, shiftedKeys, shiftMap }: KeyboardLayout = getDefaultLayout()
): Key[] {
	const sequence: Key[] = [];
	let match: RegExpExecArray | null;
	let event = newKey();

	while ((match = PARSE_KEY.exec(key.toLowerCase()))) {
		const ch = match[1];
		if (ch === 'shift') event.shiftKey = true;
		else if (ch === 'ctrl' || ch === 'control') event.ctrlKey = true;
		else if (ch === 'alt' || ch === 'option') event.altKey = true;
		else if (ch === 'meta' || ch === 'cmd' || ch === 'command')
			event.metaKey = true;
		else if (ch === 'mod') event[modKey] = true;
		else {
			event.key = ch;
			if (event.shiftKey) {
				if (shiftedKeys.includes(ch)) {
					event.shiftKey = false;
				} else {
					const shifted = shiftMap[ch];
					if (shifted) event.key = shifted;
				}
			}
		}

		if (match[2] !== '+') {
			sequence.push(event);
			event = newKey();
		}
	}
	return sequence;
}

export function normalize(key: string, layout = getDefaultLayout()): string {
	const sequence = parseKey(key, layout);
	let i = sequence.length;
	while (i--)
		(sequence as any)[i] = keyboardEventToString(sequence[i], layout);
	return sequence.join(' ');
}
