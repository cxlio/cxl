(cxl => {
	'use strict';

	const META = cxl.ui.meta,
		component = cxl.component,
		STYLES = { $: { animation: 'fadeIn' } },
		DEFS = {
			appbar: {
				template: `
<docs-component name="cxl-appbar">
	<docs-demo label="Appbar with actions"><!--
<cxl-appbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-button flat primary><cxl-icon icon="heart"></cxl-icon></cxl-button>
	<cxl-button flat primary><cxl-icon icon="search"></cxl-icon></cxl-button>
	<cxl-button flat primary><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-button>
</cxl-appbar>
	--></docs-demo>
	<docs-demo label="Appbar with Navigation"><!--
<div style="position:relative; height: 200px; overflow:hidden">
<cxl-appbar>
	<cxl-navbar modal>
		<cxl-item>Hello</cxl-item>
	</cxl-navbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-tabs>
		<cxl-tab selected>Tab 1</cxl-tab>
		<cxl-tab>Tab 2</cxl-tab>
	</cxl-tabs>
</cxl-appbar>
<cxl-c pad16>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</cxl-c>
</div>
	--></docs-demo>
	<docs-demo label="Appbar with Tabs"><!--
<cxl-appbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-button flat primary><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-button>
	<cxl-tabs>
		<cxl-tab selected>Tab 1</cxl-tab>
		<cxl-tab>Tab 2</cxl-tab>
	</cxl-tabs>
</cxl-appbar>
	--></docs-demo>
<docs-attribute name="extended">
<docs-demo><!--
<div style="position:relative; height: 200px; overflow:hidden">
<cxl-appbar extended>
	<cxl-navbar modal>
		<cxl-item>Hello</cxl-item>
	</cxl-navbar>
	<cxl-appbar-title extended>Appbar Title</cxl-appbar-title>
</cxl-appbar>
</div>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`
			},
			avatar: {
				template: `
<docs-component name="cxl-avatar">

<docs-demo><!--
<cxl-avatar></cxl-avatar>
<cxl-avatar big></cxl-avatar>
<cxl-avatar little></cxl-avatar>
--></docs-demo>
<docs-usage>
	<docs-demo label="Avatar with text"><!--
<cxl-avatar text="HG"></cxl-avatar>
	--></docs-demo>
	<docs-demo label="Changing Background"><!--
<cxl-avatar style="background-color: #FFCDD2" text="RD"></cxl-avatar>
<cxl-avatar style="background-color: #E0F2F1"></cxl-avatar>
<cxl-avatar big style="background-color: #FFCDD2" text="RD"></cxl-avatar>
<cxl-avatar big style="background-color: #E0F2F1"></cxl-avatar>
<cxl-avatar little style="background-color: #FFCDD2" text="RD"></cxl-avatar>
<cxl-avatar little style="background-color: #E0F2F1"></cxl-avatar>
	--></docs-demo>
</docs-usage>
<docs-attribute name="big">
	<docs-demo><!--
<cxl-avatar big></cxl-avatar>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="little">
	<docs-demo><!--
<cxl-avatar little></cxl-avatar>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="src">
	<docs-demo><!--
<cxl-avatar src="avatar.jpg"></cxl-avatar>
<cxl-avatar big src="avatar.jpg"></cxl-avatar>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="text">
	<docs-demo><!--
<cxl-avatar text="HG"></cxl-avatar>
	--></docs-demo>
</docs-attribute>

</docs-component>
			`
			},
			backdrop: {
				template: `
<docs-component name="cxl-backdrop">
	<docs-demo><!--
<cxl-button &="action:bool:=showBackdrop">Show Backdrop</cxl-button>
<cxl-backdrop &="=showBackdrop:show on(click):not:=showBackdrop"></cxl-backdrop>
	--></docs-demo>
</docs-component>
			`
			},
			button: {
				template: `
<docs-component name="cxl-button">
<docs-demo &="owner:@owner"><!--
<cxl-button &="on(click):=event:#toggle =primary:@primary">Toggle</cxl-button>
<cxl-button primary><cxl-icon icon="upload"></cxl-icon> Upload</cxl-button>
<cxl-button disabled>Disabled</cxl-button>
--></docs-demo>

<docs-attribute name="big">
	<docs-demo><!--
<cxl-button big>Big</cxl-button>
<cxl-button big primary>Primary Big</cxl-button>
<cxl-button flat big>Big Disabled</cxl-button>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-button disabled>Disabled</cxl-button>
<cxl-button primary disabled>Primary Disabled</cxl-button>
<cxl-button flat disabled>Flat Disabled</cxl-button>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="flat">
	<docs-demo><!--
<cxl-button flat>Default Flat</cxl-button>
<cxl-button flat disabled>Disabled Flat</cxl-button>
	--></docs-demo>
</docs-attribute>

<docs-attribute name="primary">
	<docs-demo><!--
<cxl-button primary>Primary</cxl-button>
	--></docs-demo>
</docs-attribute>

<docs-attribute name="secondary">
	<docs-demo><!--
<cxl-button secondary>Secondary</cxl-button>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`,
				controller: {
					toggle() {
						this.primary = !this.primary;
					}
				}
			},
			c: {
				template: `
<docs-component name="cxl-c">
	<docs-demo label="Flex Layout"><!--
<div style="display: flex; font-size:20px; color:#fff; text-align:center">
	<cxl-c pad24 style="background:#a00;">1</cxl-c>
	<cxl-c pad24 grow style="background:#0a0;">2</cxl-c>
	<cxl-c pad24 style="background:#00a;">3</cxl-c>
</div>
	--></docs-demo>
	<docs-demo label="Grid Layout"><!--
<cxl-grid columns="auto auto auto" style="color:#fff">
	<cxl-c pad24 style="background:#a00;">1</cxl-c>
	<cxl-c pad24 style="background:#0a0;">2</cxl-c>
	<cxl-c pad24 style="background:#0a0;">3</cxl-c>
	<cxl-c pad24 xs2 style="background:#00a;">4</cxl-c>
	<cxl-c pad24 style="background:#00a;">5</cxl-c>
</cxl-grid>
	--></docs-demo>
	<docs-demo label="Responsive Layout"><!--
<docs-bg>
	<cxl-grid id="cxl-grid-layout" columns="repeat(12, 1fr)">
		<style>
			#cxl-grid-layout cxl-c { background: rgba(255,0,0,0.25); height: 100px; }
		</style>
		<cxl-c xs3 sm2 lg1></cxl-c>
		<cxl-c xs3 sm2 lg1 ></cxl-c>
		<cxl-c xs3 sm2 lg1 ></cxl-c>
		<cxl-c xs3 sm2 lg1 ></cxl-c>

		<cxl-c xs0 sm2 lg1 ></cxl-c>
		<cxl-c xs0 sm2 lg1 ></cxl-c>

		<cxl-c xs0 lg1 ></cxl-c>
		<cxl-c xs0 lg1 ></cxl-c>
		<cxl-c xs0 lg1 ></cxl-c>
		<cxl-c xs0 lg1 ></cxl-c>
		<cxl-c xs0 lg1 ></cxl-c>
		<cxl-c xs0 lg1 ></cxl-c>
	</cxl-grid>
</docs-bg>
	--></docs-demo>
</docs-component>
			`
			},

			calendar: {
				template: `
<docs-component name="cxl-calendar">
	<docs-demo><!--
<cxl-calendar &="@value:=value"></cxl-calendar>
<p>Date Selected: <x &="=value:text"></x></p>
	--></docs-demo>
</docs-component>
			`
			},

			card: {
				template: `
<docs-component name="cxl-card">
<docs-demo label="Card Layout"><!--
<cxl-card>
<cxl-c pad16>
	<cxl-t h5>Title goes here</cxl-t>
	Secondary line text Lorem ipsum dolor sit amet
</cxl-c>
<cxl-c pad8>
	<cxl-button flat>Action 1</cxl-button>
	<cxl-button flat>Action 2</cxl-button>
</cxl-c>
</cxl-card>
--></docs-demo>
<docs-demo label="Card with Images"><!--
<cxl-card>
<cxl-c flex pad16>
	<cxl-avatar style="background:#ccc"></cxl-avatar>
	<cxl-c style="margin-left: 24px">
		<cxl-t subtitle>Card Title</cxl-t>
		<cxl-t subtitle2>Secondary Text</cxl-t>
	</cxl-c>
</cxl-c>
<docs-placeholder style="height:180px"></docs-placeholder>
<cxl-c pad16>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
</cxl-c>
</cxl-card>
--></docs-demo>
</docs-component>
			`
			},
			checkbox: {
				template: `
<docs-component name="cxl-checkbox">
<docs-demo><!--
<cxl-checkbox>Checkbox Label</cxl-checkbox>
<cxl-checkbox checked>Checkbox Label</cxl-checkbox>
--></docs-demo>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-checkbox disabled>Disabled Checkbox Label</cxl-checkbox>
<cxl-checkbox disabled checked>Disabled Checked Checkbox Label</cxl-checkbox>
--></docs-demo>
</docs-attribute>
<docs-attribute name="false-value">
	<docs-demo><!--
<cxl-checkbox &="@value:=test" true-value="yes" false-value="no">Yes/No Checkbox Label</cxl-checkbox><br>
Value: <span &="=test:text"></span>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="true-value">
	<docs-demo><!--
<cxl-checkbox &="@value:=test" checked true-value="yes" false-value="no">Yes/No Checkbox Label</cxl-checkbox><br>
Value: <span &="=test:text"></span>
	--></docs-demo>
</docs-attribute>
</docs-attribute>
<docs-attribute name="value">
	<docs-demo><!--
<cxl-checkbox &="@checked:=test" value="yes" true-value="yes" false-value="no">Yes/No Checkbox Label</cxl-checkbox><br>
Checked: <span &="=test:text"></span>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`
			},
			chip: {
				template: `
<docs-component name="cxl-chip">
<docs-demo><!--
<cxl-chip>Single Chip</cxl-chip>
<cxl-chip removable>Removable Chip</cxl-chip>
<cxl-chip><cxl-icon icon="home"></cxl-icon> Chip with Icon</cxl-chip>
<cxl-chip><cxl-avatar little></cxl-avatar> Chip with Avatar</cxl-chip>
<cxl-chip little removable>Removable Chip</cxl-chip>
--></docs-demo>
</docs-component>
			`
			},
			datepicker: {
				template: `
<docs-component name="cxl-datepicker">
	<docs-demo><!--
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-datepicker &="@value:=dateValue"></cxl-datepicker>
</cxl-form-group>
	<div>Value: <x &="=dateValue:text"></x></div>
	--></docs-demo>
<docs-attribute name="disabled" demo></docs-attribute>
</docs-component>
			`
			},
			dialog: {
				template: `
<docs-component name="cxl-dialog">
	<docs-demo><!--
<cxl-c pad16 style="position:relative; min-height:300px; z-index: 0; overflow:hidden">
	<cxl-dialog>
		<cxl-c pad16>
		<cxl-t h5>Title</cxl-t>
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.</p>
		</cxl-c>
	</cxl-dialog>
</cxl-c>
	--></docs-demo>
</docs-component>
			`
			},
			'dialog-alert': {
				template: `
<docs-component name="cxl-dialog-alert">
	<docs-demo><!--
<cxl-c pad16 style="position:relative; height:300px; z-index: 0; overflow: hidden">
	<cxl-dialog-alert title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
	</cxl-dialog-alert>
</cxl-c>
	--></docs-demo>
<docs-attribute name="title-text"></docs-attribute>
<docs-attribute name="message"></docs-attribute>
<docs-attribute name="promise"></docs-attribute>
</docs-component>
			`
			},

			'dialog-confirm': {
				template: `
<docs-component name="cxl-dialog-confirm">
	<docs-demo><!--
<cxl-c pad16 style="position:relative; height:300px; z-index: 0; overflow: hidden">
	<cxl-dialog-confirm title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
	</cxl-dialog-confirm>
</cxl-c>
	--></docs-demo>
<docs-attribute name="cancel-text"></docs-attribute>
<docs-attribute name="title-text"></docs-attribute>
<docs-attribute name="message"></docs-attribute>
<docs-attribute name="promise"></docs-attribute>
</docs-component>
			`
			},

			drag: {
				template: `
<docs-component name="cxl-drag">
<docs-demo><!--
<style>
	.drag-slot {
		display:block;border:1px solid #ccc;text-align:center; font-size: 32px;
		background-image: linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	}
	.drag-slot[over] { box-shadow: 0 0 2px var(--cxl-primary); }
	.draggable {font-size:30px;cursor:move;display:block;width:100%;line-height:128px; background:#fff;}
	.draggable[dragging] { z-index: 5; box-shadow: 5px 5px 15px var(--cxl-elevation); }
</style>
<cxl-grid columns="repeat(5, 1fr)">
	<cxl-drag-slot swap class="drag-slot"><cxl-drag class="draggable""><cxl-icon icon="arrow-down"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot"><cxl-drag class="draggable""><cxl-icon icon="arrow-left"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot"><cxl-drag class="draggable""><cxl-icon icon="arrow-right"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot"><cxl-drag class="draggable""><cxl-icon icon="arrow-up"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot"></cxl-drag-slot>
</cxl-grid>
--></docs-demo>
</docs-component>
			`
			},

			'drag-region': {
				template: `
<docs-component name="cxl-drag-region">
<docs-demo label="Drop Region"><!--
<style>
	.drag-region {display:block;border:1px solid #ccc;text-align:center;padding: 64px; font-size: 32px }
	.drag-region[over] { box-shadow: 0 0 2px var(--cxl-primary); background: var(--cxl-primaryLight); }
	.drag-region-item {
		display:inline-block;cursor:move;font-size:24px; border: 1px solid #ccc; padding: 4px;
	}
</style>
<cxl-drag-region class="drag-region" &="@in-count:=count">
Drag Here <x &="=count:text"></x>
</cxl-drag-region>
<br>
<cxl-drag class="drag-region-item">
	<cxl-icon icon="grip-horizontal"></cxl-icon>
	Drag
</cxl-drag>
<cxl-drag class="drag-region-item">
	<cxl-icon icon="grip-horizontal"></cxl-icon>
	Drag
</cxl-drag>
<cxl-drag class="drag-region-item">
	<cxl-icon icon="grip-horizontal"></cxl-icon>
	Drag
</cxl-drag>
--></docs-demo>
</docs-component>
			`
			},

			'drag-slot': {
				template: `
<docs-component name="cxl-drag-slot">
<docs-demo><!--
<style>
	.drag-slot-demo1 {
		display:block;border:1px solid #ccc;text-align:center; font-size: 32px;
		background-image: linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	}
	.drag-slot-demo1[over] { box-shadow: 0 0 2px var(--cxl-primary); }
	.drag-slot-draggable {font-size:30px;cursor:move;display:block;width:100%;line-height:128px; background:#fff;}
	.drag-slot-draggable[dragging] { z-index: 5; box-shadow: 5px 5px 15px var(--cxl-elevation); }
</style>
<cxl-grid columns="repeat(5, 1fr)">
	<cxl-drag-slot swap class="drag-slot-demo1"><cxl-drag class="drag-slot-draggable""><cxl-icon icon="arrow-down"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot-demo1"><cxl-drag class="drag-slot-draggable""><cxl-icon icon="arrow-left"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot-demo1"><cxl-drag class="drag-slot-draggable""><cxl-icon icon="arrow-right"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot-demo1"><cxl-drag class="drag-slot-draggable""><cxl-icon icon="arrow-up"></cxl-icon></cxl-drag></cxl-drag-slot>
	<cxl-drag-slot swap class="drag-slot-demo1"></cxl-drag-slot>
</cxl-grid>
--></docs-demo>
</docs-component>`
			},

			drawer: {
				template: `
<docs-component name="cxl-drawer">
	<docs-demo><!--
<cxl-button &="action:bool:=showDrawer" primary>Show Drawer</cxl-button>
&nbsp;&nbsp;
<cxl-checkbox &="value:=permanent">Permanent</cxl-checkbox>
<cxl-drawer right &="on(backdrop.click):not:=showDrawer =permanent:@permanent =showDrawer:@visible">
	<docs-placeholder></docs-placeholder>
	<cxl-c pad16>
		<cxl-t h6>Right Drawer Title</cxl-t>
		<p>Right Drawer Content</p>
	</cxl-c>
</cxl-drawer>
	--></docs-demo>
<docs-attribute name="permanent"></docs-attribute>
<docs-attribute name="right"></docs-attribute>
<docs-attribute name="visible"></docs-attribute>
</docs-component>
			`
			},

			fab: {
				template: `
<docs-component name="cxl-fab">
<docs-demo><!--
<cxl-fab static title="Floating Action Button"><cxl-icon icon="plus"></cxl-icon></cxl-fab>
--></docs-demo>
<docs-attribute name="disabled"></docs-attribute>
<docs-attribute name="touched"></docs-attribute>
</docs-component>
			`
			},
			form: {
				template: `
<docs-component name="cxl-form">
	<docs-demo &="owner:@owner" label="Input Validation"><!--
<cxl-form>
	<cxl-form-group>
		<cxl-label>E-mail Address</cxl-label>
		<cxl-input &="valid(email)"></cxl-input>
	</cxl-form-group>
	<cxl-form-group>
		<cxl-label>Password</cxl-label>
		<cxl-password &="valid(required)"></cxl-password>
	</cxl-form-group>
	<cxl-form-group>
		<cxl-label>Required Date</cxl-label>
		<cxl-datepicker &="valid(required)"></cxl-datepicker>
	</cxl-form-group>
	<cxl-form-group floating>
		<cxl-label>Required Select Box</cxl-label>
		<cxl-select &="valid(required)">
			<cxl-option value="1">Value 1</cxl-option>
			<cxl-option value="2">Value 2</cxl-option>
		</cxl-select>
	</cxl-form-group>
	<cxl-checkbox name="checkbox" &="valid(required)">Required checkbox</cxl-checkbox>
	<cxl-fieldset>
		<cxl-radio invalid name="form-radio">Radio Option 1</cxl-radio>
		<cxl-radio invalid name="form-radio">Radio Option 2</cxl-radio>
		<cxl-radio invalid name="form-radio">Radio Option 3</cxl-radio>
	</cxl-fieldset>
	<cxl-switch &="valid(required)">Turn On</cxl-switch>
	<cxl-slider &="valid(notZero)"></cxl-slider>
	<cxl-form-group>
		<cxl-label>Enter Comment</cxl-label>
		<cxl-textarea &="valid(required)"></cxl-textarea>
	</cxl-form-group>
	<cxl-form-group>
		<cxl-label>Multiselect</cxl-label>
		<cxl-multiselect &="valid(required)">
			<cxl-option>Option 1</cxl-option>
			<cxl-option>Option 2</cxl-option>
			<cxl-option>Option 3</cxl-option>
		</cxl-multiselect>
	</cxl-form-group>
	<br>
	<cxl-submit>Submit</cxl-submit>
</cxl-form>
	--></docs-demo>
</docs-component>
			`
			},
			field: {
				template: `
<docs-component name="cxl-form-group">
	<docs-demo><!--
<cxl-field>
	<cxl-label>Input Label</cxl-label>
	<cxl-input required />
</cxl-field>
<cxl-field floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input />
</cxl-field>
<cxl-field outline>
	<cxl-label>Outlined Form Group</cxl-label>
	<cxl-input />
</cxl-field>
<cxl-field outline floating>
	<cxl-label>Outlined Floating Form Group</cxl-label>
	<cxl-input />
</cxl-field>
	--></docs-demo>
	<docs-attribute name="floating">
	<docs-demo><!--
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input />
</cxl-form-group>
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input value="Floating Label Value" />
</cxl-form-group>
	--></docs-demo>
	</docs-attribute>
</docs-component>
			`
			},
			fieldset: {
				template: `
<docs-component name="cxl-fieldset">
<docs-demo><!--
<cxl-fieldset>
	<cxl-label>Checkbox Fieldset</cxl-label>
	<cxl-checkbox checked>Checkbox 1 Selected</cxl-checkbox>
	<cxl-checkbox>Checkbox 2</cxl-checkbox>
</cxl-fieldset>
<cxl-fieldset outline>
	<cxl-label>Fieldset with Outline</cxl-label>
	<cxl-switch checked>Switch 1 Selected</cxl-switch>
	<cxl-switch>Switch 2</cxl-switch>
</cxl-fieldset>
<cxl-fieldset>
	<cxl-label>Invalid Radio Group</cxl-label>
	<cxl-radio invalid touched name="form-radio">Radio Option 1</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 2</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 3</cxl-radio>
</cxl-fieldset>
<cxl-fieldset outline>
	<cxl-checkbox touched &="valid(required)">Required Checkbox</cxl-checkbox>
</cxl-fieldset>
--></docs-demo>
</docs-component>
			`
			},
			'form-group': {
				template: `
<docs-component name="cxl-form-group">
	<docs-demo><!--
<cxl-form-group>
	<cxl-label>Input Label</cxl-label>
	<cxl-input required />
</cxl-form-group>
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input />
</cxl-form-group>
<cxl-form-group outline>
	<cxl-label>Outlined Form Group</cxl-label>
	<cxl-input />
</cxl-form-group>
<cxl-form-group outline floating>
	<cxl-label>Outlined Floating Form Group</cxl-label>
	<cxl-input />
</cxl-form-group>
	--></docs-demo>
	<docs-attribute name="floating">
	<docs-demo><!--
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input />
</cxl-form-group>
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input value="Floating Label Value" />
</cxl-form-group>
	--></docs-demo>
	</docs-attribute>
</docs-component>
			`
			},
			grid: {
				template: `
<docs-component name="cxl-grid">
	<docs-demo label="Grid Layout"><!--
<cxl-grid columns="auto auto auto" style="color:#fff">
	<cxl-c style="background:#a00; padding: 24px">1</cxl-c>
	<cxl-c style="background:#0a0; padding:24px">2</cxl-c>
	<cxl-c style="background:#0a0; padding:24px">3</cxl-c>
	<cxl-c xs2 style="background:#00a; padding:24px">4</cxl-c>
	<cxl-c style="background:#00a; padding:24px">5</cxl-c>
</cxl-grid>
	--></docs-demo>
</docs-component>
			`
			},
			hr: {
				template: `
<docs-component name="cxl-hr">
	<docs-demo><!--
<cxl-hr>
	--></docs-demo>
</docs-component>
			`
			},
			icon: {
				template: `
<docs-component name="cxl-icon">
<docs-demo><!--
<cxl-icon icon="image"></cxl-icon>
<cxl-icon style="font-size: 48px" icon="question"></cxl-icon>
<cxl-icon style="color:green" icon="frog"></cxl-icon>
--></docs-demo>
<docs-attribute name="icon">
<docs-demo><!--
<cxl-icon icon="code"></cxl-icon>
--></docs-demo>
</docs-attribute>
</docs-component>
			`
			},
			input: {
				template: `
<docs-component name="cxl-input">
<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-label>Email Address</cxl-label>
	<cxl-input value="email@address.com"></cxl-input>
</cxl-form-group>
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input></cxl-input>
</cxl-form-group>
<cxl-form-group floating>
	<cxl-label>Floating Label</cxl-label>
	<cxl-input invalid touched></cxl-input>
	<cxl-icon icon="exclamation-circle"></cxl-icon>
</cxl-form-group>
--></docs-demo>

<docs-attribute name="disabled">
<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-label>Disabled</cxl-label>
	<cxl-input disabled></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
</docs-component>
<docs-attribute name="invalid">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Inverse Label</cxl-label>
	<cxl-input invalid></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
<docs-attribute name="maxlength">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Max Length Attribute</cxl-label>
	<cxl-input maxlength="10"></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
<docs-attribute name="name">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Name Input</cxl-label>
	<cxl-input name="test"></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
<docs-attribute name="touched">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Name Input</cxl-label>
	<cxl-input touched invalid></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
<docs-attribute name="value">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Name Input</cxl-label>
	<cxl-input value="Input Value"></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
			`
			},
			item: {
				template: `
<docs-component name="cxl-item">
	<docs-demo><!--
<cxl-item>
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
<cxl-item>
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-item disabled>
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="href">
	<docs-demo><!--
<cxl-item href="#cxl-item">
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="icon">
	<docs-demo><!--
<cxl-item icon="book">
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="selected">
	<docs-demo><!--
<cxl-item selected>
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="touched">
	<docs-demo><!--
<cxl-item touched>
	<cxl-t subtitle>Primary Text</cxl-t>
	<cxl-t subtitle2>Secondary Text</cxl-t>
</cxl-item>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`
			},
			menu: {
				template: `
<docs-component name="cxl-menu">
<docs-demo><!--
<cxl-menu>
	<cxl-item icon="check">Option with icon</cxl-item>
	<cxl-item disabled>Option disabled</cxl-item>
	<cxl-item selected>Option Selected</cxl-item>
	<cxl-item>Option 2</cxl-item>
	<cxl-hr></cxl-hr>
	<cxl-item>Option 3</cxl-item>
</cxl-menu>
--></docs-demo>
<docs-attribute name="closed"><docs-demo &="owner:@owner"><!--
<cxl-menu &="=closed:@closed">
	<cxl-item icon="check">Option 1</cxl-item>
	<cxl-item icon="">Option 2</cxl-item>
	<cxl-item icon="">Option 3</cxl-item>
</cxl-menu>
<br><br>
<cxl-button &="action:toggle(closed) =closed:not:@primary" primary>Open/Close</cxl-button>
--></docs-demo></docs-attribute>
</docs-component>
			`
			},
			'menu-toggle': {
				template: `
<docs-component name="cxl-menu-toggle">
<docs-demo><!--
<cxl-c pad16 inverse>
	<cxl-card>
		<cxl-c pad16 flex>
	<cxl-c grow>
		<cxl-t subtitle>Card Title</cxl-t>
	</cxl-c>
	<cxl-menu-toggle>
		<cxl-item icon="check">Option with icon</cxl-item>
		<cxl-item disabled>Option disabled</cxl-item>
		<cxl-item selected>Option Selected</cxl-item>
		<cxl-item>Option 2</cxl-item>
		<cxl-hr></cxl-hr>
		<cxl-item>Option 3</cxl-item>
	</cxl-menu-toggle>
		</cxl-c>
	</cxl-card>
</cxl-c>
--></docs-demo>
</docs-component>
			`
			},

			multiselect: {
				template: `
<docs-component name="cxl-multiselect">
<docs-demo><!--
<cxl-form-group floating>
	<cxl-label>Multi Select Box with label</cxl-label>
	<cxl-multiselect &="@value:=multiValue">
		<cxl-option value="1">Option 1</cxl-option>
		<cxl-option value="2">Option 2</cxl-option>
		<cxl-option value="3">Option 3</cxl-option>
	</cxl-multiselect>
</cxl-form-group>
<p>Value: <x &="=multiValue:text"></x></p>
--></docs-demo>
</docs-component>
			`
			},

			navbar: {
				template: `
<docs-component name="cxl-navbar">
	<docs-demo label="Appbar with Navigation"><!--
<div style="position:relative; height: 200px; overflow:hidden">
<cxl-appbar>
	<cxl-navbar modal>
		<cxl-item>Hello</cxl-item>
	</cxl-navbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-tabs>
		<cxl-tab selected>Tab 1</cxl-tab>
		<cxl-tab>Tab 2</cxl-tab>
	</cxl-tabs>
</cxl-appbar>
<cxl-c pad16>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</cxl-c>
</div>
	--></docs-demo>
<docs-attribute name="permanent"></docs-attribute>
</docs-component>
			`
			},

			option: {
				template: `
<docs-component name="cxl-option">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Select</cxl-label>
	<cxl-select placeholder="(Select an Option)">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
--></docs-demo>
</docs-component>
			`
			},
			password: {
				template: `
<docs-component name="cxl-password">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Password</cxl-label>
	<cxl-password></cxl-password>
</cxl-form-group>
--></docs-demo>
</docs-component>
			`
			},
			progress: {
				template: `
<docs-component name="cxl-progress">
	<docs-demo><!--
<cxl-progress></cxl-progress><br>
<cxl-progress value="0"></cxl-progress><br>
<cxl-progress value="0.5"></cxl-progress><br>
<cxl-progress value="1"></cxl-progress>
	--></docs-demo>
</docs-component>
			`
			},
			radio: {
				template: `
<docs-component name="cxl-radio">
<docs-demo><!--
<cxl-radio name="test" value="1">Radio Button 1</cxl-radio>
<cxl-radio name="test" value="2" checked>Radio Button 2</cxl-radio>
<cxl-radio name="test" value="3">Radio Button 3</cxl-radio>
--></docs-demo>
</docs-component>
<docs-attribute name="checked">
	<docs-demo><!--
<cxl-radio &="@checked:=checked" name="test" value="1">Radio Button 1</cxl-radio>
<p>Checked: <x &="=checked:text"></x></p>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-radio name="test" value="1">Radio Button 1</cxl-radio>
<cxl-radio disabled name="test" value="2">Radio Button 2</cxl-radio>
<cxl-radio name="test" value="3">Radio Button 3</cxl-radio>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="name">
	<docs-demo><!--
<cxl-radio name="test3" value="1">Radio Button 1</cxl-radio>
<cxl-radio name="test3" value="2">Radio Button 2</cxl-radio>
<cxl-radio name="test2" value="3">Radio Button 3</cxl-radio>
<cxl-radio name="test2" value="3">Radio Button 3</cxl-radio>
	--></docs-demo>
</docs-attribute>
			`
			},
			ripple: {
				template: `
<docs-component name="cxl-ripple">
<docs-demo><!--
<cxl-button big>Click Me</cxl-button>
<cxl-button big primary>Click Me</cxl-button>
<cxl-button big secondary>Click Me</cxl-button>
<cxl-button big disabled>Click Me</cxl-button>
--></docs-demo>
<docs-demo label="cxl-ripple-container"><!--
<cxl-ripple-container style="border:1px solid #000;padding:16px;font-size:24px;text-align:center;" >Click Me</cxl-ripple-container>
--></docs-demo>
<docs-implementation>
<ul>
	<li>The <docs-mdn href="Element/getBoundingClientRect">getBoundingClientRect()</docs-mdn> function is used to calculate the position of the ripple element.</li>
	<li>The ripple effect is triggered by the following events: <code>mousedown</code> and <code>keypress(Enter, Space)</code> for focusable elements.</li>
	<li>To prevent layout trashing and improve performance the ripple animation uses the <code>scale()</code> transform function. The animation is set to only run once.</li>
	<li>The <docs-mdn href="Events/animationend">animationend</docs-mdn> event is used to automatically remove the ripple element from the DOM.</li>
<li>In order for the click event to propagate properly, the <docs-mdn href="CSS/pointer-events">pointer-events</docs-mdn> property is set to <code>none</code></li>
<li>The ripple element container requires a <code>position: relative</code> for the positioning code to work.</li>
</ul>
</docs-implementation>
</docs-component>
			`
			},
			'search-input': {
				template: `
<docs-component name="cxl-search-input">
<docs-demo><!--
<cxl-search-input></cxl-search-input>
--></docs-demo>
</docs-component>
			`
			},
			select: {
				template: `
<docs-component name="cxl-select">
<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-label>Select Change Event</cxl-label>
	<cxl-select placeholder="(Select an option)" &="on(change):#onChange">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
<p>Value: <span &="=selectChange:text"></span></p>

<cxl-form-group floating>
	<cxl-label>Select with Floating Label</cxl-label>
	<cxl-select &="@value:=select">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>

<p>Value: <span &="=select:text"></span></p>

<cxl-form-group>
	<cxl-label>Select 2</cxl-label>
	<cxl-select value="two" &="@value:=select2">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>

<p>Value: <span &="=select2:text"></span></p>
--></docs-demo>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-form-group>
	<cxl-select disabled>
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="value">
	<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-select value="two">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
<cxl-form-group>
	<cxl-select &="=testValue:@value">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`,
				controller: {
					testValue: 'two',
					onChange(ev, el) {
						this.selectChange = el.value;
					}
				}
			},
			slider: {
				template: `
<docs-component name="cxl-slider">
	<docs-demo><!--
<cxl-slider></cxl-slider>
<cxl-slider value="0.5"></cxl-slider>
	--></docs-demo>
	<docs-attribute name="disabled">
		<docs-demo><!--
<cxl-slider disabled value="0.4"></cxl-slider>
		--></docs-demo>
	</docs-attribute>
	<docs-attribute name="step">
		<docs-demo><!--
<cxl-slider &="@value:=value" step="0.2" value="0.4"></cxl-slider>
<p>Value: <x &="=value:text"></x></p>
		--></docs-demo>
	</docs-attribute>
</docs-component>
			`
			},

			snackbar: {
				template: `
<docs-component name="cxl-snackbar">
	<docs-demo &="owner:@owner"><!--
<cxl-button primary &="action:#notify">Notify</cxl-button>
<p>Index: <x &="=index:text"></x></p>
<script>
	function notify() {
		cxl.ui.notify('Hello World ' + this.index++);
	}
</script>
	--></docs-demo>
</docs-component>
			`,
				controller: {
					index: 0,

					notify() {
						return cxl.ui.notify('Hello World ' + this.index++);
					}
				}
			},

			spinner: {
				template: `
<docs-component name="cxl-spinner">
<docs-demo><!--
<cxl-spinner></cxl-spinner>
--></docs-demo>
</docs-component>
			`
			},

			submit: {
				template: `
<docs-component name="cxl-submit">
	<docs-demo><!--
<cxl-submit>Submit</cxl-submit>
	--></docs-demo>
	<docs-attribute name="disabled">
		<docs-demo><!--
<cxl-submit disabled>Submit Disabled</cxl-submit>
		--></docs-demo>
	</docs-attribute>
</docs-component>
			`
			},

			switch: {
				template: `
<docs-component name="cxl-switch">
<docs-demo><!--
<div>
	<cxl-switch inline &="@value:=switchValue"></cxl-switch>
	<br>
	<p &="=switchValue:text"></p>
</div>
<div>
	<cxl-switch inline checked &="@value:=switchValue2"></cxl-switch>
	<br>
	<p &="=switchValue2:text"></p>
</div>
<div>
	<cxl-switch inline checked &="@value:=switchValue3" true-value="1" false-value="0"></cxl-switch>
	<br>
	<p &="=switchValue3:text"></p>
</div>
--></docs-demo>
<docs-attribute name="checked">
	<docs-demo><!--
<p><cxl-switch checked></cxl-switch></p>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="disabled">
	<docs-demo><!--
<p><cxl-switch disabled></cxl-switch></p>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="false-value">
	<docs-demo><!--
<p><cxl-switch false-value="falsy" &="@value:=value"></cxl-switch></p>
<p>Value: <x &="=value:text"></x></p>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="true-value">
	<docs-demo><!--
<p><cxl-switch true-value="not false" &="@value:=value"></cxl-switch></p>
<p>Value: <x &="=value:text"></x></p>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`
			},
			t: {
				template: `
<docs-component name="cxl-t">
	<uid-typography></uid-typography>
</docs-component>
			`
			},
			tab: {
				template: `
<docs-component name="cxl-tab">
	<docs-demo><!--
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
--></docs-demo>
</docs-component>
			`
			},

			table: {
				template: `
<docs-component name="cxl-table">
	<docs-demo label="Basic Table"><!--
<cxl-table>
	<cxl-th width="100px">Header 1</cxl-th>
	<cxl-th>Header 2</cxl-th>
	<cxl-th>Header 3</cxl-th>
	<cxl-th>Header 4</cxl-th>

	<cxl-td>Cell 1</cxl-td>
	<cxl-td>Cell 2</cxl-td>
	<cxl-td>Cell 3</cxl-td>
	<cxl-td>Cell 4</cxl-td>

	<cxl-td>Cell 5</cxl-td>
	<cxl-td>Cell 6</cxl-td>
	<cxl-td>Cell 7</cxl-td>
	<cxl-td>Cell 8</cxl-td>

	<cxl-td>Cell 9</cxl-td>
	<cxl-td>Cell 10</cxl-td>
	<cxl-td>Cell 11</cxl-td>
	<cxl-td>Cell 12</cxl-td>
</cxl-table>
	--></docs-demo>
</docs-component>
			`
			},
			tabs: {
				template: `
<docs-component name="cxl-tabs">
	<docs-demo &="owner:@owner"><!--
<cxl-tabs &="action:#select">
	<cxl-tab>Details</cxl-tab>
	<cxl-tab selected>Employees</cxl-tab>
	<cxl-tab>Files</cxl-tab>
	<cxl-tab>Checks</cxl-tab>
	<cxl-tab>Extra</cxl-tab>
</cxl-tabs>
<cxl-c pad16>
	<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa. Pellentesque cursus vestibulum aliquam. Nam elementum bibendum urna sed pretium. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
</cxl-c>
	--></docs-demo>
</docs-component>
			`,
				controller: {
					select(ev) {
						if (ev.target.tagName === 'CXL-TAB')
							ev.target.selected = true;
					}
				}
			},
			textarea: {
				template: `
<docs-component name="cxl-textarea">
<docs-demo><!--
<cxl-field-textarea label="Text Area"></cxl-field-textarea>
<cxl-field>
	<cxl-label>Prefilled Text Area</cxl-label>
	<cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."></cxl-textarea>
</cxl-field>
--></docs-demo>
<docs-attribute name="disabled" demo lorem></docs-attribute>
<docs-attribute name="invalid" demo></docs-attribute>
</docs-component>
			`
			}
		},
		COMPONENTS = [];
	cxl.route({
		id: 'home',
		defaultRoute: true,
		path: '*default',
		title: { text: '@cxl/ui' },
		styles: STYLES,
		template: `
<style>a { color: var(--cxl-link) }</style>
<cxl-grid columns="1fr 1fr" style="margin-top: 48px">
	<cxl-c sm2 md1>
		<cxl-t h4>
			Web Components with a focus on accessibility and performance.
		</cxl-t>
		<br>
	</cxl-c>
	<cxl-c sm2 md1>
<!--img alt="Image of @cxl/ui Applications" src="http://coaxialsoftware.com/images/slide-ui.png" style="margin:auto; display:block; max-width: 100%; " /-->
	</cxl-c>

	<cxl-c xs2><cxl-t h4>Features</cxl-t></cxl-c>

	<cxl-c>
		<cxl-t h5><cxl-icon icon="fighter-jet"></cxl-icon> &nbsp;Lightweight and Fast</cxl-t>
		<p>The entire library is less than 50Kb. Intuitive, consistent and easy to use API. Components are fine-tuned for performance to provide a native-like experience.
		</p>
	</cxl-c>
	<cxl-c>
		<cxl-t h5><cxl-icon icon="mobile-alt"></cxl-icon> &nbsp;Responsive</cxl-t>
		<p>All components are responsive for any device size and shape. No special settings needed.</p>
	</cxl-c>
	<cxl-c>
		<cxl-t h5><cxl-icon icon="code-branch"></cxl-icon> &nbsp;Open Source</cxl-t>
		<p>
Library and Source Code released under the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL</a> open source license. The complete source code is hosted on <a href="https://github.com/cxlio/cxl">Github</a>
		</p>
	</cxl-c>
	<cxl-c>
		<cxl-t h5><cxl-icon icon="eye"></cxl-icon> &nbsp;Accessibility Focused</cxl-t>
		<p>Accessibility support for visually impaired users, and users with keyboard navigation only. <!--Section 508 and WCAG 2 compliant.--></p>
	</cxl-c>

	<cxl-c>
		<cxl-t h5><cxl-icon icon="globe"></cxl-icon> &nbsp;Framework Agnostic</cxl-t>
		<p>No dependencies. Works out of the box on all major browsers. Compatible with most
		popular frameworks.
		</p>
	</cxl-c>
	<cxl-c>
		<cxl-t h5><cxl-icon icon="palette"></cxl-icon> &nbsp;Flexible Theming</cxl-t>
		<p>Styles follow the <a href="https://material.io">Material Design</a> guidelines.
Components are easily styled via attributes and CSS variables. See <a href="#theming">Theming</a> for more information.
		</p>
	</cxl-c>
</cxl-grid>
<br>
<cxl-t h4>Browser Support</cxl-t>

<ul>
	<li>Chrome: 49</li>
	<li>Firefox: 61</li>
	<li>Safari: 11.1</li>
	<li>iOS Safari: 10.3</li>
	<li>Edge: 17</li>
</ul>
	`
	});

	cxl.route({
		id: 'getting-started',
		path: 'getting-started',
		title: 'Getting Started',
		styles: STYLES,
		template: `
<style>a { color: var(--cxl-link) }</style>
<cxl-t h4>Installation</cxl-t>

<cxl-t h5>Using NPM</cxl-t>
<docs-code type="bash"><!--npm install @cxl/ui--></docs-code>
<br>
<cxl-t h5>Using Yarn</cxl-t>
<docs-code type="bash"><!--yarn add @cxl/ui--></docs-code>
<br>

<cxl-t h4>Usage</cxl-t>

<cxl-t h5>Include it in your application</cxl-t>
<br>
<cxl-t h6>Using &lt;script&gt; tag</cxl-t>

<docs-code type="html"><!--
<script src="node_modules/@cxl/ui/index.js"></script>
--></docs-code>

<cxl-t h6>Using Typescript</cxl-t>

<docs-code type="javascript"><!--import "@cxl/ui";--></docs-code>
<br>
<cxl-t h5>Optional Modules</cxl-t>
<br>
<cxl-t h6>@cxl/ui/debug.js</cxl-t>
<p>Include this module to enable debug mode.</p>

<cxl-t h6>@cxl/ui/icons.js</cxl-t>
<p>FontAwesome Icon support. Required for some components. Use with <a href="#cxl-icon"><code>&lt;cxl-icon></code></a> Component.</p>

<!--
<cxl-t h6>@cxl/ui/react <cxl-t inline caption>dist/react.js</cxl-t></cxl-t>
<p>ReactJS compatibility module. Experimental version.</p>

See <a href="react.html">Demo</a>.</p>
<cxl-t h5>@cxl/ui/angular </cxl-t inline caption>dist/react.js</cxl-t></cxl-t>
<p>Angular compatibility module. See <a href="angular.html">Demo</a>.</p-->
	`
	});

	cxl.each(DEFS, (def, name) => {
		const path = 'cxl-' + name;

		def.path = path;
		def.title = '<' + path + '>';
		def.styles = STYLES;

		COMPONENTS.push(path);

		cxl.route(def);
	});

	component(
		{
			name: 'uid-states',
			template: `
<cxl-grid>
	<template &="=states:each:repeat">
	<cxl-c sm6 md3 &="item:style:text .item"></cxl-c>
	<cxl-c sm6 md3 &="item:style .focused .item">Focus</cxl-c>
	<cxl-c sm6 md3 &="item:style .hover .item">Hover</cxl-c>
	<cxl-c sm6 md3 &="item:style .disabled .item">Disabled</cxl-c>
	</template>
</cxl-grid>
	`,
			styles: {
				item: {
					padding: 16,
					backgroundColor: 'surface',
					color: 'onSurface'
				},
				hover: { state: 'hover' },
				focused: { state: 'focus' },
				disabled: { state: 'disabled' },
				Primary: { color: 'onPrimary', backgroundColor: 'primary' },
				Secondary: {
					color: 'onSecondary',
					backgroundColor: 'secondary'
				}
			}
		},
		{
			states: ['Default', 'Primary', 'Secondary']
		}
	);

	cxl.route({
		path: 'theming',
		title: 'Styles',
		template: `
<cxl-t h4>Color</cxl-t>
<p>The Following colors are used by the theme. Each of them are defined in a variable prefixed by <code>--cxl-</code></p>
<br>
<uid-palette></uid-palette>
<br><br>
<cxl-t h4>States</cxl-t>
<br>
<uid-states></uid-states>
<br><br>
<cxl-t h4>Typography</cxl-t>
<br>
<cxl-t>The following <code>font-family</code> string is applied to all elements:
<docs-code &="=font:@source"></docs-code>
<p>The <uid-link tag="cxl-t"></uid-link> component can be used to apply styles to text. The <code>Roboto</code> font will not be automatically included.</p>
<br>
<uid-typography></uid-typography>
<br><br>
<cxl-t h4>Theme Variables</cxl-t>
<p>The following CSS Variables can be modified to customize the look and feel of the components in your application.</p>
<br>
<uid-theme></uid-theme>
	`,
		styles: {
			$: { animation: 'fadeIn' },
			iconbox: {
				display: 'inline-block',
				width: 80,
				height: 80,
				textAlign: 'center'
			},
			icon: { font: 'h5', marginBottom: 8, lineHeight: 40 }
		},

		initialize(state) {
			state.font = cxl.css.variables.font;
		}
	});

	cxl.route({
		path: 'layout',
		title: 'Layout',
		template: `
<cxl-t h5>Layout Grid</cxl-t>

<docs-bg>
	<cxl-grid>
		<cxl-c xs3 sm2 lg1 &=".col"></cxl-c>
		<cxl-c xs3 sm2 lg1 &=".col"></cxl-c>
		<cxl-c xs3 sm2 lg1 &=".col"></cxl-c>
		<cxl-c xs3 sm2 lg1 &=".col"></cxl-c>

		<cxl-c xs0 sm2 lg1 &=".col"></cxl-c>
		<cxl-c xs0 sm2 lg1 &=".col"></cxl-c>

		<cxl-c xs0 lg1 &=".col"></cxl-c>
		<cxl-c xs0 lg1 &=".col"></cxl-c>
		<cxl-c xs0 lg1 &=".col"></cxl-c>
		<cxl-c xs0 lg1 &=".col"></cxl-c>
		<cxl-c xs0 lg1 &=".col"></cxl-c>
		<cxl-c xs0 lg1 &=".col"></cxl-c>
	</cxl-grid>
</docs-bg>

<cxl-t h6>Columns</cxl-t>
<cxl-t h6>Breakpoints</cxl-t>
<cxl-t h6>Elevation</cxl-t>
<cxl-t h6>UI Regions</cxl-t>
	`,
		styles: {
			col: { backgroundColor: 'rgba(255,0,0,0.25)', height: 100 }
		}
	});

	cxl.component({
		name: 'uid-palette',
		template: `
<cxl-grid columns="1fr 1fr 1fr 1fr 1fr 1fr">
<template &="=vars:each:repeat">
	<cxl-c xs6 sm3 md2>
	<uid-color &="$name:@label $color:@color $onColor:@text-color"></uid-color>
	</cxl-c>
</template>
</cxl-grid>
	`,
		initialize(state) {
			const vars = cxl.css.colors;

			state.vars = [];

			for (const i in vars) {
				state.vars.push({
					name: i,
					color: vars[i].toString(),
					onColor:
						vars['on' + i[0].toUpperCase() + i.slice(1)] ||
						(vars.surface.blend(vars[i]).luminance() > 0.5
							? '#000'
							: '#fff')
				});
			}
		}
	});

	cxl.component({
		name: 'uid-logo',
		template: `<svg xmlns="http://www.w3.org/2000/svg" width="398.66666" height="180.93466"><defs><linearGradient id="a" x2="1" gradientTransform="matrix(405.94919 0 0 -405.94919 -261.92822 217.5498)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#231f20"/><stop offset=".29776" stop-color="#231f20"/><stop offset=".65586592" stop-color="#231f20"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="b" x2="1" gradientTransform="matrix(221.0459 0 0 -221.0459 157.95117 144.88867)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".00561523" stop-color="#fff"/><stop offset=".26231876" stop-color="#231f20"/><stop offset="1" stop-color="#231f20"/></linearGradient></defs><path fill="#e32522" d="M243.78252724 37.10226401L88.46653112 146.24092795h59.53866518L300.96385914 37.10226401z"/><path fill="url(#a)" d="M1 248.271v-20.186h60.16l12.446-7.546h45.08s-21.217 15.386-28.097 19.892c0 0-9.756 6.38-28.673 7.84zm72.606-27.732l47.96-33.71 22.455 15.944-25.335 17.766z" transform="matrix(1.33333 0 0 -1.33333 -1.3333333 331.02799)"/><path fill="url(#b)" d="M157.951 161.146l31.789-22.555h.157c2.74-1.989 21.372-15.468 27.746-19.638 0 0 9.43-6.211 28.67-6.383H300v18.159h-52.937l-12.442 8.119h-.043l-54.355 38.358z" transform="matrix(1.33333 0 0 -1.33333 -1.3333333 331.02799)"/></svg>`
	});

	cxl.component({
		name: 'uid-color',
		attributes: ['label', 'color', 'text-color'],
		bindings:
			'=color:style.inline(background-color) =text-color:style.inline(color)',
		template: `
<cxl-t &="=label:text"></cxl-t>
<cxl-t &="=color:text"></cxl-t>
	`,
		styles: {
			$: { padding: 16 }
		}
	});

	cxl.component(
		{
			name: 'uid-link',
			attributes: ['tag'],
			template:
				'<a style="color:var(--cxl-link)" &="=tag:#setHref"><code>&lt;<x &="=tag:text"></x>&gt;</code></a>'
		},
		{
			setHref(val, el) {
				el.href = '#' + val;
			}
		}
	);

	cxl.component(
		{
			name: 'uid-theme',
			template: `
<cxl-card><cxl-table>
	<cxl-th>Name</cxl-th>
	<cxl-th>Default Value</cxl-th>
	<cxl-th>Description</cxl-th>
	<template &="=variables:item.each:repeat">
		<cxl-td>--cxl-<span &="$key:text"></span></cxl-td>
		<cxl-td &="$value:text"></cxl-td>
		<cxl-td &="$key:#getDescription:text"></cxl-td>
	</template>
</cxl-table></cxl-card>
	`,
			initialize(state) {
				state.variables = cxl.css.appliedVariables;
				state.meta = META['theme-variables'];
			}
		},
		{
			getDescription(key) {
				return this.meta[key] ? this.meta[key].label : '';
			}
		}
	);

	cxl.component({
		name: 'uid-typography',
		template: `
<cxl-card>
<cxl-table>

	<cxl-th>Scale</cxl-th>
	<cxl-th>Weight</cxl-th>
	<cxl-th>Size</cxl-th>
	<cxl-th>Spacing</cxl-th>

	<template &="=styles:each:repeat">
	<cxl-td><cxl-t &="$key:text:attribute" style="margin-bottom: 0"></cxl-t></cxl-td>
	<cxl-td &="$weight:text"></cxl-td>
	<cxl-td &="$size:text"></cxl-td>
	<cxl-td &="$spacing:text"></cxl-td>
	</template>

</cxl-table>
</cxl-card>
	`,

		initialize(state) {
			const meta = cxl.css.typography,
				styles = (state.styles = []),
				def = meta.default;
			cxl.each(meta, (s, key) =>
				styles.push({
					key: key || 'default',
					weight: s.fontWeight || def.fontWeight,
					size: s.fontSize || def.fontSize,
					spacing: s.letterSpacing || def.letterSpacing
				})
			);
		}
	});

	component(
		{
			name: 'uid-component-tags',
			attributes: ['name'],
			bindings: '=name:#initialize',
			template: `
			<template &="=tags:each:repeat">
				<cxl-chip &="item:text"></cxl-chip>
			</template>
			<br><br>
		`
		},
		{
			initialize(name) {
				const meta = META[name];
				if (!meta) return;

				const tags = (this.tags = meta.tags ? meta.tags.slice(0) : []);

				if (meta.added) tags.push(meta.added);
				if (meta.beta) tags.push('beta');
			}
		}
	);

	component({
		name: 'uid-color-tool',
		attributes: ['theme'],
		template: `
<ui-docs-color label="primary" &="=theme.primary:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="primaryLight" &="=theme.primaryLight:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="primaryDark" &="=theme.primaryDark:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="secondary" &="=theme.secondary:@color =theme.onSecondary:@text-color"></ui-docs-color>
<ui-docs-color label="surface" &="=theme.surface:@color =theme.onSurface:@text-color"></ui-docs-color>
<ui-docs-color label="error" &="=theme.error:@color =theme.onError:@text-color"></ui-docs-color>
	`
	});

	cxl.component(
		{
			name: 'uid-component-card',
			extend: 'docs-component-card',
			bindings: '=name:#getMeta'
		},
		{
			getMeta(name) {
				const meta = META[name];
				if (!meta) return;

				this.icon = meta.icon;

				const tags = meta.tags ? meta.tags.slice(0) : [];

				if (meta.added) tags.push(meta.added);
				if (meta.beta) tags.push('beta');
			}
		}
	);

	cxl.route({
		path: 'core',
		title: 'Core Concepts',
		template: `
	`
	});

	cxl.route(
		{
			path: 'forms',
			title: 'Forms',
			template: `
<cxl-t h4>Form Fields</cxl-t>
<cxl-t h5>Anatomy</cxl-t>
<docs-demo><!--
<cxl-field leading>
	<cxl-label>Field Label</cxl-label>
	<cxl-field-icon icon="calendar" title="Leading Icon"></cxl-field-icon>
	<cxl-input value="Input Value"></cxl-input>
	<cxl-field-icon trailing icon="percent" title="Trailing Icon"></cxl-field-icon>
	<cxl-field-help>Helper Text</cxl-field-help>
</cxl-field>
--></docs-demo>
<docs-demo><!--
<cxl-field outline>
	<cxl-label>Field Label</cxl-label>
	<cxl-field-icon icon="calendar" title="Leading Icon"></cxl-field-icon>
	<cxl-input value="Input Value"></cxl-input>
	<cxl-field-icon trailing icon="percent" title="Trailing Icon"></cxl-field-icon>
	<cxl-field-help>Helper Text</cxl-field-help>
</cxl-field>
--></docs-demo>
<cxl-t h5>States</cxl-t>
<docs-demo><!--
<cxl-card><cxl-grid pad16>
	<cxl-c sm6>
		<cxl-field-input label="Enabled"></cxl-field-input>
		<cxl-field-input disabled label="Disabled"></cxl-field-input>
		<cxl-field-input label="Hover" &=".hover"></cxl-field-input>
		<cxl-field-input focused label="Focused"></cxl-field-input>
		<cxl-field-input invalid touched label="Invalid"></cxl-field-input>
	</cxl-c>
	<cxl-c sm6>
		<cxl-field-input outline label="Enabled"></cxl-field-input>
		<cxl-field-input outline disabled label="Disabled"></cxl-field-input>
		<cxl-field-input outline label="Hover" &=".hover"></cxl-field-input>
		<cxl-field-input outline focused label="Focused"></cxl-field-input>
		<cxl-field-input outline invalid touched label="Invalid"></cxl-field-input>
	</cxl-c>
</cxl-grid></cxl-card>
--></docs-demo>
<cxl-t h5>Attributes</cxl-t>
<p>All input components share the following attributes:</p>
<docs-attributes-table &="=inputBaseAttributes:@attributes"></docs-attributes-table>
<cxl-t h5>Events</cxl-t>
<docs-events-table &="=inputBaseEvents:@events"></docs-events-table>
<cxl-t h5>Floating Labels</cxl-t>
<docs-demo><!--
<cxl-field-input floating label="Floating Label Input Box"></cxl-field-input>
<cxl-field-input outline floating label="Floating Label with Outline"></cxl-field-input>
--></docs-demo>
<cxl-t h5>Field Outline</cxl-t>
<docs-demo><!--
<cxl-field-input label="Outline Label" outline>
	<cxl-input-help>Help Text</cxl-input-help>
</cxl-field-input>
<cxl-field-textarea outline label="Text Area Outline"></cxl-field-textarea>
<cxl-field-input invalid touched outline label="Invalid Input Outline">
	<cxl-input-help>Invalid Input Message</cxl-input-help>
</cxl-field-input>
--></docs-demo>
<cxl-t h5>Help Text</cxl-t>
<docs-demo><!--
<cxl-field-input label="Input Label">
	<cxl-field-help><cxl-icon icon="info" round outline></cxl-icon> Help Text with Icon</cxl-field-help>
</cxl-field-input>
--></docs-demo>
<cxl-t h5>Character Counter</cxl-t>
<docs-demo><!--
<cxl-field counter>
	<cxl-label>Input Label</cxl-label>
	<cxl-input maxlength="100"></cxl-input>
	<cxl-field-help>Field Help Text</cxl-field-help>
</cxl-field>
--></docs-demo>
<cxl-t h5>Field Decoration</cxl-t>
<docs-demo><!--
<cxl-field>
	<cxl-label>Leading Icon</cxl-label>
	<cxl-field-icon icon="dollar-sign"></cxl-field-icon>
	<cxl-input></cxl-input>
</cxl-field>
--></docs-demo>
<docs-demo><!--
<cxl-field>
	<cxl-label>Trailing Icon</cxl-label>
	<cxl-input></cxl-input>
	<cxl-field-icon trailing icon="percent"></cxl-field-icon>
</cxl-field>
--></docs-demo>
<docs-demo><!--
<cxl-field>
	<cxl-label>Field Label with Suffix Text</cxl-label>
	<cxl-input style="text-align: right" value="form.input.value"></cxl-input>
	<div>@gmail.com</div>
	<cxl-field-help>Helper Text</cxl-field-help>
</cxl-field>
--></docs-demo>

<cxl-t h4>Components</cxl-t>
<cxl-t h5>Text Fields</cxl-t>
<docs-demo><!--
<cxl-field-input label="Single Line Text Field"></cxl-field-input>
<cxl-field-textarea label="Multiple Line Expandable Text Area"></cxl-field-textarea>
<cxl-field-input label="Text Field with Outline" outline></cxl-field-input>
<cxl-field-textarea label="Expandable Text Area with Outline" outline></cxl-field-textarea>
--></docs-demo>

<cxl-t h5>Selection Controls</cxl-t>

<docs-demo><!--
<cxl-fieldset>
	<cxl-label>Checkboxes</cxl-label>
	<cxl-checkbox checked>Checkbox 1 Selected</cxl-checkbox>
	<cxl-checkbox>Checkbox 2</cxl-checkbox>
	<cxl-checkbox disabled checked>Checkbox 3 Disabled</cxl-checkbox>
</cxl-fieldset>
<cxl-fieldset>
	<cxl-label>Radio Boxes</cxl-label>
	<cxl-radio name="radio-demo" checked>Radio 1 Selected</cxl-radio>
	<cxl-radio name="radio-demo">Radio 2</cxl-radio>
	<cxl-radio disabled name="radio-demo">Radio 3 Disabled</cxl-radio>
</cxl-fieldset>
<cxl-fieldset>
	<cxl-label>Switches</cxl-label>
	<cxl-switch checked>Switch 1 Selected</cxl-switch>
	<cxl-switch>Switch 2</cxl-switch>
	<cxl-switch disabled>Switch 3 Disabled</cxl-switch>
</cxl-fieldset>
--></docs-demo>
<cxl-t h5>Sliders</cxl-t>
<docs-demo><!--
<cxl-fieldset>
	<cxl-slider></cxl-slider>
	<cxl-slider disabled></cxl-slider>
	<cxl-slider invalid></cxl-slider>
</cxl-fieldset>
--></docs-demo>
<cxl-t h5>Dropdown Menus</cxl-t>
<docs-demo><!--
<cxl-field>
	<cxl-label>Single Selection Menu</cxl-label>
	<cxl-select>
		<cxl-option>Select Item One</cxl-option>
		<cxl-option>Select Item Two</cxl-option>
		<cxl-option>Select Item Three</cxl-option>
	</cxl-select>
</cxl-field>
<cxl-field>
	<cxl-label>Multiple Selection Menu</cxl-label>
	<cxl-multiselect>
		<cxl-option>Select Item One</cxl-option>
		<cxl-option>Select Item Two</cxl-option>
		<cxl-option>Select Item Three</cxl-option>
	</cxl-select>
</cxl-field>
<cxl-field>
	<cxl-label>Disabled Selection Menu</cxl-label>
	<cxl-select disabled>
		<cxl-option>Select Item One</cxl-option>
		<cxl-option>Select Item Two</cxl-option>
		<cxl-option>Select Item Three</cxl-option>
	</cxl-select>
</cxl-field>
<cxl-field outline>
	<cxl-label>Outlined Selection Menu</cxl-label>
	<cxl-select>
		<cxl-option>Select Item One</cxl-option>
		<cxl-option>Select Item Two</cxl-option>
		<cxl-option>Select Item Three</cxl-option>
	</cxl-select>
</cxl-field>
--></docs-demo>
<cxl-t h4>Fieldsets</cxl-t>
<docs-demo><!--
<cxl-fieldset>
	<cxl-label>Checkbox Fieldset</cxl-label>
	<cxl-checkbox checked>Checkbox 1 Selected</cxl-checkbox>
	<cxl-checkbox>Checkbox 2</cxl-checkbox>
</cxl-fieldset>
<cxl-fieldset outline>
	<cxl-label>Fieldset with Outline</cxl-label>
	<cxl-switch checked>Switch 1 Selected</cxl-switch>
	<cxl-switch>Switch 2</cxl-switch>
</cxl-fieldset>
<cxl-fieldset>
	<cxl-label>Invalid Radio Group</cxl-label>
	<cxl-radio invalid touched name="form-radio">Radio Option 1</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 2</cxl-radio>
	<cxl-radio invalid touched name="form-radio">Radio Option 3</cxl-radio>
</cxl-fieldset>
<cxl-fieldset outline>
	<cxl-checkbox touched &="valid(required)">Required Checkbox</cxl-checkbox>
</cxl-fieldset>
--></docs-demo>

<cxl-t h5>Submit Button</cxl-t>
<docs-demo><!--
<cxl-form &="on(submit):#onSubmit">
	<cxl-field>
		<cxl-label>Required Date Picker</cxl-label>
		<cxl-datepicker &="valid(required)"></cxl-datepicker>
	</cxl-field>
	<cxl-submit>Validate and Submit</cxl-submit>
</cxl-form>
--></docs-demo>
	`,
			styles: {
				hover: { state: 'hover' }
			}
		},
		{
			inputBaseAttributes: cxl.ui.InputBase.meta.attributes,
			inputBaseEvents: cxl.ui.InputBase.meta.events,
			onSubmit() {
				cxl.notify('Form successfully submitted');
			}
		}
	);

	cxl.route(
		{
			path: 'components',
			title: 'Overview',
			styles: STYLES,
			template: `
<cxl-t h5>Available Components</cxl-t>
<cxl-search-input &="@value:=filter"></cxl-search-input>
<br>
<cxl-grid columns="repeat(12, 1fr)" gap="16px 16px">
<template &="=components:each:repeat">
<cxl-c xl4 sm6 &="item:#setKey =filter:#match:show">
	<uid-component-card &="item:@name"></uid-component-card>
</cxl-c>
</template>
</cxl-grid>
	`
		},
		{
			setKey(name, el) {
				const meta = META[name];

				el.dataset.key =
					name + (meta && meta.tags ? meta.tags.join(' ') : '');
			},
			match(val, el) {
				return !val || el.dataset.key.indexOf(val) !== -1;
			},

			components: COMPONENTS
		}
	);

	component({
		name: 'uid-attributes',
		template: `

	`
	});

	component({
		name: 'uid-mdn',
		template: '<a &=".link content"></a>',
		styles: {
			link: { color: 'link' }
		}
	});

	component(
		{
			name: 'docs-attributes-table',
			attributes: ['attributes'],
			template: `
<cxl-table>
	<cxl-th>Name</cxl-th>
	<cxl-th width="1fr">Description</cxl-th>
	<template &="=attributes:sort:each:repeat">
	<cxl-td><docs-link style="margin-right: 16px" &="item:text:@anchor"></docs-link></cxl-td>
	<cxl-td &="item:#getAttributeSummary:text"></cxl-td>
	</template>
</cxl-table>
	`,
			styles: { $: { marginBottom: 32 } }
		},
		{
			getAttributeSummary(name) {
				const meta = META.attributes[name];
				return (meta && meta.summary) || '';
			}
		}
	);

	component(
		{
			name: 'docs-events-table',
			attributes: ['events'],
			template: `
<cxl-table>
	<cxl-th>Name</cxl-th>
	<cxl-th width="1fr">Description</cxl-th>
	<template &="=events:sort:each:repeat">
	<cxl-td><docs-link style="margin-right: 16px" &="item:text:@anchor"></docs-link></cxl-td>
	<cxl-td &="item:#getEventSummary:text"></cxl-td>
	</template>
</cxl-table>
	`,
			styles: { $: { marginBottom: 32 } }
		},
		{
			getEventSummary(name) {
				const meta = META.events[name];
				return (meta && meta.summary) || '';
			}
		}
	);

	component(
		{
			name: 'docs-component',
			attributes: ['name'],
			template: `
<uid-component-tags &="=name:@name"></uid-component-tags>
<cxl-t h5>Basic Usage</cxl-t>
<div &="content"></div>
<br><br>
<cxl-t h5>API</cxl-t>
<br>
<div &="=role:show">
	<cxl-t h6>Accessibility</cxl-t>
	<ul>
		<li>ARIA Role: <a style="color:var(--cxl-link)" &="=role:text:#getAriaLink:attribute(href)"></a></li>
		<li &="=ariaStates:show">Properties:
	<template &="=ariaStates:each:repeat">
		<a style="color:var(--cxl-link)" &="item:text:#getAriaLink:attribute(href)"></a>
	</template>
		</li>
	</ul>
</div>
<div &="=anchors:show">
	<cxl-t h6>Anchors</cxl-t>
	<ul>
	<template &="=anchors:each:repeat">
	<li &="$parameter:text"></li>
	</template>
	</ul>
</div>
<div &="=attributes:show">
	<br>
	<cxl-t h6>Attributes</cxl-t>
	<docs-attributes-table &="=attributes:@attributes"></docs-attributes-table>
	<br>
</div>
<div &="=events:show">
	<br>
	<cxl-t h6>Events</cxl-t>
	<docs-events-table &="=events:@events"></docs-events-table>
</div>
<div &="=methods:show">
	<br>
	<cxl-t h6>Methods</cxl-t>
	<cxl-table>
		<cxl-th>Name</cxl-th>
		<cxl-th width="1fr">Description</cxl-th>
		<template &="=methods:sort:each:repeat">
		<cxl-td><docs-link style="margin-right: 16px" &="item:text:@anchor"></docs-link></cxl-td>
		<cxl-td &="item:#getMethodSummary:text"></cxl-td>
		</template>
	</cxl-table>
</div>
<br>
<div &="content(docs-attribute)"></div>
<div &="content(docs-event)"></div>
<div &="content(docs-method)"></div>
<div &="content(docs-implementation)"></div>
	`,
			bindings: '=name:#initialize'
		},
		{
			initialize(name, host) {
				const state = this,
					component = cxl.componentFactory.components[name],
					meta = (component && component.meta) || {},
					view = cxl.dom(name).$view;
				state.instance = cxl.dom(name);
				state.attributes = meta.attributes;
				state.events = meta.events;
				state.methods = meta.methods;
				state.deprecated = meta.deprecated;
				state.host = host;

				view.connect();

				state.role = view.host.getAttribute('role');
				this.processBindings(view);
			},

			getMethodSummary(name) {
				const meta = META.methods[name];
				return (meta && meta.summary) || '';
			},

			getAriaLink(val) {
				return 'https://www.w3.org/TR/wai-aria-1.1/#' + val;
			},

			processBindings(view) {
				const anchors = [];

				view.bindings.forEach(b => {
					if (b.anchor) anchors.push(b);
				});

				if (anchors.length) this.anchors = anchors;
				if (view.$ariaStates) this.ariaStates = view.$ariaStates;
			},

			onAttributeClick() {
				cxl.dom.scrollTo(this.name);
			}
		}
	);

	component({
		name: 'docs-footer',
		template: `
<div></div>
<cxl-t subtitle>@cxl/ui v${cxl.version}</cxl-t>
<cxl-hr></cxl-hr>
<br>
<cxl-t subtitle2>&copy; 2018</cxl-t>
	`,
		styles: {
			$: {
				marginTop: 64,
				padding: 16,
				paddingTop: 32,
				paddingBottom: 32,
				backgroundColor: '#f1f3f4'
			},
			$medium: { paddingLeft: 24, paddingRight: 24 }
		}
	});

	component(
		{
			name: 'docs-root',
			template: `
<cxl-router-app>
	<cxl-c pad16>
		<cxl-t h6>@cxl/ui
		<cxl-t inline subtitle2>${cxl.ui.version}</cxl-t>
		</cxl-t>
	</cxl-c>
	<cxl-item icon="home" &="route.link(home)">Home</cxl-item>
	<cxl-item icon="book" &="route.link(getting-started)">Getting Started</cxl-item>
	<cxl-hr></cxl-hr>
	<cxl-c pad16><cxl-t subtitle2>Guides</cxl-t></cxl-c>
	<!--cxl-item icon="puzzle-piece" &="route.link(core)">Core Concepts</cxl-item-->
	<cxl-item icon="window-restore" &="route.link(forms)">Forms</cxl-item>
	<cxl-item icon="palette" &="route.link(theming)">Styles</cxl-item>
	<cxl-c pad16><cxl-t subtitle2>Components</cxl-t></cxl-c>
	<cxl-item icon="" &="route.link(components)">Overview</cxl-item>
	<template &="=components:each:repeat">
	<cxl-item icon="" &="item:route.link">
		&lt;<span &="item:text"></span>&gt;
		<cxl-t &="item:#getLabel:text" primary caption inline></cxl-t>
	</cxl-item>
	</template>
</cxl-router-app>
	`
		},
		{
			components: COMPONENTS,

			getLabel(tag) {
				const meta = META[tag];
				return meta && meta.beta
					? 'beta'
					: cxl.componentFactory.components[tag].meta.deprecated
					? 'deprecated'
					: cxl.Skip;
			}
		}
	);
})(this.cxl);
