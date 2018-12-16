(cxl => { "use strict";

const
	META = cxl.ui.meta,
	DEFS = {
		appbar: {
			template: `
<docs-component name="cxl-appbar">
	<docs-demo label="Appbar with actions"><!--
<cxl-appbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-button flat inverse><cxl-icon icon="heart"></cxl-icon></cxl-button>
	<cxl-button flat inverse><cxl-icon icon="search"></cxl-icon></cxl-button>
	<cxl-button flat inverse><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-button>
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
<cxl-block>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</cxl-block>
</div>
	--></docs-demo>
	<docs-demo label="Appbar with Tabs"><!--
<cxl-appbar>
	<cxl-appbar-title>Appbar Title</cxl-appbar-title>
	<cxl-button flat inverse><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-button>
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

<docs-attribute name="inverse">
	<docs-demo><!--
<cxl-block inverse>
	<cxl-button primary inverse><cxl-animate spin><cxl-icon icon="spinner"></cxl-animate></cxl-icon> Loading</cxl-button>
	<cxl-button secondary inverse>Loading</cxl-button>
	<cxl-button inverse><cxl-animate pulse><cxl-icon icon="spinner"></cxl-animate> </cxl-icon> Loading</cxl-button>
	<cxl-button flat inverse>Flat Inverse</cxl-button>
	<cxl-button disabled inverse>Disabled Inverse</cxl-button>
</cxl-block>
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
				toggle() { this.primary = !this.primary; }
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
	<cxl-grid columns="repeat(12, 1fr)">
		<style>
			cxl-c { background: rgba(255,0,0,0.25); height: 100px; }
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
<cxl-block flex>
	<cxl-avatar style="background:#ccc"></cxl-avatar>
	<cxl-col style="margin-left: 24px">
		<cxl-h6>Card Title</cxl-h6>
		Secondary Text
	</cxl-col>
</cxl-block>
<docs-placeholder style="height:180px"></docs-placeholder>
<cxl-block>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
</cxl-block>
<cxl-block compact>
	<cxl-button flat>Action 1</cxl-button>
	<cxl-button flat>Action 2</cxl-button>
</cxl-block>
</cxl-card>
--></docs-demo>
</docs-component>
			`
		},
		checkbox: {
			template: `
<docs-component name="cxl-checkbox">
<docs-demo><!--
<cxl-checkbox>Checkbox Label</cxl-checkbox><br>
<cxl-checkbox checked>Checkbox Label</cxl-checkbox>
--></docs-demo>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-checkbox disabled>Disabled Checkbox Label</cxl-checkbox><br>
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
--></docs-demo>
</docs-component>
			`

		},
		dialog: {
			template: `
<docs-component name="cxl-dialog">
	<docs-demo><!--
<cxl-block style="position:relative; min-height:300px; z-index: 0; overflow:hidden">
	<cxl-dialog>
		<cxl-block>
		<cxl-t h5>Title</cxl-t>
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.</p>
		</cxl-block>
	</cxl-dialog>
</cxl-block>
	--></docs-demo>
</docs-component>
			`
		},
		'dialog-alert': {
			template: `
<docs-component name="cxl-dialog-alert">
	<docs-demo><!--
<cxl-block style="position:relative; height:300px; z-index: 0; overflow: hidden">
	<cxl-dialog-alert title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
	</cxl-dialog-alert>
</cxl-block>
	--></docs-demo>
</docs-component>
			`
		},

		'dialog-confirm': {
			template: `
<docs-component name="cxl-dialog-confirm">
	<docs-demo><!--
<cxl-block style="position:relative; height:300px; z-index: 0; overflow: hidden">
	<cxl-dialog-confirm title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
	</cxl-dialog-alert>
</cxl-block>
	--></docs-demo>
</docs-component>
			`
		},

		drawer: {
			template: `
<docs-component name="cxl-drawer">
	<docs-demo><!--
<cxl-button &="action:bool:=showDrawer" primary>Show Drawer</cxl-button>
<cxl-checkbox &="value:=permanent">Permanent</cxl-checkbox>
<cxl-drawer right &="on(backdrop.click):not:=showDrawer =permanent:@permanent =showDrawer:@visible">
	<docs-placeholder></docs-placeholder>
	<cxl-block>
		<cxl-title>Right Drawer Title</cxl-title>
		<cxl-hr></cxl-hr>
		<p>Right Drawer Content</p>
	</cxl-block>
</cxl-drawer>
	--></docs-demo>
</docs-component>
			`
		},

		fab: {
			template: `
<docs-component name="cxl-fab">
<docs-demo><!--
<cxl-fab static title="Floating Action Button"><cxl-icon icon="plus"></cxl-icon></cxl-fab>
--></docs-demo>
</docs-component>
			`
		},
		form: {
			template: `
<docs-component name="cxl-form">
	<docs-demo &="owner:@owner" label="Input Validation"><!--
<cxl-form>
	<cxl-block>
		<cxl-form-group>
			<cxl-label>E-mail Address</cxl-label>
			<cxl-input &="valid(email)"></cxl-input>
		</cxl-form-group>
		<cxl-form-group>
			<cxl-label for="password">Password</cxl-label>
			<cxl-password &="valid(required)"></cxl-password>
		</cxl-form-group>
		<p &="=submitted:show">Form Submitted!</p>
	</cxl-block>
	<cxl-block>
		<cxl-button>Cancel</cxl-button>
		<cxl-submit>Submit</cxl-submit>
	</cxl-block>
</cxl-form>
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
<docs-attribute name="inverse">
<docs-demo><!--
<cxl-block inverse>
<cxl-form-group>
	<cxl-label>Inverse Label</cxl-label>
	<cxl-input inverse></cxl-input>
</cxl-form-group>
</cxl-block>
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
<cxl-block inverse>
	<cxl-card>
		<cxl-block flex>
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
		</cxl-block>
	</cxl-card>
</cxl-block>
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
<cxl-block>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</cxl-block>
</div>
	--></docs-demo>
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
<cxl-radio name="test" value="1">Radio Button 1</cxl-radio><br>
<cxl-radio name="test" value="2" checked>Radio Button 2</cxl-radio><br>
<cxl-radio name="test" value="3">Radio Button 3</cxl-radio><br>
--></docs-demo>
</docs-component>
<docs-attribute name="checked">
	<docs-demo><!--
<cxl-radio &="@checked:=checked" name="test" value="1">Radio Button 1</cxl-radio><br>
<p>Checked: <x &="=checked:text"></x></p>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-radio name="test" value="1">Radio Button 1</cxl-radio><br>
<cxl-radio disabled name="test" value="2">Radio Button 2</cxl-radio><br>
<cxl-radio name="test" value="3">Radio Button 3</cxl-radio><br>
	--></docs-demo>
</docs-attribute>
<docs-attribute name="name">
	<docs-demo><!--
<cxl-radio name="test3" value="1">Radio Button 1</cxl-radio><br>
<cxl-radio name="test3" value="2">Radio Button 2</cxl-radio><br>
<cxl-radio name="test2" value="3">Radio Button 3</cxl-radio><br>
<cxl-radio name="test2" value="3">Radio Button 3</cxl-radio><br>
	--></docs-demo>
</docs-attribute>
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

				notify()
				{
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
	<cxl-switch &="@value:=switchValue"></cxl-switch>
	<br>
	<p &="=switchValue:text"></p>
</div>
<div>
	<cxl-switch checked &="@value:=switchValue2"></cxl-switch>
	<br>
	<p &="=switchValue2:text"></p>
</div>
<div>
	<cxl-switch checked &="@value:=switchValue3" true-value="1" false-value="0"></cxl-switch>
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
<cxl-tabs &="on(action):#select">
	<cxl-tab>Details</cxl-tab>
	<cxl-tab selected>Employees</cxl-tab>
	<cxl-tab>Files</cxl-tab>
	<cxl-tab>Checks</cxl-tab>
	<cxl-tab>Extra</cxl-tab>
</cxl-tabs>
<cxl-block>
	<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa. Pellentesque cursus vestibulum aliquam. Nam elementum bibendum urna sed pretium. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
</cxl-block>
	--></docs-demo>
</docs-component>
			`,
			controller: {
				select(ev) { if (ev.target.tagName==='CXL-TAB') ev.target.selected = true; }
			}
		},
		textarea: {
			template: `
<docs-component name="cxl-textarea">
<docs-demo><!--
<cxl-form-group>
	<cxl-label>Text Area</cxl-label>
	<cxl-textarea></cxl-textarea>
</cxl-form-group>
<cxl-form-group>
	<cxl-label>Prefilled Text Area</cxl-label>
	<cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."></cxl-textarea>
</cxl-form-group>
--></docs-demo>
<docs-attribute name="disabled">
	<docs-demo><!--
<cxl-form-group>
	<cxl-label>Disabled Text Area</cxl-label>
	<cxl-textarea disabled value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."></cxl-textarea>
</cxl-form-group>
	--></docs-demo>
</docs-attribute>
</docs-component>
			`
		}
	},
	COMPONENTS = []
;

cxl.route({
	id: 'home',
	defaultRoute: true,
	path: '*default',
	title: 'Home',
	template: `
<style>a { color: var(--cxl-link) }</style>
<cxl-grid columns="1fr 1fr" style="margin-top: 48px">
	<cxl-c sm2 md1>
		<cxl-t h2>@cxl/ui</cxl-t>
		<cxl-t subtitle>
			@cxl/ui is an open source collection of lightweight, production ready Web Components.
		</cxl-t>
		<br>
		<p>
		<a href="#getting-started"><cxl-button secondary big>Get Started!</cxl-button></a>
		</p>
		<br>
	</cxl-c>
	<cxl-c sm2 md1>
<!--img alt="Image of @cxl/ui Applications" src="http://coaxialsoftware.com/images/slide-ui.png" style="margin:auto; display:block; max-width: 100%; "></img-->
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
Library and Source Code released under the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL</a> open source license. The complete library source code is hosted on <a href="https://github.com/cxlio/cxl">Github</a>
		</p>
	</cxl-c>
	<cxl-c>
		<cxl-t h5><cxl-icon icon="eye"></cxl-icon> &nbsp;Accessibility Focused</cxl-t>
		<p>Accessibility support for visually impaired users, and users with keyboard navigation only. <!--Section 508 and WCAG 2 compliant.--></p>
	</cxl-c>

	<cxl-c>
		<cxl-t h5><cxl-icon icon="globe"></cxl-icon> &nbsp;Framework Agnostic</cxl-t>
		<p>No dependencies, No polyfills. Works out of the box on all major browsers. Optional <a href="#getting-started">plugins</a> for popular frameworks are included.
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
	id: "getting-started",
	path: 'getting-started',
	title: 'Getting Started',
	template: `
<style>a { color: var(--cxl-link) }</style>
<cxl-t h4>Installation</cxl-t>

<cxl-t h5>Using NPM</cxl-t>

<docs-code type="bash"><!--npm install @cxl/ui--></docs-code>
<br>

<cxl-t h4>Usage</cxl-t>

<cxl-t h5>Include it in your application</cxl-t>
<br>
<cxl-t h6>Using &lt;script&gt; tag</cxl-t>

<docs-code type="html"><!--
<script src="node_modules/@cxl/ui/dist/index.js"></script>
--></docs-code>

<cxl-t h6>Using Typescript</cxl-t>

<docs-code type="javascript"><!--import "@cxl/ui";--></docs-code>
<br>
<cxl-t h5>Optional Modules</cxl-t>
<br>
<cxl-t h6>@cxl/ui/dist/debug.js</cxl-t>
<p>Include this module to enable debug mode.</p>

<cxl-t h6>@cxl/ui/dist/icons.js</cxl-t>
<p>FontAwesome Icon support. Use with <a href="#cxl-icon"><code>&lt;cxl-icon></code></a> Component.</p>

<!--cxl-t h6>@cxl/ui/react <cxl-t inline caption>dist/react.js</cxl-t></cxl-t>
<p>ReactJS compatibility module. See <a href="react.html">Demo</a>.</p>

<cxl-t h5>@cxl/ui/angular </cxl-t inline caption>dist/react.js</cxl-t></cxl-t>
<p>Angular compatibility module. See <a href="angular.html">Demo</a>.</p-->
	`
});

cxl.each(DEFS, (def, name) => {
	const path = 'cxl-' + name;

	def.path = path;
	def.title = '<' + path + '>';

	COMPONENTS.push(path);

	cxl.route(def);
});

cxl.route({
	path: 'theming',
	title: 'Styles',
	template: `
<cxl-t h4>Color</cxl-t>
<uid-palette></uid-palette>
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
<p>The following CSS Variables can be modified to costumize the look and feel of the components in your application.</p>
<br>
<uid-theme></uid-theme>
	`,
	styles: {
		iconbox: { display: 'inline-block', width: 80, height: 80, textAlign: 'center' },
		icon: { fontSize: 24, marginBottom: 8, lineHeight: 40 }
	},

	initialize(state)
	{
		state.font = cxl.css.variables.font;
	}

});

cxl.route({
	path: 'layout',
	title: 'Layout',
	template: `
<cxl-t h5>Layout Grid</cxl-t>

<docs-bg>
	<cxl-layout>
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
	</cxl-layout>
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
	initialize(state)
	{
		const vars = cxl.css.colors;

		state.vars = [];

		for (const i in vars)
		{
			state.vars.push({
				name: i,
				color: vars[i].toString(),
				onColor: vars['on' + i[0].toUpperCase() + i.slice(1)] ||
					(vars.surface.blend(vars[i]).luminance() > 0.5 ? '#000' : '#fff')
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
	attributes: [ 'label', 'color', 'text-color'],
	bindings: '=color:style.inline(background-color) =text-color:style.inline(color)',
	template: `
<cxl-t &="=label:text"></cxl-t>
<cxl-t &="=color:text"></cxl-t>
	`,
	styles: {
		$: { padding: 16 }
	}
});

cxl.component({
	name: 'uid-link',
	attributes: ['tag'],
	template: '<a style="color:var(--cxl-link)" &="=tag:#setHref"><code>&lt;<x &="=tag:text"></x>&gt;</code></a>'
}, {
	setHref(val, el) { el.href='#'+val; }
});

cxl.component({
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
	initialize(state)
	{
		state.variables = cxl.css.appliedVariables;
		state.meta = META['theme-variables'];
	}
}, {
	getDescription(key)
	{
		return this.meta[key] ? this.meta[key].label : '';
	}
});

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

	initialize(state)
	{
	const
		meta = cxl.css.typography,
		styles = state.styles = [],
		def = meta.default
	;
		cxl.each(meta, (s, key) => styles.push({
			key: key || 'default',
			weight: s.css.fontWeight || def.css.fontWeight,
			size: s.css.fontSize || def.css.fontSize,
			spacing: s.css.letterSpacing || def.css.letterSpacing
		}));
	}
});

cxl.component({
	name: 'ui-docs-color-tool',
	attributes: [ 'theme' ],
	template: `
<ui-docs-color label="primary" &="=theme.primary:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="primaryLight" &="=theme.primaryLight:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="primaryDark" &="=theme.primaryDark:@color =theme.onPrimary:@text-color"></ui-docs-color>
<ui-docs-color label="secondary" &="=theme.secondary:@color =theme.onSecondary:@text-color"></ui-docs-color>
<ui-docs-color label="surface" &="=theme.surface:@color =theme.onSurface:@text-color"></ui-docs-color>
<ui-docs-color label="error" &="=theme.error:@color =theme.onError:@text-color"></ui-docs-color>
	`
});

cxl.component({
	name: 'uid-component-card',
	attributes: [ 'name' ],
	template: `
<docs-component-card &="=name:@name =meta.icon:@icon =meta.tags:@tags"></docs-component-card>
	`,
	bindings: '=name:#getMeta'
}, {
	getMeta(name)
	{
		this.meta = META[name];
	}
});

cxl.route({
	path: 'components',
	title: 'Overview',
	template: `
<cxl-t h5>Available Components</cxl-t>
<cxl-search-input &="@value:=filter"></cxl-search-input>
<br>
<cxl-grid columns="repeat(12, 1fr)" gap="16px 16px">
<template &="=components:each:repeat">
<cxl-c xl3 md4 sm6 &="item:#setKey =filter:#match:show">
	<uid-component-card &="item:@name"></uid-component-card>
</cxl-c>
</template>
</cxl-grid>
	`
},{
	setKey(name, el)
	{
		const meta = META[name];

		el.dataset.key = name + (meta && meta.tags ? meta.tags.join(' ') : '');
	},
	match(val, el)
	{
		return !val || el.dataset.key.indexOf(val)!==-1;
	},

	components: COMPONENTS
});

cxl.component({
	name: 'uid-attributes',
	template: `
	`
});

cxl.component({
	name: 'docs-component',
	attributes: [ 'name' ],
	template: `
<style>a { color: var(--cxl-primary) }</style>
<cxl-t h5>Basic Usage</cxl-t>
<div &="content"></div>
<br><br>
<cxl-t h5>API</cxl-t>
<br>
<div &="=role:show">
	<cxl-t h6>Accessibility</cxl-t>
	<ul>
		<li>ARIA Role: <a &="=role:text:#getAriaLink:attribute(href)"></a></li>
		<li &="=ariaStates:show">Properties:
	<template &="=ariaStates:each:repeat">
		<a &="item:text:#getAriaLink:attribute(href)"></a>
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
	<cxl-table>
		<cxl-th>Name</cxl-th>
		<cxl-th width="1fr">Description</cxl-th>
		<template &="=attributes:sort:each:repeat">
		<cxl-td><docs-link &="item:text:@anchor"></docs-link></cxl-td>
		<cxl-td &="item:#getAttributeSummary:text"></cxl-td>
		</template>
	</cxl-table>
	<br>
</div>
<div &="=events:show">
	<br>
	<cxl-t h6>Events</cxl-t>
	<cxl-table>
		<cxl-th>Name</cxl-th>
		<cxl-th width="1fr">Description</cxl-th>
		<template &="=events:sort:each:repeat">
		<cxl-td><docs-link &="item:text:@anchor"></docs-link></cxl-td>
		<cxl-td &="item:#getEventSummary:text"></cxl-td>
		</template>
	</cxl-table>
</div>
<div &="=methods:show">
	<br>
	<cxl-t h6>Methods</cxl-t>
	<cxl-table>
		<cxl-th>Name</cxl-th>
		<cxl-th width="1fr">Description</cxl-th>
		<template &="=methods:sort:each:repeat">
		<cxl-td><docs-link &="item:text:@anchor"></docs-link></cxl-td>
		<cxl-td &="item:#getMethodSummary:text"></cxl-td>
		</template>
	</cxl-table>
</div>
<br>
	<div &="content(docs-attribute)"></div>
	<div &="content(docs-event)"></div>
	<div &="content(docs-method)"></div>
	`,
	bindings: '=name:#initialize'
}, {
	initialize(name)
	{
	const
		state = this,
		component = cxl.componentFactory.components[name],
		meta = component && component.meta || {},
		view = cxl.dom(name).$view
	;
		state.instance = cxl.dom(name);
		state.attributes = meta.attributes;
		state.events = meta.events;
		state.methods = meta.methods;

		view.connect();

		state.role = view.host.getAttribute('role');
		this.processBindings(view);
	},

	getAttributeSummary(name)
	{
		const meta = META.attributes[name];
		return meta && meta.summary || '';
	},

	getEventSummary(name)
	{
		const meta = META.events[name];
		return meta && meta.summary || '';
	},

	getMethodSummary(name)
	{
		const meta = META.methods[name];
		return meta && meta.summary || '';
	},

	getAriaLink(val)
	{
		return 'https://www.w3.org/TR/wai-aria-1.1/#' + val;
	},

	processBindings(view)
	{
		const anchors = [];

		view.bindings.forEach(b => {
			if (b.anchor)
				anchors.push(b);
		});

		if (anchors.length) this.anchors = anchors;
		if (view.$ariaStates) this.ariaStates = view.$ariaStates;
	},

	onAttributeClick()
	{
		cxl.dom.scrollTo(this.name);
	}
});

cxl.component({
	name: 'docs-footer',
	template: `
<div></div>
<cxl-t subtitle>@cxl/ui v${cxl.version}</cxl-t>
<cxl-hr></cxl-hr>
<br>
<cxl-t subtitle2>&copy; 2018</cxl-t>
	`,
	styles: {
		$: { marginTop: 64, padding: 16, paddingTop: 32, paddingBottom: 32, backgroundColor: '#f1f3f4' },
		$medium: { paddingLeft: 24, paddingRight: 24 }
	}
});

cxl.component({
	name: 'docs-root',
	template: `
<cxl-router-app>
	<cxl-block>
		<cxl-t h6>@cxl/ui
		<cxl-t inline subtitle2>${cxl.version}</cxl-t>
		</cxl-t>
	</cxl-block>
	<cxl-item icon="home" &="route.link(home)">Home</cxl-item>
	<cxl-item icon="book" &="route.link(getting-started)">Getting Started</cxl-item>
	<cxl-item icon="palette" &="route.link(theming)">Styles</cxl-item>
	<!--cxl-item icon="drafting-compass" &="route.link(layout)">Layout</cxl-item-->
	<cxl-hr></cxl-hr>
	<cxl-block><cxl-t subtitle2>Components</cxl-t></cxl-block>
	<cxl-item icon="" &="route.link(components)">Overview</cxl-item>
	<template &="=components:each:repeat">
	<cxl-item icon="" &="item:route.link">
		&lt;<span &="item:text"></span>&gt;
		<cxl-t &="item:#isBeta:show" caption inline>beta</cxl-t>
	</cxl-item>
	</template>
</cxl-router-app>
	`
}, {
	components: COMPONENTS,
	isBeta(tag)
	{
		return !!(META[tag] && META[tag].beta);
	}
});

})(this.cxl);