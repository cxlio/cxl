(() => {
	const component = cxl.component,
		radioValues = [],
		FocusCircleCSS = {
			$focus: { outline: 0 },
			focusCircle: {
				position: 'absolute',
				width: 48,
				height: 48,
				backgroundColor: '#ccc',
				borderRadius: 24,
				opacity: 0,
				scaleX: 0,
				scaleY: 0,
				display: 'inline-block',
				translateX: -14,
				translateY: -14
			},
			focusCirclePrimary: { backgroundColor: 'primary' },
			focusCircle$invalid$touched: { backgroundColor: 'error' },
			focusCircle$hover: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.14
			},
			focusCircle$focus: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.25
			},
			focusCircle$disabled: { scaleX: 0, scaleY: 0 }
		},
		InputBase = (cxl.ui.InputBase = new cxl.ComponentDefinition(
			{
				events: ['change', 'input', 'invalid', 'blur', 'focus'],
				attributes: [
					'value',
					'invalid',
					'disabled',
					'touched',
					'focused',
					'name'
				],
				bindings: `
	registable(form)
	touchable

	=disabled:host.trigger(form.disabled)
	=invalid:aria.prop(invalid):host.trigger(invalid)
	=value:host.trigger(change):host.trigger(input)
		`
			},
			{
				onFocus(ev, el) {
					el.focused = !el.disabled;
				}
			}
		));

	/*	component(
		{
			name: 'cxl-field',
			attributes: ['floating', 'leading', 'outline', 'counter'],
			bindings: `
on(form.register):#onRegister
on(focusable.touched):#update
on(focusable.focus):#update
on(focusable.blur):#update

on(invalid):#update
on(input):#onChange
on(form.disabled):#update
on(click):#focus
	`,
			template: `
<cxl-field-base &="=focused:@focused =invalid:@invalid =disabled:@disabled =empty:@floating =leading:@leading =outline:@outline" hovered>
	<cxl-label-slot &="content(cxl-label):#onLabel"></cxl-label-slot>
	<cxl-field-content &="content .flex"></cxl-field-content>
	<cxl-focus-line &=".line =outline:hide =focused:@focused =invalid:@invalid =invalid:@touched"></cxl-focus-line>
</cxl-field-base>
<div &=".help">
	<div &=".grow">
		<cxl-field-help invalid &="=error:text:show"></cxl-field-help>
		<div &="=error:hide content(cxl-field-help)"></div>
	</div>
	<cxl-field-help &=".counter =counter:show =count:#getCountText:text"></cxl-field-help>
</div>
	`,
			styles: {
				$: { marginBottom: 16 },
				$outline: { paddingTop: 2 },
				flex: { display: 'flex', alignItems: 'center', lineHeight: 22 },
				line: { position: 'absolute', marginTop: 6, left: 0, right: 0 },
				help: { paddingLeft: 12, paddingRight: 12, display: 'flex' },
				grow: { flexGrow: 1 },
				counter: { float: 'right' },
				help$leading: { paddingLeft: 38 }
			}
		},
		{
			floating: false,
			leading: false,
			outline: false,
			label: null,

			getCountText(count) {
				return count + (this.max ? '/' + this.max : '');
			},

			onLabel(label) {
				requestAnimationFrame(() => {
					if (this.inputEl && !this.inputEl['aria-label'])
						this.inputEl['aria-label'] = label.textContent;
				});
			},

			onRegister(ev) {
				this.inputEl = ev.target;
			},

			onChange(ev) {
				const value = ev.target.value;
				this.empty = this.floating && !value;
				this.count = value ? value.length : 0;
				this.max = ev.target.maxlength;
			},

			focus() {
				if (this.inputEl) this.inputEl.focus();
			},

			update(ev) {
				var el = ev.target;

				this.disabled = el.disabled;
				this.focused = el.focused;

				if (el.touched) {
					this.invalid = el.invalid;
					this.error = el.$validity && el.$validity.message;
				}
			}
		}
	);

	component({
		name: 'cxl-form-group',
		extend: 'cxl-field',
		deprecated: true
	});
	*/

	/*	component(
		{
			name: 'cxl-input',
			extend: InputBase,
			attributes: ['maxlength', 'aria-label'],
			methods: ['focus'],
			template: `<input &="id(input) =type:|attribute(type) .input
	=aria-label:attribute(aria-label)
	=value:value
	=maxlength:filter:@maxLength value:=value
	=disabled:attribute(disabled) on(input):event.stop =name:attribute(name)
	=autocomplete:attribute(autocomplete)
	on(blur):host.trigger(blur) on(focus):host.trigger(focus)" />`,
			bindings: `role(textbox) focusable.events`,
			styles: {}
		},
		{
			value: '',
			focusline: true,
			focused: false,
			name: null,
			autocomplete: null,
			type: 'text',
			invalid: false,
			maxlength: null,

			focus() {
				this.input.focus();
			}
		}
	);


	component(
		{
			name: 'cxl-password',
			extend: 'cxl-input'
		},
		{
			type: 'password'
		}
	);
	*/

	/*	component(
		{
			name: 'cxl-option',
			attributes: [
				'value',
				'selected',
				'multiple',
				'focused',
				'disabled',
				'inactive'
			],
			events: ['selectable.action', 'change'],
			template: `
<cxl-icon icon="check" &="=multiple:show .box"></cxl-icon>
<div &="content .content"></div>
	`,
			bindings: `
role(option) selectable
=value:host.trigger(change)
	`,
			styles: {

			},
			initialize(state) {
				if (!state.value) state.value = this.innerText;
			}
		},
		{
			value: null
		}
	);*/

	component({
		name: 'cxl-search-input',
		events: ['change'],
		attributes: ['value'],
		bindings: 'role(searchbox)',
		template: `
<cxl-icon icon="search" &=".icon"></cxl-icon>
<input &="value:=value =value:host.trigger(change) .input" placeholder="Search"></input>
	`,
		styles: {
			$: {
				elevation: 1,
				position: 'relative',
				padding: 16,
				paddingBottom: 14
			},
			icon: { position: 'absolute', top: 18 },
			input: {
				outline: 0,
				border: 0,
				width: '100%',
				backgroundColor: 'surface',
				color: 'onSurface',
				lineHeight: 24,
				padding: 0,
				paddingLeft: 48,
				font: 'default'
			}
		}
	});

	component(
		{
			name: 'cxl-select',
			extend: InputBase,
			template: `
<div &=".container =opened:.opened">
	<cxl-icon &=".icon" icon="caret-down" role="presentation"></cxl-icon>
	<cxl-select-menu &="id(menu) =menuHeight:style.inline(height)
		=menuTransform:style.inline(transform) =menuScroll:@scrollTop =menuTop:style.inline(top)
		=opened:@visible =inline:@inline content"></cxl-select-menu>
	<div &="=value:hide .placeholder =placeholder:text"></div>
	<div &="=value:show:#getSelectedText:text id(selectedText) .selectedText"></div>
</div>
	`,
			attributes: ['placeholder', 'inline'],
			bindings: `
		focusable
		selectable.host:#onSelected
		=focusedItem:navigation.select:#onNavigation
		id(component)
		keypress(escape):#close
		on(blur):#close
		root.on(click):#close
		action:#onAction:event.prevent:event.stop
		role(listbox)
	`,
			styles: {
				$: { cursor: 'pointer', flexGrow: 1, position: 'relative' },
				$disabled: { pointerEvents: 'none' },
				$focus: { outline: 0 },
				icon: {
					position: 'absolute',
					right: 0,
					top: 0,
					lineHeight: 20
				},
				placeholder: {
					color: 'onSurface',
					lineHeight: 20,
					paddingRight: 16,
					paddingLeft: 16,
					paddingTop: 14,
					paddingBottom: 14,
					position: 'absolute',
					left: -16,
					top: -11,
					right: 0,
					height: 48
				},
				container: {
					overflowY: 'hidden',
					overflowX: 'hidden',
					height: 22,
					position: 'relative',
					paddingRight: 16
				},
				opened: { overflowY: 'visible', overflowX: 'visible' }
			}
		},
		{
			opened: false,
			placeholder: '',
			selected: null,
			value: null,
			menuScroll: 0,
			menuTop: 0,

			getSelectedText() {
				return cxl.Skip;
			},

			updateMenu(selectedRect) {
				var rootRect = window,
					menuRect = this.menu,
					rect = this.component.getBoundingClientRect(),
					minTop = 56,
					maxTop = rect.top - minTop,
					maxHeight,
					marginTop = selectedRect ? selectedRect.offsetTop : 0,
					scrollTop = 0,
					height;
				if (marginTop > maxTop) {
					scrollTop = marginTop - maxTop;
					marginTop = maxTop;
				}

				height = menuRect.scrollHeight - scrollTop;
				maxHeight = rootRect.clientHeight - rect.bottom + marginTop;

				if (height > maxHeight) height = maxHeight;
				else if (height < minTop) height = minTop;

				this.menuTransform = 'translateY(' + (-marginTop - 11) + 'px)';
				this.menuHeight = height + 'px';
				this.menuScroll = scrollTop;
			},

			calculateDimensions() {
				this.calculateDimensions = cxl.debounceRender(() => {
					this._calculateDimensions();
					// TODO ?
					this.component.$view.digest();
				});

				this._calculateDimensions();
			},
			/**
			 * Calculate the menu dimensions based on content and position.
			 */
			_calculateDimensions() {
				const selectedRect = this.selected;
				if (this.opened) {
					if (selectedRect) selectedRect.inactive = false;
				} else if (!selectedRect) {
					this.menuHeight = 0;
					return;
				} else selectedRect.inactive = true;

				this.updateMenu(selectedRect);
			},

			onNavigation(el) {
				this.onSelected(el);
			},

			open() {
				if (this.disabled || this.opened) return;

				this.opened = true;
				this.calculateDimensions();
			},

			close() {
				if (this.opened) {
					this.opened = false;
					this.calculateDimensions();
				}
			},

			onSelected(selected) {
				if (selected) {
					if (this.value !== selected.value)
						this.value = selected.value;

					if (this.selected) this.selected.selected = false;

					selected.selected = true;
				}

				this.selected = selected;
				this.calculateDimensions();
			},

			onAction() {
				if (this.disabled) return;

				if (this.opened) this.close();
				else this.open();
			}
		}
	);

	component(
		{
			name: 'cxl-multiselect',
			extend: 'cxl-select',
			bindings:
				'on(selectable.register):#onRegister root.on(touchend):#close role(listbox) aria.prop(multiselectable)',
			styles: {
				selectedText: {
					color: 'onSurface',
					lineHeight: 20,
					paddingRight: 16,
					paddingLeft: 16,
					paddingTop: 14,
					paddingBottom: 14,
					position: 'absolute',
					left: -16,
					top: -11,
					right: 0,
					height: 48
				}
			}
		},
		{
			getSelectedText() {
				return (
					this.selected &&
					this.selected.map(s => s.innerText).join(', ')
				);
			},

			_calculateDimensions() {
				this.menuTransform = this.opened ? 'scaleY(1)' : 'scaleY(0)';
				this.menuTop = '31px';
			},

			onRegister(ev) {
				const el = ev.target;
				// TODO safe?
				el.multiple = true;
			},

			onNavigation(element) {
				if (this.focusedItem !== element) {
					if (this.focusedItem) this.focusedItem.focused = false;

					this.focusedItem = element;
					element.focused = true;
				}
			},

			onSelected(selectedEl) {
				if (selectedEl) {
					if (!this.selected) this.selected = [];

					const selected = this.selected,
						i = selected.indexOf(selectedEl);

					if (this.focusedItem) this.focusedItem.focused = false;

					if (i === -1) {
						selectedEl.selected = true;
						selected.push(selectedEl);
					} else {
						selectedEl.selected = false;
						selected.splice(i, 1);
					}

					selectedEl.focused = true;
					this.focusedItem = selectedEl;

					if (selected.length === 0)
						this.selected = this.value = null;
					else this.value = selected.map(o => o.value);
				}

				this.calculateDimensions();
			},

			onAction(ev) {
				if (this.disabled) return;

				if (this.opened) {
					if (ev.type === 'keyup' && this.focused) {
						this.onSelected(this.focusedItem);
						return ev.preventDefault();
					}

					if (ev.target === this.component) this.close();
				} else {
					if (this.focusedItem) {
						this.focusedItem.focused = false;
						this.focusedItem = null;
					}
					this.open();
				}
			},

			onMenuAction(ev) {
				if (this.opened) ev.stopPropagation();
			}
		}
	);

	component(
		{
			name: 'cxl-autocomplete',
			methods: ['focus'],
			extend: InputBase,
			template: `
	<input autocomplete="off" &="id(input) focusable.events .input value::=value keypress:#onKey on(blur):delay(150):#deselect" />
	<div &="=showMenu:#show content .menu"></div>
			`,
			styles: {
				input: {
					color: 'onSurface',
					lineHeight: 22,
					height: 22,
					outline: 0,
					border: 0,
					padding: 0,
					backgroundColor: 'transparent',
					width: '100%',
					textAlign: 'inherit',
					borderRadius: 0,
					font: 'default'
				},
				input$focus: { outline: 0 },

				menu: {
					position: 'absolute',
					left: -12,
					right: -12,
					top: 32,
					backgroundColor: 'surface',
					overflowY: 'auto',
					elevation: 1
				}
			},
			bindings: `
				navigation.list:#onNav
				=value:#applyFilter:#shouldShow
				on(selectable.action):event.stop:#onSelect
			`,
			initialize(state) {
				state.applyFilter = cxl.debounceRender(state.applyFilter);
			}
		},
		{
			showMenu: false,
			value: '',
			focus() {
				this.input.focus();
			},
			onSelect(ev) {
				this.select(ev.target);
				this.focus();
			},
			show(val, el) {
				if (val) {
					el.style.maxHeight = '250px';
					el.style.display = 'block';
				} else el.style.display = 'none';
			},

			select(option) {
				this.value = option.value;
				this.deselect();
				this.showMenu = null;
			},

			deselect() {
				if (this.focusedElement)
					this.focusedElement = this.focusedElement.selected = false;
				this.showMenu = false;
			},
			onNav(el) {
				if (this.focusedElement) this.focusedElement.selected = false;
				this.focusedElement = el;
				el.selected = true;
			},
			shouldShow() {
				this.showMenu =
					this.showMenu !== null && !!(this.value && this.focused);
			},

			onKey(ev) {
				switch (ev.key) {
					case 'Enter':
						if (this.focusedElement)
							this.select(this.focusedElement);
						break;
					case 'Escape':
						this.deselect();
						break;
				}
			},

			filter(regex, item) {
				if (item.tagName)
					item.style.display =
						regex && regex.test(item.value) ? 'block' : 'none';
			},

			applyFilter(term, el) {
				const regex = term && new RegExp(cxl.escapeRegex(term), 'i');
				cxl.dom.find(el, item => this.filter(regex, item));
			}
		}
	);

	component(
		{
			name: 'cxl-slider',
			extend: InputBase,
			attributes: ['step'],
			bindings: `
		focusable
		role(slider)
		keypress(arrowleft):#onLeft keypress(arrowright):#onRight
		drag.in(x):#onDrag
		=value:aria.prop(valuenow)
		=max:aria.prop(valuemax)
		=min:aria.prop(valuemin)
	`,
			template: `
<div &=".background">
	<div &=".line =value:#update"><x &=".focusCircle .focusCirclePrimary"></x>
	<div &=".knob"></div>
</div></div>
	`,
			styles: [
				{
					$: {
						paddingTop: 24,
						paddingBottom: 24,
						userSelect: 'none',
						position: 'relative',
						flexGrow: 1,
						cursor: 'pointer'
					},
					knob: {
						backgroundColor: 'primary',
						width: 12,
						height: 12,
						display: 'inline-block',
						borderRadius: 6,
						position: 'absolute',
						top: 19
					},
					$disabled: { state: 'disabled' },
					focusCircle: { marginLeft: -4, marginTop: -8 },
					background: { backgroundColor: 'primaryLight', height: 2 },
					line: {
						backgroundColor: 'primary',
						height: 2,
						textAlign: 'right'
					},
					line$invalid$touched: { backgroundColor: 'error' },
					knob$invalid$touched: { backgroundColor: 'error' },
					background$invalid$touched: { backgroundColor: 'error' }
				},
				FocusCircleCSS
			]
		},
		{
			max: 1,
			min: 0,
			value: 0,
			step: 0.05,

			onLeft() {
				this.value -= +this.step;
			},

			onRight() {
				this.value += +this.step;
			},

			update(value, el) {
				if (value < 0) value = 0;
				else if (value > 1) value = 1;

				el.style.marginRight = 100 - value * 100 + '%';

				return (this.value = value);
			},

			onDrag(x) {
				if (this.disabled) return;

				this.value = x;
			}
		}
	);

	/*component(
		{
			name: 'cxl-textarea',
			methods: ['focus'],
			extend: InputBase,
			template: `
<div &="id(span) .input .measure"></div>
<textarea &="id(input) .input .textarea
	value:=value on(input):event.stop
	=value:value:#calculateHeight
	=aria-label:attribute(aria-label)
	=disabled:attribute(disabled)
	on(change):event.stop
	on(blur):host.trigger(blur) on(focus):host.trigger(focus)
"></textarea>
`,
			bindings: `
role(textbox) aria.prop(multiline) keypress(enter):event.stop focusable.events
	`,
			attributes: ['aria-label'],
			styles: {

			}
		},
		{
			value: '',

			focus() {
				this.input.focus();
			},

			calculateHeight(val) {
				this.span.innerHTML = val + '&nbsp;';
			}
		}
	);*/

	component({
		name: 'cxl-field-control',
		events: ['change'],
		attributes: [
			'value',
			'invalid',
			'disabled',
			'touched',
			'focused',
			'name',
			'label',
			'outline',
			'floating'
		],
		styles: { $: { display: 'block' } }
	});

	component(
		{
			name: 'cxl-field-input',
			extend: 'cxl-field-control',
			attributes: ['maxlength'],
			template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:text"></cxl-label>
	<cxl-input &="=maxlength:@maxlength =value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-input>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
		},
		{
			value: ''
		}
	);

	component({
		name: 'cxl-field-password',
		extend: 'cxl-field-input',
		template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:text"></cxl-label>
	<cxl-password &="=maxlength:@maxlength =value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-password>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
	});

	component(
		{
			name: 'cxl-field-textarea',
			extend: 'cxl-field-control',
			template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:show:text"></cxl-label>
	<cxl-textarea &="=value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-textarea>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
		},
		{
			value: ''
		}
	);

	/*	component(
		{
			name: 'cxl-form',
			events: ['submit'],
			attributes: ['autocomplete', 'elements'],
			bindings: `
role(form)
registable.host(form):=elements:#buildForm

on(cxl-form.submit):#onSubmit
keypress(enter):#onSubmit
	`,
			template: `
<div &="content"></div>
<form style="display:none;" method="post" &="id(form) on(submit):event.prevent:host.trigger(submit) =autocomplete:@autocomplete">
	<div &="id(inputs)"></div>
	<input &="id(input)" type="submit" />
</form>
	`,
			initialize(state) {
				state.id = 'cxl-form-' + ((Math.random() * 100) | 0);
			}
		},
		{
			autocomplete: 'off',

			buildForm(elements) {
				if (this.autocomplete !== 'on') return;

				const inputs = this.inputs;

				cxl.dom.empty(inputs);

				elements.forEach(el => {
					const i = cxl.dom('input');

					if (el.type === 'password') i.type = 'password';

					if (el.autocomplete) i.autocomplete = el.autocomplete;

					if (el.name) i.name = el.name;

					if (el.value) i.value = el.value;

					i.addEventListener('change', () => (el.value = i.value));
					el.addEventListener('change', () => (i.value = el.value));

					inputs.appendChild(i);
				});
			},

			// TODO better focusing
			onSubmit(ev) {
				let focus;

				if (this.elements) {
					this.elements.forEach(el => {
						if (el.invalid) focus = focus || el;

						el.touched = true;
					});

					if (focus) {
						focus.focus();
						return cxl.Skip;
					}
				}

				this.input.click();
				ev.stopPropagation();
			}
		}
	);*/
})();