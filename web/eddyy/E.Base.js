(function() {
    function Record() {}
    Record.prototype = {
        construct: function(data, parent){
            if (typeof data == 'string') {
                this._id = data;
                if (parent)
                    this.setParent(parent);
            } else if (data) {
                // draft data
                _.objExtend(this, data);
                if (parent)
                    this.setParent(parent);
                this.onLoad();
            }
        },
        load: function(cb, skipLoaded){
            cb = cb || E.noop;
            if (this._data === undefined) {
                // not yet try to loaded
                var id = this._id || this.lastId;
                if (!id) {
                    this._data = null;
                    this.onLoad();
                    cb(this);
                } else {
                    Record.get(this._type, id, function(data){
                        this._data = data;
                        _.defaults(this, data);
                        this.onLoad();
                        cb(this);
                    }.bind(this));
                }
            } else if (cb && !skipLoaded) {
                cb(this);
            }
            return this;
        },
        onLoad: E.noop,

        setParent: function(parent){
            this._parent = parent;
            return this;
        },
        draft: function(){
            if (this._id) {
                this.lastId = this._id;
                delete this._id;
            }
            if (this._parent)
                this._parent.draft();
        },
        
        jsonReplacer: function(){
            if (this._id)
                return this._id;
            return this;
        },
        toJson: function(){
            return E.util.toJsonOmit(this);
        },
        toData: function(){
            return JSON.parse(this.toJson());
        },
    };
    E.Record = Record;

    // All 1months or 10 trees, Trees, Commits and first Node will be stored in cache1
    //E.cacheGCTime = 0;
    Record.get = function(type, id, cb){
        if (!id) return cb(null);
        var cache = E.cache[type];
        var item = cache[id];
        if (item) {
            if (item._cbs && cb) {
                // loading
                item._cbs.push(cb);
            } else {
                // loaded
                if (cb)
                    cb(item.data);
                return item.data;
            }
        } else if (cb) {
            // load start
            item = cache[id] = {_cbs:[cb]};
            E.get(id+'.'+type, function(data){
                var cbs = item._cbs;
                delete item._cbs;
                item.data = data || null;
                cbs.forEach(function(cb){cb(data)});
            });
        }
    }
    Record.put = function(type, id, data){
        var cache = E.cache[type];
        var item = cache[id];
        if (!item)
            item = cache[id] = {};
        item.data = data;
        E.save();
    }
    Record.ready = function(state){
        if (!E.cache) E.cache = {}
        _.defaults(E.cache, { node:{}, commit:{} });
    }
    
    
    function EventEmitter() {}
    EventEmitter.prototype = {
        on: function(eventName, listener){
            if (!this._listeners)
                this._listeners = {};
            var listeners = this._listeners[eventName];
            if (!listeners)
                listeners = this._listeners[eventName] = [];
            var index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 1);
            listeners.push(listener);
            return this;
        },
        emit: function(eventName){
            var listeners = this._listeners && this._listeners[eventName];
            if (!listeners || listeners.length == 0) 
                return false;
            var args = Array.prototype.slice.call(arguments, 1);
            // make a copy, as once will remove itself and affect forEach
            [].concat(listeners).forEach(function(listener){
                listener.apply(this, args);
            }, this);
            return true;
        },
        off: function(eventName, listener){
            var listeners = this._listeners && this._listeners[eventName];
            if (!listeners || listeners.length == 0) 
                return this;
            var index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 1);
            return this;
        },
        once: function(eventName, listener){
            var self = this;
            // cannot unregister
            function wrapper(){
                self.off(eventName, wrapper);
                return listener.apply(this, arguments);
            }            
            return this.on(eventName, wrapper);
        },
    };
    E.EventEmitter = EventEmitter;
    _.defaults(E, EventEmitter.prototype);
    //_.defaults(E.Element.prototype, EventEmitter.prototype);
    
})();
