#!/bin/sh
git config core.hooksPath scripts

# Install @cxl in node_modules so local modules are resolved
cd node_modules && ln -s ../dist @cxl

cd build && npm run build