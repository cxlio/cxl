import { spec } from '../spec/index.js';
import { diff, patch } from './index.js';

export default spec('diff', s => {
	const A =
		'Lorem ipsum dolor sit amet\n' +
		'ex meis noluisse quaestio pro\n' +
		'possit aeterno no duo\n' +
		'Et mei voluptua interpretaris\n' +
		'alienum suscipit sensibus eu per\n' +
		'Eu quis summo intellegam sed\n' +
		'fugit option quo id\n' +
		'possim maiestatis at vix.';

	const B =
		'Lorem ipsum dolor sit amet\n' +
		'ut audiam qualisque duo\n' +
		'possit aeterno no duo\n' +
		'te usu eruditi feugait\n' +
		'Eos petentium erroribus et\n' +
		'Eu quis summo intellegam sed\n' +
		'fugit option quo id\n' +
		'vix volumus abhorreant accommodare cu.';

	s.test('long text', a => {
		const result = diff(A, B);
		const C = patch(A, result);
		a.equal(C, B);
	});
});
