import { spec } from '@cxl/spec';
import { normalize } from './index.js';

export default spec('keyboard', s => {
	s.test('normalize', it => {
		it.should('parse single keys', a => {
			a.equal(normalize('  x  '), 'x');
		});

		it.should('parse multiple keys', a => {
			a.equal(normalize('  x  y'), 'x y');
			a.equal(normalize('ctrl+shift+x'), 'ctrl+shift+x');
		});

		it.should('parse mod key', a => {
			a.equal(normalize('mod+x'), 'ctrl+x');
			a.equal(normalize('x+mod'), 'ctrl+x');
			a.equal(normalize('MOD+X'), 'ctrl+x');
		});

		it.should('normalize shifted keys', a => {
			a.equal(normalize('shift+5'), '%');
			a.equal(normalize('shift+ctrl+5'), 'ctrl+%');
		});
	});
});
