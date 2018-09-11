(cxl => {
"use strict";

const
	DEFS = {
		avatar: {
			template: `
<docs-component name="cxl-avatar">

<docs-demo><!--
<cxl-avatar></cxl-avatar>
<cxl-avatar big></cxl-avatar>
<cxl-avatar little></cxl-avatar>
--></docs-demo>
<docs-usage>
	<docs-demo title="Avatar with text"><!--
<cxl-avatar text="HG"></cxl-avatar>
	--></docs-demo>
	<docs-demo title="Changing Background"><!--
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
		button: {
			template: `
<docs-component name="cxl-button">
<docs-demo &="owner:@owner"><!--
<cxl-button &="on(click):=event:#toggle =primary:@primary">Default</cxl-button>
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
</docs-component>
			`

		},
		chip: {
			template: `
<docs-component name="cxl-chip">
<docs-demo><!--
<cxl-chip>Single Chip</cxl-chip>
<cxl-chip removable>Removable Chip</cxl-chip>
<cxl-chip><cxl-avatar little></cxl-avatar> Chip with Avatar</cxl-chip>
--></docs-demo>
</docs-component>
			`

		},
		fab: {
			template: `
<docs-component name="cxl-fab">
<docs-demo><!--
<cxl-fab title="Floating Action Button"><cxl-icon icon="plus"></cxl-icon></cxl-fab>
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
<cxl-form-group &="on(change):=event on(input):=event">
	<cxl-label>Email Address</cxl-label>
	<cxl-input required type="email" &="=email:|value value:=email"></cxl-input>
</cxl-form-group>
<p>Values: <span &="=email:insert" /></p>
<p>Events: <x &="=event:insert"></x></p>
--></docs-demo>

<docs-attribute name="inverse">
<docs-demo><!--
<cxl-block inverse>
<cxl-form-group>
	<cxl-label>Inverse Label</cxl-label>
	<cxl-input type="email" inverse></cxl-input>
</cxl-form-group>
</cxl-block-inverse>
--></docs-demo>
</docs-attribute>

<docs-attribute name="disabled">
<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-label>Disabled</cxl-label>
	<cxl-input disabled &="valid(email) =email:value"></cxl-input>
</cxl-form-group>
--></docs-demo>
</docs-attribute>
</docs-component>
			`
		},
		item: {
			template: `
<docs-component name="cxl-item">
	<docs-demo &="owner:@owner"><!--
<cxl-fragment &="=list:item.each:repeat">
	<cxl-item icon="info">
		List Item Key <span &="$key:text"></span>:
		<x &="$value:text"></x>
	</cxl-item>
</cxl-fragment>
	--></docs-demo>
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
	<docs-demo &="owner:@owner"><!--
<template &="=list:item.each:repeat">
	<cxl-item icon="info">
		<cxl-col>
			<cxl-t subtitle>Primary Text <x &="$key:text"></x></cxl-t>
			<cxl-t subtitle2 &="$value:text"></cxl-t>
		</cxl-col>
	</cxl-item>
</template>
	--></docs-demo>
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
	<cxl-col grow>
		<cxl-t subtitle>Card Title</cxl-t>
	</cxl-col>
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

		option: {
			template: `
<docs-component name="cxl-option">
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
			`
		},
		select: {
			template: `
<docs-component name="cxl-select">
<docs-demo &="owner:@owner"><!--
<cxl-form-group>
	<cxl-label>Select Change Event</cxl-label>
	<cxl-select &="on(change):#onChange">
		<cxl-option>(Select an option)</cxl-option>
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>
<p>Select Value: <span &="=selectChange:text"></span></p>

<cxl-form-group>
	<cxl-label>Select 1</cxl-label>
	<cxl-select &="@value:=select">
		<cxl-option>(Select an option)</cxl-option>
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>

<p>Select 1 Value: <span &="=select:text"></span></p>

<cxl-form-group>
	<cxl-label>Select 2</cxl-label>
	<cxl-select &="@value:=select2">
		<cxl-option value="one">Option 1</cxl-option>
		<cxl-option value="two">Option 2</cxl-option>
		<cxl-option value="three">Option 3</cxl-option>
	</cxl-select>
</cxl-form-group>

<p>Select 2 Value: <span &="=select2:text"></span></p>
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
</docs-component>
			`

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
</docs-component>
			`
		},
		t: {
			template: `
<docs-component name="cxl-t">
	<docs-demo><!--
<cxl-t>
Regular Text: <br>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
</cxl-t>
<cxl-t h1>H1 Text</cxl-t>
<cxl-t h2>H2 Text</cxl-t>
<cxl-t h3>H3 Text</cxl-t>
<cxl-t h4>H4 Text</cxl-t>
<cxl-t h5>H5 Text</cxl-t>
<cxl-t h6>H6 Text</cxl-t>
<cxl-t caption>Caption</cxl-pt>
<cxl-t subtitle>Subtitle</cxl-t>
<cxl-t subtitle2>Subtitle 2</cxl-t>
<cxl-t input>Subtitle</cxl-t>

<cxl-t primary>Primary Color Text</cxl-t>
<cxl-t secondary>Secondary Color Text</cxl-t>
<cxl-t error>Error Text</cxl-t>
	--></docs-demo>
</docs-component>
			`
		},
		tab: {
			template: `
<docs-component name="cxl-tab">
</docs-component>
			`
		},
		tabs: {
			template: `
<docs-component name="cxl-tabs">
	<docs-demo><!--
<cxl-tabs>
	<cxl-tab &="route.link(cxl-tabs)">Details</cxl-tab>
	<cxl-tab>Employees</cxl-tab>
	<cxl-tab>Files</cxl-tab>
	<cxl-tab>Checks</cxl-tab>
	<cxl-tab>Extra</cxl-tab>
</cxl-tabs>
<cxl-block>
	<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa. Pellentesque cursus vestibulum aliquam. Nam elementum bibendum urna sed pretium. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
</cxl-block>
	--></docs-demo>
</docs-component>
			`
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
	title: 'Overview',
	template: `
<cxl-t h4>Features</cxl-t>

<ul>
<li>Lightweight and Simple API. ~30kb</li>
<li>Focus on Performance</li>
<li>Portable and Framework Agnostic</li>
<li>Follows Accessibility Standards</li>
</ul>

<cxl-t h4>Browser Support</cxl-t>
<ul>
	<li>Chrome: 49</li>
	<li>Firefox: 61</li>
	<li>Safari: 11.1</li>
	<li>iOS Safari: 10.3</li>
	<li>Edge: 17</li>
</ul>
<br>
<cxl-t h4>License</cxl-t>
<p>Library and Source Code released under the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL</a> open source license.</p>
<br>
<cxl-t h4>Source Code</cxl-t>
<ul>
	<li><a href="https://github.com/cxlio/cxl">Github</a></li>
</ul>
	`
});

cxl.route({
	id: "getting-started",
	path: 'getting-started',
	title: 'Getting Started',
	template: `
<cxl-t h4>Installation</cxl-t>

<cxl-t h5>npm</cxl-t>

<docs-code type="bash"><!--npm install @cxl/ui--></docs-code>

<cxl-t h5>Available Modules</cxl-t>

<p>The <code>dist</code> folder includes the following modules.</p>

<cxl-t h6>cxl-ui</cxl-t>
<p>The main module.</p>

<cxl-t h6>cxl-ui.dbg</cxl-t>
<p>Debug mode.</p>

<cxl-t h6>cxl-ui-icons</cxl-t>
<p>FontAwesome Icon support. Use with <a href="#cxl-icon"><code>&lt;cxl-icon></code></a> Component.</p>

<cxl-t h6>cxl-ui-react</cxl-t>
<p>ReactJS compatibility module. See <a href="react.html">Demo</a>.</p>

<cxl-t h6>cxl-ui-angular</cxl-t>
<p>Angular compatibility module.</p>

<!--
<cxl-t h4>Frequently Asked Questions</cxl-t>



<cxl-t h6>ui-icons-material</cxl-t>
<p>Material Icon Support</p>

-->
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
	title: 'Theming',
	template: `
<cxl-t h5>Theme Variables</cxl-t>
<br>
<template &="=variables:item.each:repeat">
<cxl-form-group>
	<cxl-label &="$key:text"></cxl-label>
	<cxl-input &="$value:@value"></cxl-input>
</cxl-form-group>
</template>
</table>
	`,
	initialize(state)
	{
		state.variables = cxl.ui.theme.variables;
	}
});

cxl.route({
	path: 'components',
	title: 'Overview',
	template: `
<cxl-t h5>Available Components</cxl-t>
<cxl-search-input &="@value:=filter"></cxl-search-input>
<br>
<cxl-grid columns="auto auto auto" gap="16px 16px">
<template &="=components:each:repeat">
	<docs-component-card &="item:@name =filter:#match:show"></docs-component-card>
</template>
</cxl-grid>
	`
},{
	match(val, el)
	{
		return !val || el.name.indexOf(val)!==-1;
	},

	components: COMPONENTS
});

cxl.component({
	name: 'docs-root',
	template: `
<cxl-router-app>
	<cxl-block>
		<cxl-t h6>@cxl/ui
		<cxl-t inline subtitle2>v1.0.0</cxl-t>
		</cxl-t>
	</cxl-block>
	<cxl-item icon="home" &="route.link(home)">Home</cxl-item>
	<cxl-item icon="book" &="route.link(getting-started)">Getting Started</cxl-item>
	<cxl-item icon="palette" &="route.link(theming)">Theming</cxl-item>
	<cxl-hr></cxl-hr>
	<cxl-block><cxl-t subtitle2>Components</cxl-t></cxl-block>
	<cxl-item icon="" &="route.link(components)">Overview</cxl-item>
	<template &="=components:each:repeat">
	<cxl-item icon="" &="item:route.link">&lt;<span &="item:text"></span>&gt;</cxl-item>
	</template>
</cxl-router-app>
	`
}, {
	components: COMPONENTS
});

})(this.cxl);