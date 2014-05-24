(function() {
    E.util = {
        
        batch: function(func, delay, expired) {
            delay = delay || 500;
            expired = expired || 60*1000;
            var context, args;
            var currRunCount = 0;
            var currRunTime = 0;
            var pendings = [];
            var later = function(){
                func.call(context, args, done);
            };
            var done = function(){
                currRunCount --;
                if (currRunCount <= 0)
                    currRunTime = 0;
                if (pendings.length > 0)
                    run();
            };
            var run = function(){
                currRunCount ++;
                currRunTime = Date.now();
                args = pendings;
                pendings = [];
                if (delay) {
                    setTimeout(later, delay);
                } else {
                    func.call(context, args, done);
                }
            };
            return function() {
                pendings.push(arguments);
                if (!currRunTime || Date.now() - currRunTime > expired) {
                    context = this;
                    run();
                }
            };
        },
        
        getUpdates: function(target, source){
            if (!target) {
                // when target is null, don't consider as update
                return null;
            }
            var hasUpdates = false;
            var updates = {};
            for (var key in source) {
                if (target[key] != source[key]) {
                    updates[key] = source[key];
                    hasUpdates = true;
                }
            }
            return hasUpdates ? updates : null;
        },
        
        timeExtend: function(dest, source){
            var maxTime = 0;
            for (var key in source) {
                var srcVal = source[key];
                var destVal = dest[key];
                if (typeof srcVal == 'object') {
                    if (!destVal || !destVal.time || destVal.time < srcVal.time) {
                        dest[key] = srcVal;
                        maxTime = Math.max(maxTime, srcVal.time);
                    }
                } else {
                    if (!destVal || destVal != srcVal) {
                        dest[key] = srcVal;
                    }
                }
            }
            return maxTime;
        },
        mixTables: function(dest, source){
            var maxTime = 0;
            for (var key in source) {
                var table = source[key];
                if (typeof table == 'object') {
                    if (!dest[key])
                        dest[key] = {};
                    var subTime = E.util.timeExtend(dest[key], table);
                    maxTime = Math.max(maxTime, subTime);
                }
            }
            return maxTime;
        },
        
        omitPrivate: function(obj){
            var data = {};
            for (var key in obj) {
                if (key.charAt(0) == '_' || typeof obj[key] == 'function')
                    continue;
                data[key] = obj[key];
            }
            return data;
        },
        
        toJsonOmit: function(obj){
            return JSON.toJson(obj, function(key, value){
                return key[0] == '_' ? undefined : value && value.jsonReplacer ? value.jsonReplacer() : value;
            });
        },
        
        timeSorter: function(a, b){
            var atime = a.getTime ? a.getTime() : a.time;
            var btime = b.getTime ? b.getTime() : b.time; 
            if (isNaN(atime)) atime = Date.now();
            if (isNaN(btime)) btime = Date.now();
            if (atime < btime) return 1;
            if (atime > btime) return -1;
            return 0;
        },

        //emailRegExp: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/,
        //filenameRegExp: /^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]+$/,
        
        oidRegExp : /^[0-9a-z]{9,12}[\.-][0-9a-z]{12}$/, 
        genOid : function() {
            var S4 = this.random32;
            return (new Date()).getTime().toString(32)+'-'+ S4()+S4()+S4();
        },
        random32 : function(){
            return (((1+Math.random())*0x100000)|0).toString(32).substring(1);
        },
        random16 : function(){
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        },
        
        /**
         * for BinaryString (FileReader.readAsBinaryString), edd.hash(binaryStr, false)
         * for Chinese, edd.hash(binaryStr), By default they are consider encoding in UTF-8
         */
        hash : function(text, utf8encode) {
            utf8encode =  (typeof utf8encode == 'undefined') ? true : utf8encode;
            if (utf8encode)
                text = Utf8.encode(text);
            return Sha1.hash('blob '+text.length + '\0' + text, false);
        },
        sha1 : function(text, utf8encode) {
            return Sha1.hash(text, utf8encode);
        },
        hashRegExp : /^[0-9a-f]{40}$/,
        
        uuid: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        },

        
        
        pathNormalize: function(path, noRoot){
            var isRoot = !noRoot && path[0] == '/';
            path = path.split('/').filter(function(x){return x}).join('/');
            return isRoot ? '/'+path : path;
        },
        
//        urlNormalize: function(url, options){
//            if (url.indexOf('://') < 0) {
//                var defaultProtocol = options.protocol || 'http';
//                url = defaultProtocol+'://'+url;
//            }
//            uri = parseUri(url);
//            url = uri.protocol + '://' + uri.authority;
//            if (!uri.path)
//                return url;
//            url += this.pathNormalize(uri.path);
//            if (!uri.query || options.trimQuery)
//                return url;
//            url += '?' + uri.query;
//            if (!uri.anchor || options.trimAnchor)
//                return url;
//            url += '#' + uri.anchor;
//            return url;
//        },
        
        
        
        /**
         * http
         */
        http: function(method, url, body, callback, headers) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseType == 'arraybuffer') {
                            return callback(xhr.response, xhr);
                        } else if (xhr.responseType == 'blob') {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                return callback(e.target.result, xhr);
                            };
                            reader.readAsArrayBuffer(xhr.response);
                        } else {
                            return callback(xhr.responseText, xhr);
                        }
                    } else {
                        //resHeaders.status = xhr.status
                        //resHeaders.statusText = xhr.statusText;
                        //resHeaders.responseText = xhr.responseText;
                        return callback(null, xhr);
                    }
                }
            };
            if (body) {
                if (window.ArrayBuffer && body instanceof ArrayBuffer && 'responseType' in xhr) {
                    xhr.responseType = 'arraybuffer';
                } else if (window.Blob && body instanceof Blob && 'responseType' in xhr) {
                    xhr.responseType = 'blob';
                } else if (typeof body == 'object') {
                    body = JSON.stringify(body);
                }
            }
            //if (xhr.overrideMimeType) {
              //  xhr.overrideMimeType('text/plain; charset=x-user-defined');
            //}                
            xhr.withCredentials = true;
            //xhr.setRequestHeader("Authorization", "Basic " + btoa('test' + ":" + 'test'))
            xhr.setRequestHeader("X-Requested-With", 'XMLHttpRequest');
            if (headers) {
                for (var key in headers)
                    if (key[0] != '_')
                        xhr.setRequestHeader(key, headers[key]);
            }
            xhr.send(body);
            return xhr;
        },
    };
})();