/**
 * Try to execute action in editor or workspace.
export function action(name: string)
{
var
	cmd = ide.commandParser.parse(name),
	handler = ide.runParsedCommand.bind(ide, cmd)
;
	handler.action = name;

	return handler;
}
 */

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
}

export const Pass = {};

const PARSESHIFT = /shift\+/,
	PARSECTRL = /ctrl\+/,
	PARSEALT = /(?:alt|option)\+/,
	PARSEMETA = /(?:meta|command)\+/,
	PARSECH = /([^+]+)$/;

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

export function keyboardEventToString(ev: Key): string {
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
	if (ev.shiftKey && !(ev as any).noShift)
		result = result ? result + '+shift' : 'shift';
	if (ev.metaKey) result = result ? result + '+meta' : 'meta';

	return result ? result + '+' + ch : ch;
}

export function handleKeyboard({
	element,
	onKey,
	delay,
}: KeyboardOptions): () => void {
	const D = delay === undefined ? 250 : delay;
	let sequence: string[] = [];
	let lastT = 0;

	function handler(ev: KeyboardEvent) {
		const k = keyboardEventToString(ev);
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

export function parseKey(key: string, mod: 'ctrl+' | 'meta+' = 'ctrl+'): Key[] {
	const sequence = key.replace(/mod\+/g, mod).split(' ');
	let i = sequence.length,
		k,
		shortcut;
	while (i--) {
		shortcut = sequence[i];
		k = PARSECH.exec(shortcut);

		if (k)
			(sequence as any)[i] = {
				ctrlKey: PARSECTRL.test(shortcut),
				altKey: PARSEALT.test(shortcut),
				shiftKey: PARSESHIFT.test(shortcut),
				metaKey: PARSEMETA.test(shortcut),
				key: k[1],
			};
	}

	return (sequence as any) as Key[];
}

export function normalize(key: string): string {
	const sequence = parseKey(key);
	let i = sequence.length;
	while (i--) (sequence as any)[i] = keyboardEventToString(sequence[i]);

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
