(function(){
    _.extend(E, {
        http: E.util.http,
        _getIndex: function(cb){
            E.exec('index.json', cb);
        },
        _get: function(path, cb) {
            return E.exec(path, cb);
        },
        _put: function(path, body, cb) {
            return E.exec(path, body, cb);
        },
        
//        envLoop: function(cb){
//            E.ajax('/flushPendingJs', function(js){
//                if (js)
//                    eval(js);
//                return cb();
//            })
//        },
    });
    
//    // polyfill cordova
//    if (!window.cordova)
//        window.cordova = {};
//    if (!window.cordova.fireWindowEvent) {
//        window.cordova.fireWindowEvent = function(type, data) {
//            var evt = createEvent(type,data);
//            window.dispatchEvent(evt);
//        } 
//        function createEvent(type, data) {
//            var event = document.createEvent('Events');
//            event.initEvent(type, false, false);
//            if (data) {
//                for (var i in data) {
//                    if (data.hasOwnProperty(i)) {
//                        event[i] = data[i];
//                    }
//                }
//            }
//            return event;
//        }
//    }
    
})();
