import { browserRunner } from '../tester/browser-runner';
import rxSuite from '../rx/test';
import templateSuite from '../template/test';

browserRunner.run([rxSuite, templateSuite]);
