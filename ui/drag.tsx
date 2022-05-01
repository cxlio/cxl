///<amd-module name="@cxl/ui/drag.js"/>
import { Augment, Component } from '@cxl/component';
import { dom } from '@cxl/tsx';
import { dropTarget } from '@cxl/drag';
import { trigger } from '@cxl/dom';
import { css } from './theme.js';

@Augment<DropTarget>(
	'cxl-drop-target',
	css({
		$: {
			display: 'block',
		},
		over$dragover: {
			display: 'contents',
		},
		over: { display: 'none' },
		notover$dragover: { display: 'none' },
	}),
	$ =>
		dropTarget($).tap(ev => {
			if (ev.dataTransfer) {
				const items = ev.dataTransfer.items;
				$.$items = Array.from(items);
				trigger($, 'change');
			}
		}),
	() => (
		<>
			<slot className="over" name="over" />
			<slot className="notover" name="notover" />
			<slot />
		</>
	)
)
export class DropTarget extends Component {
	$items: DataTransferItem[] = [];

	get items(): DataTransferItem[] {
		return this.$items;
	}
}
