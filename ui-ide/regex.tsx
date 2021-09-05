///<amd-module name="@cxl/ui-ide/regex.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { Grid, Toolbar, Checkbox, Field, Label, TextArea } from '@cxl/ui';
import { css } from '@cxl/ui/theme.js';
import { dom } from '@cxl/tsx';
import { on } from '@cxl/dom';
import '@cxl/template';

function Flags() {
	return [
		<Checkbox title="Find all matches rather than stopping after the first match">
			Global
		</Checkbox>,
		<Checkbox title="If u flag is also enabled, use Unicode case folding">
			Ignore Case
		</Checkbox>,
		<Checkbox title="Treat beginning and end characters (^ and $) as working over multiple lines">
			Multiline
		</Checkbox>,
		<Checkbox title="Generate indices for substring matches">
			Indices
		</Checkbox>,
		<Checkbox title="Allows '.' to match newlines">Dot All</Checkbox>,
		<Checkbox title="Treat pattern as a sequence of Unicode code points.">
			Unicode
		</Checkbox>,
	] as Checkbox[];
}

@Augment<Regex>('ide-regex', css({}), $ => {
	const regexEl = (<TextArea value={get($, 'regex')} />) as TextArea;
	const replaceOutputEl = dom('pre');
	const matchesEl = dom('pre');
	const inputEl = (<TextArea value={get($, 'input')} />) as TextArea;
	const replaceEl = (<TextArea />) as TextArea;
	const modifierDisplay = dom('span');
	const [
		globalEl,
		caseInsensitiveEl,
		multilineEl,
		indicesEl,
		dotAllEl,
		unicodeEl,
	] = Flags();

	let regex: RegExp;

	function getRegexOptions() {
		return (
			(multilineEl.checked ? 'm' : '') +
			(caseInsensitiveEl.checked ? 'i' : '') +
			(globalEl.checked ? 'g' : '') +
			(indicesEl.checked ? 'd' : '') +
			(dotAllEl.checked ? 's' : '') +
			(unicodeEl.checked ? 'u' : '')
		);
	}

	function getRegex() {
		try {
			return new RegExp(regexEl.value, getRegexOptions());
		} catch (e) {
			return /.^/;
		}
	}

	function update() {
		regex = getRegex();
		let match: RegExpMatchArray | null;
		let MAX = 1000;
		const result = [];

		modifierDisplay.innerText = regex.flags;

		while (MAX-- && (match = regex.exec(inputEl.value))) {
			result.push(match);
			if (!regex.global) break;
		}

		if (replaceEl.value)
			replaceOutputEl.innerText = inputEl.value.replace(
				regex,
				replaceEl.value
			);
		matchesEl.innerText = JSON.stringify(result, null, 4);
	}

	return (
		<Grid $={$ => on($, 'change').raf(update)}>
			<Toolbar>
				{globalEl}
				{caseInsensitiveEl}
				{multilineEl}
				{indicesEl}
				{dotAllEl}
				{unicodeEl}
			</Toolbar>
			<Field>
				<Label>Regular Expression</Label>
				{regexEl}
				{modifierDisplay}
			</Field>
			<Field>
				<Label>Replace With</Label>
				{replaceEl}
			</Field>
			<Field>
				<Label>Input Text</Label>
				{inputEl}
			</Field>
			<Field outline>
				<Label>Replace Output</Label>
				{replaceOutputEl}
			</Field>
			<Field outline>
				<Label>Matches</Label>
				{matchesEl}
			</Field>
		</Grid>
	);
})
export class Regex extends Component {
	@Attribute()
	regex = '';

	@Attribute()
	input = '';
}
