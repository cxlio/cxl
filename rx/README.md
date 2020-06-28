# @cxl/rx

[![npm version](https://badge.fury.io/js/%40cxl%2Frx.svg)](https://badge.fury.io/js/%40cxl%2Frx)

Super lightweight rxjs implementation.

[Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0.txt)
[Documentation](https://coaxialhost.com/rx)

## Features

-   Lightweight < 4Kb gzipped
-   Type Safe, Typescript 3.8+
-   Compatible with rxjs

## Installation

    npm install @cxl/rx

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
