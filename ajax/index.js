(exports=>{
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isJSON(xhr) {
    var contentType = xhr.getResponseHeader('Content-Type');
    return contentType && contentType.indexOf('application/json') !== -1;
}
function parse(xhr) {
    return isJSON(xhr) ? JSON.parse(xhr.responseText) : xhr.responseText;
}
class Ajax {
    constructor(defaults) {
        this.defaults = Object.assign({}, {
            method: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            setup: null,
            baseURL: '',
            resolve: null
        }, defaults);
    }
    xhr(def) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest(), options = Object.assign({}, this.defaults, def), data;
            if (options.setup)
                options.setup(xhr);
            xhr.open(options.method, options.baseURL + options.url);
            function send() {
                if ('data' in options) {
                    if (options.contentType)
                        xhr.setRequestHeader('Content-Type', options.contentType);
                    data =
                        options.dataType === 'json' &&
                            typeof options.data !== 'string'
                            ? JSON.stringify(options.data)
                            : options.data;
                }
                if (options.responseType)
                    xhr.responseType = options.responseType;
                if (options.progress)
                    xhr.addEventListener('progress', options.progress);
                xhr.send(data);
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200)
                        resolve(xhr);
                    else
                        reject(xhr);
                }
            };
            if (options.resolve)
                Promise.resolve(options.resolve(xhr)).then(send, reject);
            else
                send();
        });
    }
    request(def) {
        return this.xhr(def).then(parse, function (xhr) {
            return Promise.reject(parse(xhr));
        });
    }
    get(url, params) {
        var q, i;
        if (params) {
            q = [];
            for (i in params)
                q.push(i + '=' + window.encodeURIComponent(params[i]));
            url += '?' + q.join('&');
        }
        return this.request({ url: url });
    }
    post(url, params) {
        return this.request({ method: 'POST', url: url, data: params });
    }
}
exports.ajax = new Ajax();

})(this.cxl||(this.cxl={}));