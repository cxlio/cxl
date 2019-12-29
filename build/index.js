import { execSync } from 'child_process';
import { dirname, basename as pathBasename } from 'path';
import { readFileSync, writeFileSync, promises, existsSync } from 'fs';
import { catchError, of, map, tap, Observable } from '../rx';
import { Application } from '../server';
import { tsc, tsbuild } from './tsc';
function kb(bytes) {
    return (bytes / 1000).toFixed(2) + 'kb';
}
const SCRIPTDIR = dirname(process.argv[1]);
const BASEDIR = execSync(`npm prefix`, { cwd: SCRIPTDIR })
    .toString()
    .trim();
let AMD;
export function amd() {
    return tap((out) => {
        out.source =
            (AMD || (AMD = readFileSync(__dirname + '/amd.js', 'utf8'))) +
                out.source;
    });
}
export function tsconfig(tsconfig = 'tsconfig.json') {
    return new Observable(subs => {
        const output = tsbuild(tsconfig);
        for (let i in output)
            subs.next({
                path: i,
                source: output[i]
            });
        subs.complete();
    });
}
export function typescript(config) {
    return new Observable(subs => {
        const options = Object.assign({ input: 'index.ts', output: 'index.js', declaration: 'index.d.ts', amd: false, compilerOptions: null }, config);
        const output = tsc(options.input, options.compilerOptions);
        for (let i in output)
            if (!i.startsWith('/'))
                subs.next({
                    path: i,
                    source: output[i]
                });
        subs.complete();
    });
}
function readPackage(base) {
    const pkg = base + '/package.json';
    return existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8'));
}
export function file(source, out) {
    return new Observable(subs => {
        function emit(filename) {
            return promises.readFile(filename, 'utf8').then((content) => subs.next({
                path: out || pathBasename(filename),
                source: content
            }));
        }
        if (typeof source === 'string')
            emit(source).then(() => subs.complete());
        else
            Promise.all(source.map(emit)).then(() => subs.complete());
    });
}
export function pkg(config) {
    const p = readPackage(BASEDIR);
    return of({
        path: 'package.json',
        source: JSON.stringify(Object.assign({ name: p.name, version: p.version, license: p.license, files: ['*.js', '*.d.ts', '*.js.map', 'LICENSE'], main: 'index.js', homepage: p.homepage, bugs: p.bugs, repository: p.repository, dependencies: p.dependencies, peerDependencies: p.peerDependencies, type: p.type }, config))
    });
}
export function basename(replace) {
    return tap(out => (out.path = (replace || '') + pathBasename(out.path)));
}
export function prepend(str) {
    return tap((val) => (val.source = str + val.source));
}
export const tasks = {
    pkg,
    typescript,
    file
};
export const operators = {
    amd,
    basename,
    prepend
};
export class Builder extends Application {
    constructor(config) {
        super();
        this.config = config;
        this.name = '@cxl/builder';
        this.hasErrors = false;
    }
    run() {
        const result = this.parseConfig(this.config);
        if (this.hasErrors)
            throw 'Build finished with errors';
        return result;
    }
    writeFile(result) {
        writeFileSync(this.outputDir + '/' + result.path, result.source);
    }
    runTask(task) {
        this.log((output) => `${this.outputDir}/${output.path} ${kb((output.source || '').length)}`, task.pipe(map(result => {
            this.writeFile(result);
            return result;
        }), catchError(error => {
            this.hasErrors = true;
            throw error;
        })));
    }
    parseConfig(config) {
        const baseDir = config.baseDir || BASEDIR;
        const pkg = readPackage(baseDir);
        this.outputDir = config.outputDir || '.';
        if (pkg.name) {
            this.log(`build ${pkg.name} ${pkg.version}`);
        }
        if (baseDir !== process.cwd()) {
            process.chdir(baseDir);
            this.log(`chdir "${baseDir}"`);
        }
        execSync(`mkdir -p ${this.outputDir}`);
        return Promise.all(config.tasks.map(task => this.runTask(task)));
    }
}
export function build(config) {
    return new Builder(config).start();
}
