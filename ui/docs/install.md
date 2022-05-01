# Installation

## Package Manager

```
npm install @cxl/ui
```

## Use a CDN

To import the main bundle.

```
<script src="https://cdn.jsdelivr.net/npm/@cxl/ui"></script>
```

You can also import components individually, however keep in mind that you would have to manage dependencies manually.

```
<script src="https://cdn.jsdelivr.net/npm/@cxl/ui/core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@cxl/ui/table.min.js"></script>
```

## AMD and ES6 Modules

All components are also included as AMD and ES6 modules. No AMD loader is required if you include the main bundle file.

```
<script src="https://cdn.jsdelivr.net/npm/@cxl/ui/mjs/core.min.js"></script>
```

If you are using typescript, webpack, or any ES6 or requirejs compatible build tool to bundle your scripts, you can import components directly from your source files.

```
import '@cxl/ui';

import '@cxl/ui/calendar.js';
```
