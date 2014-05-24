(function() {
    var E = {
        loopInterval : 10*1000,
        
        ready: function(cb){
            // init DB for load, save
            E.envReady(function(){
                E._get('E.json', function(state){
                    //alert('here why two?', state);
                    state = state || {};
                    _.extend(E, state);
                    
                    E.Record.ready(state);
                    
                    E.envServerReady(state);
                    
                    E.Tree.ready(state);
                    
                    // E.authors
                    E.authorId = state.authorId;
                    E.authors = state.authors || {};
                    
                    // flush all pending db calls 
                    _mountDbFuncs();
                    _flushDbCalls();
                    
                    // callback
                    cb();
                    // next loop
                    E._loopTimer = setTimeout(E.loop, E.loopInterval);
                });
            });
        },
        envReady: function(cb){cb()},
        envLoop: function(cb){cb()},

        envServerReady: function(){
            var servers = E._servers = [];
            var locationHost = location.host || '';

            // pithway server
            if (window.isDev) {
                E._pithwayServer = new E.Server('', 'pithway', 'Pithway.com', location.protocol+'//'+location.host);
            } else {
                E._pithwayServer = new E.Server('https://pithway.appspot.com', 'pithway', 'Pithway.com', 'http://pithway.com');
            }
            servers.push( E._pithwayServer );
            
            // VERY IMPORTANT Wifi, should have leader choosing
            // Wifi detect and make Server dynamic for each tree
            
            // Only for WebTmp
            //if (locationHost && !E.isAppClient)
            //if (locationHost.indexOf('pithway.com') < 0)
              //  servers.push( new E.Server('', 'pageHost', 'Page Host') );

            // poll & pull from all Servers parallel, each tree may determine where they push to
            // Some server can do notify? merge in debounce mode, more chance to be octopus merge
            // push to one lans leader, and wait for its' client to bridge the commits to global server 
        },
        
        loop: function() {
            if (E._looping) {
                if (Date.now() - E._looping > 60*1000) {
                    console.error('loop over 1 minute. Timeout!');
                } else {
                    E._loopAgain = true;
                    return;
                }
            }
            E._looping = Date.now();
            delete E._loopAgain;
            clearTimeout(E._loopTimer);
            delete E._loopTimer;
            function done(){
                delete E._looping;
                if (E._loopAgain) {
                    E.loop();
                } else if (E.loopInterval > 0) {
                    // debounce schedule AS _loop may be called again and again
                    clearTimeout(E._loopTimer);
                    delete E._loopTimer;
                    E._loopTimer = setTimeout(E.loop, E.loopInterval);
                }
            }
            if (E.loopInterval <= 0)
                return done();
            
            
            var wait = new Wait();
            E.envLoop(wait());
            
            E.Server.pollAll(wait());
            
//            _.each(E.servers, function(server){
//                server.onLoop(wait());
//            });
//            wait.then(function(){
//                // after all remote pull, check remotes updated, and emit events to UI
//                for (var treeId in E.trees) {
//                    E.trees[treeId].onLoop();
//                }
//            });
            
            wait.then(done);
        },

        getPithwayServer: function() {
            return E._pithwayServer;
        },
        // with passkey
        getPitAccount: function(){
            if (!E.authorId)
                return null;
            var author = E.authors[E.authorId];
            if (!author)
                return null;
            author._id = author.email || author.name.toLowerCase();
            return author;
        },
        setPitAccount: function(account){
            // one and only one for simplification
            E.authors = {};
            if (account) {
                var id = account._id = account.email || account.name.toLowerCase();
                E.authors[id] = account;
                E.authorId = id;
            } else {
                E.authorId = null;
            }
            E.save();
        },
        
        getAuthor: function(id){
            id = id || E.authorId;
            var author = E.authors[id];
            if (author) {
                author = _.extend({}, author);
                delete author.passkey;
                author._id = author.email || author.name.toLowerCase();
            }
            return author;
        },
        setAuthor: function(id, author){
            // one and only one for simplification
            E.authors = {};
            E.authors[id] = author;
            //if (!E.authorId || (author.email && !E.authors[E.authorId].email))
            E.authorId = id;
            E.save();
            _.each(E._servers, function(server){
                server.connect(null, E.noop);
            });
        },

        _save: function(cb){
            if (E._saving) {
                E._save_again = true;
                return;   
            }
            E._saving = true;
            clearTimeout(E._save_pending);
            delete E._save_pending;
            delete E._save_again;
            
            var eData = _.pick(E, ['authors', 'authorId', 'cache', 'trees']);
            var json = E.util.toJsonOmit(eData);
            E.put('E.json', json, function(){
                delete E._saving;
                if (E._save_again)
                    E._save();
                else if (cb)
                    cb();
            });
        },
        save: function(){
            if (!E._save_pending) {
                E._save_pending = setTimeout(E._save, 300);
            }
        },
        saveFlush: function(cb){
            if (E._save_pending)
                E._save(cb);
            else if (cb)
                cb();
            return E._saving;
        },

        /*
         * built-in utils
         */
        ajax: function(url, body, callback, headers, http){
            var method;
            if (typeof body == 'function') {
                method = 'GET';
                callback = body;
                body = null;
            } else {
                method = 'PUT';
                callback = callback || E.noop;
            }
            return (http || E.http)(method, url, body, function(res, resHeaders){
                if (typeof res == 'string' && res[0] == '{') {
                    res = JSON.fromJson(res);
                }
                return callback(res, resHeaders);
            }, headers);
        },
        exec: function(url, body, callback, headers){
            return E.ajax(url, body, callback, headers, E.native);
        },
        
        noop : function(){},
        pass : function(cb, ret){return cb(ret)},
    };
    (typeof window != 'undefined' ? window : global).E = E;
    
    
    
    
    // remember all db calls before E.ready
    var _dbCalls = [];
    var names = ['getIndex', 'get', 'put'];
    names.forEach(function(name){
        E[name] = function(){
            _dbCalls.push([name, arguments]);
        };
    });
    var _mountDbFuncs = function(){
        names.forEach(function(name){
            E[name] = E['_'+name];
        });
        names = null;
        _mountDbFuncs = null;
    }
    var _flushDbCalls = function(){
        _dbCalls.forEach(function(call){
            E[call[0]].apply(E, call[1]);
        });
        _dbCalls = null;
        _flushDbCalls = null;
    }
    
    // FIXME: gets and puts need to be locked or enqueue
    
})();
