import { TestApi, spec, mockFn } from '@cxl/spec';
import {
	KeyboardLayoutData,
	normalize,
	parseKey,
	handleKeyboard,
} from './index.js';

export default spec('keyboard', s => {
	s.test('normalize', it => {
		it.should('handle empty and null inputs', a => {
			a.equal(normalize(''), '');
		});

		it.should('parse single keys', a => {
			a.equal(normalize('  x  '), 'x');
			a.equal(normalize('ctrl+x'), 'ctrl+x');
		});

		it.should('parse multiple keys', a => {
			a.equal(normalize('  x  y'), 'x y');
			a.equal(normalize('x    y'), 'x y');
			a.equal(normalize('ctrl+shift+x'), 'ctrl+shift+x');
		});

		it.should('parse mod key', a => {
			a.equal(normalize('mod+x'), 'ctrl+x');
			a.equal(normalize('x+mod'), 'ctrl+x');
			a.equal(normalize('MOD+X'), 'ctrl+x');
		});

		it.should('normalize shifted keys', a => {
			a.equal(normalize('shift+5'), '%');
			a.equal(normalize('shift+A'), 'shift+a');
			a.equal(normalize('shift+y'), 'shift+y');
			a.equal(normalize('shift+ctrl+5'), 'ctrl+%');
		});

		it.should('handle non character keys', a => {
			a.equal(normalize(':'), ':');
			a.equal(normalize('/'), '/');
			a.equal(normalize('.'), '.');
			a.equal(normalize('?'), '?');
			a.equal(normalize('shift+/'), '?');
			a.equal(normalize('shift+?'), '?');
			a.equal(normalize('ctrl+:'), 'ctrl+:');
		});

		it.should('normalize special keys with modifiers', a => {
			a.equal(normalize('ctrl+alt+del'), 'ctrl+alt+del');
			a.equal(normalize('ctrl+shift+esc'), 'ctrl+shift+esc');
		});
	});
	s.test('parseKey', it => {
		it.should('correctly parse simple keys without modifiers', a => {
			const result = parseKey('a');
			a.equal(result.length, 1);
			a.equal(result[0].key, 'a');
			a.equal(result[0].shiftKey, false);
			a.equal(result[0].ctrlKey, false);
			a.equal(result[0].altKey, false);
			a.equal(result[0].metaKey, false);
		});

		it.should('correctly parse modifier keys', a => {
			const result = parseKey('shift+b');
			a.equal(result.length, 1);
			a.equal(result[0].key, 'b');
			a.equal(result[0].shiftKey, true);
			a.equal(result[0].ctrlKey, false);
			a.equal(result[0].altKey, false);
			a.equal(result[0].metaKey, false);
		});

		it.should('correctly parse multiple keys with modifiers', a => {
			const result = parseKey('ctrl+alt+del');
			a.equal(result.length, 1);
			a.equal(result[0].key, 'del');
			a.equal(result[0].shiftKey, false);
			a.equal(result[0].ctrlKey, true);
			a.equal(result[0].altKey, true);
			a.equal(result[0].metaKey, false);
		});

		it.should('handle key sequences separated by spaces', a => {
			const result = parseKey('ctrl+a ctrl+b');
			a.equal(result.length, 2);
			a.equal(result[0].key, 'a');
			a.equal(result[0].ctrlKey, true);
			a.equal(result[1].key, 'b');
			a.equal(result[1].ctrlKey, true);
		});

		it.should('map mod key to the correct modifier', a => {
			const defaultLayout = KeyboardLayoutData['en-US'];
			const result = parseKey('mod+c');
			a.equal(result.length, 1);
			a.equal(result[0].key, 'c');
			a.equal(result[0][defaultLayout.modKey], true);
		});

		it.should('handle shifted characters correctly', a => {
			const result = parseKey('shift+1');
			a.equal(result.length, 1);
			a.equal(result[0].key, '!'); // assuming shift+1 maps to '@' in shiftMap
			a.equal(result[0].shiftKey, false);
		});
	});

	s.test('handleKeyboard', it => {
		it.should('call onKey with the correct sequence', (a: TestApi) => {
			// Setup a mock element
			const elementMock = a.element('div');
			const on = a.spyFn(elementMock, 'addEventListener');
			const off = a.spyFn(elementMock, 'removeEventListener');

			// Setup a mock callback
			const onKeyMock = mockFn(key => (key === 'a b' ? true : false));
			// Register the handler
			const dispose = handleKeyboard({
				element: elementMock,
				onKey: onKeyMock,
				delay: 100,
				layout: undefined,
				capture: false,
			});

			// Simulate keydown events
			const eventA = new KeyboardEvent('keydown', { key: 'a' });
			const eventB = new KeyboardEvent('keydown', { key: 'b' });

			// This will call the handler linked to the event
			a.assert(typeof on.lastEvent?.arguments[1] === 'function');
			on.lastEvent?.arguments[1](eventA);
			a.equal(onKeyMock.lastArguments?.[0], 'a');
			on.lastEvent?.arguments[1](eventB);
			a.equal(onKeyMock.lastArguments?.[0], 'a b');

			// Cleanup
			dispose();
			a.equal(off.lastEvent?.called, 1);
		});

		it.should('reset sequence after delay', async (a: TestApi) => {
			const elementMock = a.element('div');
			const on = a.spyFn(elementMock, 'addEventListener');
			const off = a.spyFn(elementMock, 'removeEventListener');
			const onKeyMock = mockFn(key => (key === 'a b' ? true : false));
			const dispose = handleKeyboard({
				element: elementMock,
				onKey: onKeyMock,
				delay: 100,
				layout: undefined,
				capture: false,
			});

			// Simulate keydown event
			const eventA = new KeyboardEvent('keydown', { key: 'a' });
			a.assert(typeof on.lastEvent?.arguments[1] === 'function');
			on.lastEvent?.arguments[1](eventA);

			// Advance time beyond delay
			await new Promise(resolve => setTimeout(resolve, 200));
			a.equal(onKeyMock.lastArguments?.[0], 'a');

			// Simulate another keydown event
			const eventC = new KeyboardEvent('keydown', { key: 'c' });
			on.lastEvent?.arguments[1](eventC);
			a.equal(onKeyMock.lastArguments?.[0], 'c');

			// Cleanup
			dispose();
			a.equal(off.lastEvent?.called, 1);
		});
	});
});
