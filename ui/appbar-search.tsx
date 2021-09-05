///<amd-module name="@cxl/ui/appbar-search.js"/>
import { StyleAttribute, Augment, get } from '@cxl/component';
import { IconButton, SearchIcon } from './icon.js';
import { ariaValue, syncAttribute, teleport } from '@cxl/template';
import { on, onAction } from '@cxl/dom';
import { DisabledStyles, css } from './theme.js';
import { merge } from '@cxl/rx';
import { InputBase } from './input-base.js';
import { Appbar, AppbarContextual } from './appbar.js';
import { Field } from './field.js';
import { Input } from './form.js';
import { dom } from '@cxl/tsx';
import { focusDelegate } from './core.js';
/**
 * Search Input component for Appbar.
 *
 * @demo
 * <cxl-appbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-appbar-search></cxl-appbar-search>
 * </cxl-appbar>
 * @beta
 * @see Appbar
 */
@Augment<AppbarSearch>(
	'cxl-appbar-search',
	css({
		$: { display: 'flex', position: 'relative' },
		$opened: {
			backgroundColor: 'surface',
		},
		input: { display: 'none', marginBottom: 0, position: 'relative' },
		input$opened: {
			display: 'block',
		},
		button$opened: { display: 'none' },
		'@medium': {
			input: {
				width: 200,
				display: 'block',
			},
			button: { display: 'none' },
		},
		$disabled: DisabledStyles,
	}),
	$ => {
		let inputEl: Input;

		function onContextual(val: boolean) {
			if (val) requestAnimationFrame(() => inputEl.focus());
		}

		return teleport(
			<AppbarContextual
				$={el => get(el, 'visible').tap(onContextual)}
				name="search"
			>
				<Field className="input">
					<Input
						$={el =>
							merge(
								get($, 'name').pipe(ariaValue(el, 'label')),
								syncAttribute($, (inputEl = el), 'value')
							)
						}
					/>
					<SearchIcon />
				</Field>
			</AppbarContextual>,
			'cxl-appbar'
		);
	},
	host => {
		return (
			<>
				<IconButton
					$={el =>
						merge(
							onAction((host.mobileIcon = el)).tap(() =>
								host.open()
							),
							on(el, 'blur').tap(() => (host.touched = true))
						)
					}
					className="button"
				>
					<SearchIcon />
				</IconButton>
				<Field className="input">
					<Input
						$={el =>
							merge(
								get(host, 'name').pipe(ariaValue(el, 'label')),
								syncAttribute(host, el, 'value'),
								focusDelegate(host, (host.desktopInput = el))
							)
						}
					/>
					<SearchIcon />
				</Field>
			</>
		);
	}
)
export class AppbarSearch extends InputBase {
	@StyleAttribute()
	opened = false;

	protected desktopInput?: Input;
	protected mobileIcon?: IconButton;

	value = '';

	open() {
		const appbar: Appbar | null = this.parentElement as Appbar;
		if (appbar) appbar.contextual = 'search';
	}

	focus() {
		if (this.desktopInput?.offsetParent) this.desktopInput.focus();
		else if (this.mobileIcon?.offsetParent) this.mobileIcon.focus();
	}
}
