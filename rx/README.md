# @cxl/rx 
	
[![npm version](https://badge.fury.io/js/%40cxl%2Frx.svg)](https://badge.fury.io/js/%40cxl%2Frx)

Lightweight reactiveX implementation

## Project Details

-   Branch Version: [0.8.1](https://npmjs.com/package/@cxl/rx/v/0.8.1)
-   License: Apache-2.0
-   Documentation: [Link](https://cxlio.github.io/cxl/rx)
-   Report Issues: [Github](https://github.com/cxlio/cxl/issues)

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

## Features

-   Lightweight
