import { Augment, bind } from '../component/index.js';
import { ButtonBase, Spinner } from './core.js';
import { dom, Host } from '../xdom/index.js';
import { onAction, triggerEvent } from '../template/index.js';
import { Style } from '../css/index.js';

@Augment<SubmitButton>(
	<Host>
		<Style>
			{{
				icon: {
					animation: 'spin',
					marginRight: 8,
					display: 'none',
					width: 16,
					height: 16
				},
				icon$disabled: { display: 'inline-block' }
			}}
		</Style>
		<Spinner className="icon" />
		<slot />
	</Host>,
	bind(el => onAction(el).pipe(triggerEvent(el, 'form.submit')))
)
export class SubmitButton extends ButtonBase {
	static tagName = 'cxl-submit';
	primary = true;
}
