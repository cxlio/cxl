import rxSuite from '../rx/test';
import templateSuite from '../template/test';
import componentSuite from '../component/test';
import domSuite from '../dom/test';
import workerSuite from '../worker/test';
import storeSuite from '../store/test';
import { suite } from '../spec';
import uiSuite from '../ui/test';

export default suite('@cxl', [
	rxSuite,
	templateSuite,
	workerSuite,
	componentSuite,
	domSuite,
	storeSuite,
	uiSuite,
]);
