import { spec } from '@cxl/spec';
import {
	Field,
	Input,
	Label,
	MultiSelect,
	Option,
	Slider,
	PasswordInput,
	List,
	Item,
	C,
	Avatar,
	T,
	Checkbox,
	Button,
} from './index.js';
import { dom } from '../tsx';

export default spec('ui', a => {
	a.test('cxl-textarea', it => {
		it.figure(
			'TextArea',
			`<cxl-field>
			<cxl-label>Prefilled Text Area</cxl-label>
			<cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut"></cxl-textarea>
			</cxl-field>`
		);
	});

	a.test('cxl-select', it => {
		it.figure(
			'SelectBox with value',
			`<cxl-select value="clock"><cxl-option>clock</cxl-option></cxl-select>`
		);
	});

	a.test('cxl-multiselect', it => {
		it.figure(
			'MultiSelect',
			<Field>
				<Label>Multiple Selection</Label>
				<MultiSelect>
					<Option selected>Option A</Option>
					<Option selected>Option B</Option>
					<Option>Option C</Option>
				</MultiSelect>
			</Field>
		);
	});
	a.test('cxl-appbar', it => {
		it.figure(
			'Appbar With Title',
			`<cxl-appbar>
				<cxl-navbar></cxl-navbar>
				<cxl-appbar-title>Appbar Title</cxl-appbar-title>
			 </cxl-appbar>`
		);

		it.figure(
			'Appbar With Tabs',
			`<cxl-appbar>
				<cxl-navbar></cxl-navbar>
				<cxl-appbar-title>Appbar with Tabs</cxl-appbar-title>
				<cxl-tabs>
					<cxl-tab selected>Tab 1</cxl-tab>
					<cxl-tab>Tab 2</cxl-tab>
					<cxl-tab>Tab 3</cxl-tab>
				</cxl-tabs>
			</cxl-appbar>`
		);

		it.figure(
			'Extended Appbar',
			`<cxl-appbar extended>
  <cxl-appbar-title>Appbar Title</cxl-appbar-title>
</cxl-appbar>`
		);

		it.figure(
			'Appbar Contextual',
			`
	 <cxl-appbar contextual="test">
	 <cxl-appbar-contextual name="test">Contextual Appbar</cxl-appbar-contextual>
	 </cxl-appbar>
		`
		);
	});

	a.test('cxl-appbar-search', it => {
		it.figure(
			'AppbarSearch',
			`
 <cxl-appbar>
 <cxl-appbar-title>Title</cxl-appbar-title>
 <cxl-appbar-search></cxl-appbar-search>
 </cxl-appbar>`
		);
	});

	a.test('cxl-avatar', it => {
		it.figure(
			'Avatar Sizes',
			`<cxl-avatar></cxl-avatar><cxl-avatar size="2"></cxl-avatar><cxl-avatar size="-1"></cxl-avatar>`
		);
		it.figure(
			'Avatar Text',
			`<cxl-avatar text="GB"></cxl-avatar><cxl-avatar text="GB" size="-1"></cxl-avatar><cxl-avatar text="GB" size="2"></cxl-avatar>`
		);
		it.figure(
			'Avatar with Image',
			`<cxl-avatar src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="></cxl-avatar>`
		);
	});

	a.test('cxl-badge', a => {
		a.figure(
			'Badge Positioning',
			`
		<cxl-avatar></cxl-avatar><cxl-badge top over>5</cxl-badge>
		<br/>
		<cxl-button primary>Badge<cxl-badge top secondary size="small"></cxl-badge></cxl-button>
		`
		);
	});

	a.test('cxl-button', a => {
		a.figure(
			'Button Styles',
			`<cxl-button primary>Primary</cxl-button><cxl-button secondary>Secondary</cxl-button><cxl-button disabled>Disabled</cxl-button><cxl-button flat>Flat Button</cxl-button><cxl-button outline>With Outline</cxl-button>`
		);

		a.figure(
			'Button[disabled]',
			<>
				<Button disabled>Disabled</Button>
				<Button primary disabled>
					Primary Disabled
				</Button>
				<Button secondary disabled>
					Secondary Disabled
				</Button>
			</>
		);

		a.figure(
			'Button[flat]',
			<>
				<Button flat>Flat</Button>
				<Button flat primary>
					Primary Flat
				</Button>
				<Button flat secondary>
					Secondary Flat
				</Button>
			</>
		);

		a.figure(
			'Button[outline]',
			<>
				<Button outline>Outline</Button>
				<Button outline primary>
					Primary
				</Button>
				<Button outline secondary>
					Secondary
				</Button>
			</>
		);

		a.figure(
			'Button[size]',
			<>
				<Button size="small">Small</Button>
				<Button size="big">Big</Button>
				<Button size={1}>Medium</Button>
			</>
		);
	});

	a.test('cxl-checkbox', a => {
		a.figure('Empty Checkbox', `<cxl-checkbox></cxl-checkbox>`);
		a.figure(
			'Checkbox with Content',
			`<cxl-checkbox>Checkbox With Content</cxl-checkbox>`
		);

		a.figure(
			'Checkbox States',
			`<cxl-checkbox checked></cxl-checkbox>
		<cxl-checkbox indeterminate></cxl-checkbox>`
		);
	});

	a.test('cxl-chip', a => {
		a.figure(
			'Chip Styles',
			`<cxl-chip>Chip</cxl-chip><cxl-chip secondary>Secondary</cxl-chip><cxl-chip primary>Primary</cxl-chip><cxl-chip size="small">Small</cxl-chip>`
		);
		a.figure(
			'Chip[removable]',
			`<cxl-chip removable>Chip</cxl-chip><cxl-chip secondary removable>Secondary</cxl-chip><cxl-chip primary removable>Primary</cxl-chip><cxl-chip size="small" removable>Small</cxl-chip>`
		);
		a.figure(
			'Chip With Avatar',
			`<cxl-chip><cxl-avatar size="small"></cxl-avatar>Chip With Avatar</cxl-chip>`
		);
	});

	a.test('cxl-field', a => {
		a.figure(
			'Filled Text Field',
			<Field>
				<Label>Label</Label>
				<Input value="Input" />
			</Field>
		);

		a.figure(
			'Filled and Outlined Fields',
			`
		<cxl-field>
			<cxl-label>Field Label</cxl-label>
			<cxl-input value="Input Value"></cxl-input>
			<cxl-field-help>Helper Text</cxl-field-help>
		</cxl-field>
		<cxl-field outline>
			<cxl-label>Field Label</cxl-label>
			<cxl-input value="Input Value"></cxl-input>
			<cxl-field-help>Helper Text</cxl-field-help>
		</cxl-field>
		`
		);

		a.figure(
			'Field States',
			`<cxl-field-input label="Enabled"></cxl-field-input>
		<cxl-field-input disabled label="Disabled"></cxl-field-input>
		<cxl-field-input invalid touched label="Invalid"></cxl-field-input>`
		);

		a.figure(
			'Field States outline',
			`<br/><cxl-field-input outline label="Enabled"></cxl-field-input>
		<br/><cxl-field-input outline disabled label="Disabled"></cxl-field-input>
		<br/><cxl-field-input outline invalid touched label="Invalid"></cxl-field-input>`
		);

		a.figure(
			'Dense Fields',
			`
		<cxl-field dense>
			<cxl-label>Filled Text Field</cxl-label>
			<cxl-input></cxl-input>
		</cxl-field><br/>
		<cxl-field outline dense>
			<cxl-label>Outlined Text Field</cxl-label>
			<cxl-input></cxl-input>
		</cxl-field><br/>
		<cxl-field dense floating>
			<cxl-label>Filled Text Field</cxl-label>
			<cxl-input></cxl-input>
		</cxl-field><br/>
		<cxl-field outline dense floating>
			<cxl-label>Outlined Text Field</cxl-label>
			<cxl-input></cxl-input>
		</cxl-field>
		`
		);
	});

	a.test('cxl-field-counter', it => {
		it.figure(
			'FieldCounter empty',
			`<cxl-field><cxl-label>Input Label</cxl-label><cxl-input></cxl-input><cxl-field-counter max="100"></cxl-field-counter></cxl-field>
	`
		);
		it.figure(
			'FieldCounter with value',
			`<cxl-field><cxl-label>Input Label</cxl-label><cxl-input value="Value"></cxl-input><cxl-field-counter max="100"></cxl-field-counter></cxl-field>
	`
		);
	});

	a.test('cxl-fieldset', it => {
		it.figure(
			'Fieldset',
			`<br/><cxl-fieldset>
	<cxl-label>Checkbox Fieldset</cxl-label>
	<cxl-checkbox checked>Checkbox 1 Selected</cxl-checkbox>
	<cxl-checkbox>Checkbox 2</cxl-checkbox>
</cxl-fieldset>`
		);

		it.figure(
			'Fieldset invalid',
			`<br/><cxl-fieldset>
	<cxl-label>Invalid Radio Group</cxl-label>
	<cxl-radio invalid touched name="form-radio">Radio Option 1</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 2</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 3</cxl-radio>
</cxl-fieldset>`
		);
	});
	a.test('cxl-item', it => {
		function Icon(p: { width?: number }) {
			const el = (<span />) as HTMLElement;
			const style = el.style;
			style.display = 'inline-block';
			style.width = style.height = (p.width || 24) + 'px';
			style.backgroundColor = '#ccc';
			return el;
		}
		it.figure('Item One Line', <Item>Single Line Item</Item>);
		it.figure(
			'Item One Line With Icon',
			<Item>
				<Icon /> Single Line Item Icon
			</Item>
		);
		it.figure(
			'Item One Line With Avatar',
			<Item>
				<Avatar /> Single Line Item Icon
			</Item>
		);
		it.figure(
			'Item One Line With Image',
			<Item>
				<Icon width={56} /> Single Line Item Icon
			</Item>
		);
		it.figure(
			'Item One Line With Checkbox',
			<Item>
				<Checkbox checked />
				<C grow>Single Line Item</C>
			</Item>
		);
		it.figure(
			'Item One Line With Avatar and Checkbox',
			<Item>
				<Avatar />
				<C grow>Single Line Item</C>
				<Checkbox checked />
			</Item>
		);

		it.figure(
			'Item Two Line',
			<Item>
				<Avatar />
				<C grow>
					<T subtitle>Two Line Item</T>
					<T subtitle2>Secondary Text</T>
				</C>
				<Icon />
			</Item>
		);
	});
	a.test('cxl-list', a => {
		a.figure(
			'Single Line List',
			<List>
				<Item>
					<Avatar /> One Line Item
				</Item>
				<Item>
					<Avatar /> One Line Item
				</Item>
				<Item>
					<Avatar /> One Line Item
				</Item>
			</List>
		);
	});

	a.test('cxl-password', a => {
		a.figure(
			'PasswordInput',
			<Field>
				<Label>Password Input</Label>
				<PasswordInput value="password" />
			</Field>
		);
	});

	a.test('cxl-progress', a => {
		a.figure(
			'Progress',
			`<cxl-progress value=0></cxl-progress>
			<cxl-progress value=0.5></cxl-progress>
			<cxl-progress value=1></cxl-progress>`
		);
	});

	a.test('cxl-menu', a => {
		a.figure(
			'Menu',
			`<cxl-menu>
<cxl-item disabled>Option disabled</cxl-item>
<cxl-item selected>Option Selected</cxl-item>
<cxl-item>Option 2</cxl-item>
<cxl-hr></cxl-hr>
<cxl-item>Option 3</cxl-item>
</cxl-menu><br/><br/>`
		);
	});

	a.test('cxl-switch', it => {
		it.figure('Switch', '<cxl-switch checked></cxl-switch>');
	});

	a.test('cxl-slider', it => {
		it.figure('Slider', <Slider value={0.5} />);
	});
});
