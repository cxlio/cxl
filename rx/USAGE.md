## Usage

```
import { of, be } from '@cxl/rx';

const obs = of('Hello World');
obs.subscribe(val => console.log(val)).unsubscribe();

// Using a BehaviorSubject
const ref = be('');
ref.filter(val => !!val).tap(val => console.log(val)).subscribe();
ref.next('Hello World');
```
