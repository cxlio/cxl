///<amd-module name="@cxl/ui/file-upload.js"/>
import { Augment, Attribute, Component } from '@cxl/component';
import { merge } from '@cxl/rx';
import { on } from '@cxl/dom';

@Augment('cxl-file-upload', $ =>
	merge(on($, 'dragover'), on($, 'drop'), on($, 'dragleave'))
)
export class FileUpload extends Component {
	@Attribute()
	file?: File;
}
