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
const PARSE_KEY = /(shift|ctrl|control|alt|option|meta|command|cmd|mod|\w+)(\s*\+|\s)?/g;
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
	element.addEventListener('keydown', handler);
	return () => element.removeEventListener('keydown', handler);
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
	{ modKey, shiftMap }: KeyboardLayout = getDefaultLayout()
): Key[] {
	const sequence: Key[] = [];
	/*let k,
		shortcut;*/
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
			const shifted = shiftMap[ch];
			if (shifted) event.shiftKey = false;
			event.key = shifted || ch;
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

/*export class KeyboardManager {
	delay = 250;
	t = 0;
	sequence: string[] = [];
	disabled = false;
	// What to replace "mod" with, ctrl for win, meta for osx
	MODREPLACE: 'ctrl+' | 'meta+' = 'ctrl+';

	MAP: KeyNameMap = {
		8: 'backspace',
		9: 'tab',
		13: 'enter',
		17: 'ctrl',
		18: 'alt',
		20: 'capslock',
		27: 'esc',
		32: 'space',
		33: 'pageup',
		34: 'pagedown',
		35: 'end',
		36: 'home',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		45: 'ins',
		46: 'del',
		91: 'meta',
		93: 'meta',
		224: 'meta',
		106: '*',
		107: 'plus',
		109: '-',
		110: '.',
		111: '/',
		186: ';',
		187: '=',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		192: '`',
		219: '[',
		220: '\\',
		221: ']',
		222: "'",
	};

	MODMAP: KeyNameMap = {
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		93: 'meta',
		224: 'meta',
	};

	SHIFTMAP: KeyNameMap = {
		192: '~',
		222: '"',
		221: '}',
		220: '|',
		219: '{',
		191: '?',
		190: '>',
		189: '_',
		188: '<',
		187: 'plus',
		186: ':',
		48: ')',
		49: '!',
		50: '@',
		51: '#',
		52: '$',
		53: '%',
		54: '^',
		55: '&',
		56: '*',
		57: '(',
	};

	constructor() {
		const _MAP = this.MAP;

		for (let i = 1; i < 20; ++i) _MAP[111 + i] = 'f' + i;

		for (let i = 0; i <= 9; ++i) _MAP[i + 96] = i + '';

		for (let i = 65; i < 91; ++i)
			_MAP[i] = String.fromCharCode(i).toLowerCase();

		// Make sure keydown is handled first, before the editor
		window.addEventListener('keydown', this.onKeyDown.bind(this), true);

		this.MODREPLACE = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
			? 'meta+'
			: 'ctrl+';
	}

	onKeyDown(ev: KeyboardEvent) {
		if (this.disabled) return;
		const k = keyboardEventToString(ev);
		let t = Date.now();
		if (!k) return;

		if (t - this.t < this.delay) this.sequence.push(k);
		else this.sequence = [k];

		const seq = this.sequence.slice(0);

		do {
			if (this.handleKey(seq.join(' ')) !== false) {
				ev.stopPropagation();
				ev.preventDefault();
				t = 0;
				break;
			}
			seq.shift();
		} while (seq.length);

		this.t = t;
	}

	/*_findKey(keymap: KeyMap, state: any, action: string)
	{
		state = state || keymap.getState();

		for (var i in state)
			if (state[i].action===action)
				return i;
	}

	findKey(action: string, state: any)
	{
	var
		keymap = ide.editor && ide.editor.keymap,
		result
	;
		if (keymap)
			result = this._findKey(keymap, state, action);

		if (!result)
			result = this._findKey(ide.keymap, state, action);

		return result;
	}*/

/**
 * Handles Key. First checks if there is a keymap defined for the
 * current editor.
 */
/*handleKey(key)
	{
	var
		keymap = ide.editor && ide.editor.keymap,
		state = keymap && keymap.state,
		result = false
	;
		if (keymap)
			result = keymap.handle(key);

		if (result===false)
			result = ide.keymap.handle(key, state);

		return result=== Pass ? false : result;
	}*/
