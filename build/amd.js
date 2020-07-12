window.define =
    window.define ||
        function define(name, injects, module) {
            function _require(path, resolve, reject) {
                if (Array.isArray(path)) {
                    path = path[0];
                    return Promise.resolve().then(function () { return require(path); }).then(resolve, reject);
                }
                else
                    return typeof require !== 'undefined' && require(path);
            }
            if (arguments.length === 2 && Array.isArray(name)) {
                module = injects;
                injects = name;
                name = null;
            }
            var modules = define.modules || (define.modules = {}), moduleExports = {}, globalExports = typeof exports === 'undefined' ? moduleExports : exports, args = [_require, name === 'index' ? globalExports : moduleExports];
            function findModule(name) {
                var id = name.replace(/\.js$/, '');
                return modules[id] || _require(name);
            }
            for (var i = 2; i < injects.length; i++)
                args.push(findModule(injects[i]));
            module.apply(void 0, args);
            if (name)
                modules[name] = moduleExports;
        };
