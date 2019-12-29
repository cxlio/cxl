/// <amd-module name="index" />
import rxSuite from '../rx/test';
import templateSuite from '../template/test';
import componentSuite from '../component/test';
import domSuite from '../dom/test';
import workerSuite from '../worker/test';
import storeSuite from '../store/test';
import { suite } from '../tester';

//export default suite('@cxl', [rxSuite, templateSuite, workerSuite]);
export default suite('@cxl', [
	rxSuite,
	templateSuite,
	workerSuite,
	componentSuite,
	domSuite,
	storeSuite
]);
