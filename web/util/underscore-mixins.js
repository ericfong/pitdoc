(function() {

    /*
     * Strings
     */
    if (_.str)
        _.mixin(_.str.exports());
    _.mixin({
        
//        asyncThrottle: function(funcName){
//            var scope = this;
//            var workingField = '_'+funcName+'_working'; 
//            var againField = '_'+funcName+'_again';
//            function done(){
//                delete scope[workingField];
//                if (scope[againField])
//                    run();
//            }
//            function run(){
//                if (scope[workingField]) {
//                    scope[againField] = true;
//                    return;
//                }
//                scope[workingField] = Date.now();
//                delete scope[againField];
//                scope[funcName](done);
//            };
//            return run;
//        },
        
        objExtend: function(target){
            var sources = Array.prototype.slice.call(arguments, 1);
            sources.forEach(function (source) {
                if (!source)
                    return;
                Object.getOwnPropertyNames(source).forEach(function(propName) {
                    target[propName] = source[propName];
//                    Object.defineProperty(target, propName,
//                        Object.getOwnPropertyDescriptor(source, propName));
                });
//                for (var propName in source) {
//                    if (Object.prototype.hasOwnProperty.call(source, propName)) {
//                        target[propName] = source[propName];
//                    }
//                }                
            });
            return target;
        },
        
        objClone: function(obj) {
            if (!_.isObject(obj)) return obj;
            if (_.isArray(obj)) return obj.slice();
            var copy = Object.create(Object.getPrototypeOf(obj));
            _.objExtend.apply(_, [copy].concat(Array.prototype.slice.call(arguments)));
            return copy;
        },

        keysTable: function(keys){
            var obj = {};
            keys.forEach(function(k){
                obj[k] = true;
            });
            return obj;
        },
        
        objMap: function(obj, iterator, context){
            var results = {};
            if (!obj) return obj;
            for (var key in obj) {
                results[key] = iterator.call(context, obj[key], key, obj);
            }
            return results;
        },
        objFilter: function(obj, iterator, context){
            var results = {};
            if (!obj) return obj;
            for (var key in obj) {
                var value = obj[key];
                if (iterator.call(context, value, key, obj))
                    results[key] = value;
            }
            return results;
        },
//        deepCopy : function(obj, , context){
//            var results = {};
//            if (obj == null) return results;
//            for (var key in obj) {
//                var value = obj[key];
//                results[key] = iterator.call(context, value, key, obj);
//                this.deepCopy();
//            }
//            return results;
//
//            processor = processor || noop;
//            var newObj = {};
//            for ( var key in obj) {
//                if (key.charAt(0) == '_' || typeof obj[key] == 'function')
//                    continue;
//                var obj = obj[key];
//                if (obj && (obj._id || obj.oid)) {
//                    // first level has _id
//                    var ret = onChild.call(scope, obj);
//                    if (ret)
//                        obj = ret;
//                } else if (Array.isArray(obj)) {
//                    var arr = [];
//                    // Array of objects with _id
//                    obj.forEach(function(sub, index){
//                        if (sub._id || sub.oid) {
//                            var ret = onChild.call(scope, sub);
//                            if (ret)
//                                arr[index] = ret;
//                            // ret === false, means remove this item
//                            if (ret === false)
//                                arr.splice(index, 1);
//                        } else {
//                            arr[index] = sub;
//                        }
//                    });
//                    obj = arr;
//                } 
//                newObj[key] = obj;
//            }
//            return newObj;
//        },
        
        
        ensurePrefix : function(str, prefix){
            return str.substr(0, prefix.length) == prefix ? str : prefix+str;
        },
        removePrefix : function(str, prefix){
            return str.substr(0, prefix.length) == prefix ? str.substr(prefix.length) : str;
        },
//        domId : function(str){
//            return (str+'').replace(/[- .$/\\\0]/g, '_');
//        },
        
        /*
         * Traversal
         */
        'with': function(obj, handler){
            var args = Array.prototype.slice.call(arguments, 1);
            var handler = false;
            if (args[0] === true) {
                handler = function(value, key, object){
                    if (!value) object[key] = {};
                };
                args.shift();
            }
            if (typeof args[0] == 'function') {
                handler = args[0];
                args.shift();
            }
            for (var i = 0, ii = args.length; obj && i < ii; i++) {
                var arg = args[i];
                // flatten the array in array style
                if (Array.isArray(arg)) {
                    for (var j = 0, jj = arg.length; obj && j < jj; j++) {
                        obj = withWalk(obj, arg[j], handler);
                    }                    
                } else {
                    obj = withWalk(obj, arg, handler);
                }
            }
            return obj;
        },
        
        tryget: function(curr){
            var keys = Array.prototype.slice.call(arguments, 1);
            while (curr && keys.length > 0) {
                curr = curr[keys.shift()];
            }
            return curr;
        },
        sure: function(curr){
            var keys = Array.prototype.slice.call(arguments, 1);
            while (keys.length > 0) {
                var key = keys.shift();
                var next = curr[key];
                if (typeof next != 'object')
                    next = curr[key] = {};
                curr = next;
            }
            return curr;
        },
        
    });
    function withWalk(obj, key, handler){
        if (handler)
            handler(obj[key], key, obj);
        return obj[key];
    }

//  function pad(n, width, z, end) {
//  z = z || '0';
//  n = n + '';
//  if (n.length >= width)
//      return n;
//  if (end)
//      return n + new Array(width - n.length + 1).join(z);
//  else 
//      return new Array(width - n.length + 1).join(z) + n;
//}    

//    validName : function(str){
//        return (str+'').replace(/[- .$/\\\0]/g, '');
//    },
    
})();