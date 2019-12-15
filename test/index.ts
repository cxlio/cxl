import { browserRunner } from '../tester/browser-runner';
import rxSuite from '../rx/test';
// import templateSuite from '../template/test';
import workerSuite from '../worker/test';

browserRunner.run([rxSuite, workerSuite]);
