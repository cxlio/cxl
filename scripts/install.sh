#!/bin/sh
git config core.hooksPath scripts

[ ! -d dist ] && mkdir -p dist
# Install @cxl in node_modules so local modules are resolved
[ ! -d node_modules/@cxl ] && cd node_modules && ln -s ../dist @cxl
cd ..
npm run build --prefix build
npm run build --prefix tester
