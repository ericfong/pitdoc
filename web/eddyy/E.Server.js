(function(){
    E.Server = function(host, id, name, userHost){
        this._host = host;
        this._id = id;            
        this._name = name;
        this._userHost = userHost || this._host;
        this.connect(null, E.noop);
    };
    // watch in this memory
    var watchIds = {};
    E.Server.setWatch = function(treeId){
        // once set, it affect all servers
        watchIds[treeId] = true;
        E.Server.pollAll(E.noop);
    }
    E.Server.pollAll = function(cb){
        var wait = new Wait();
        var results = {};
        _.each(E._servers, function(server){
            server.poll({watchIds:watchIds}, wait(function(rTrees){
                if (typeof rTrees == 'object') {
                    // sort by treeId
                    var serverId = server._id;
                    
                    // make sure watchIds will be push after connected, (server should do that)
                    /*
                    for (var treeId in watchIds) {
                        var lTree = results[treeId];
                        if (!lTree)
                            lTree = results[treeId] = {};
                        lTree[serverId] = {};
                    }
                    */
                    
                    for (var treeId in rTrees) {
                        var lTree = results[treeId];
                        if (!lTree)
                            lTree = results[treeId] = {};
                        lTree[serverId] = rTrees[treeId];
                    }
                }
            }));
        });
        wait.then(function(){
            for (var treeId in results) {
                E.Tree.getOrNew(treeId).setRemotes(results[treeId]);
            }
        });
        wait.then(cb);
    }
    E.Server.prototype = {
        poll: function(input, cb){
            if (this._stopPoll)
                return cb();
            
            var self = this;
            var rTrees = null;
            
            //var watchIds = _.pluck(_.filter(E.trees, function(t){return t.isWatching()}), '_id');
            //watchIds = _.keysTable(watchIds);
            // input = {watchIds:watchIds}
            
            self.send('/poll', input, function(output){
                if (!output) return cb('Disconnected');
                
                rTrees = output.trees;         
                for (var treeId in rTrees) {
                    // make sure all referred commit pull
                    var rTree = rTrees[treeId];
                    if (rTree.master && !E.Record.get('commit', rTree.master)) {
                        req.commit[rTree.master] = 1;
                    }
                    _.each(rTree.members, function(member){
                        if (member.read && !E.Record.get('commit', member.read)) {
                            req.commit[member.read] = 1;
                        }
                    });
                }
                
                if (Object.keys(req.commit).length > 0)
                    loop();
                else
                    cb(rTrees);
            });

            var req = {commit:{}};
            var pack = {commit:{}, node:{}};
            var loop = function(){
                self.send('/pull', req, function(res){
                    if (!res) return cb('Disconnected');
                    
                    req = {commit:{}, node:{}, res:{}};
                    self._pullProcess(res, req, pack, function(isPulling){
                        if (isPulling) {
                            loop();
                        } else {
                            // move to here, to make sure everything pull and then save
                            for (var type in pack) {
                                var table = pack[type];
                                for (var id in table) {
                                    E.Record.put(type, id, table[id]);
                                }
                            }
                            
                            cb(rTrees);
                        }
                    });
                });
            };
        },
        _pullProcess: function(res, req, pack, cb){
            var wait = new Wait();
            var isPulling = false;
            
            for (var id in res.commit) {
                var commitData = res.commit[id];
                if (!commitData) continue;
                pack.commit[id] = commitData;
                if (commitData.pasts) {
                    commitData.pasts.forEach(function(pastId){
                        if (!pack.commit[pastId] && !E.Record.get('commit', pastId)) {
                            isPulling = true;
                            req.commit[pastId] = 1;
                        }
                    });
                }
                if (!pack.node[commitData.node] && !E.Record.get('node', commitData.node)) {
                    isPulling = true;
                    req.node[commitData.node] = 1;
                }
            }
            
            for (var id in res.node) {
                var nodeData = res.node[id];
                if (!nodeData) continue;
                pack.node[id] = nodeData;
                if (nodeData.subs) {
                    nodeData.subs.forEach(function(nodeId){
                        if (!pack.node[nodeId]) {
                            E.Record.get('node', nodeId, wait(function(data){
                                if (!data) {
                                    isPulling = true;
                                    req.node[nodeId] = 1;
                                }
                            }));
                        }
                    });
                }
            }
            
            wait.then(function(){
                cb(isPulling);
            });
        },
        
        send: function(path, input, cb){
//            if (this._connect) {
                E.ajax(this._host+path, input, this._onlineDetector(cb));
//            } else {
//                this.connect(E.authors, function(output, res){
//                    if (this._connect) {
//                        this.send(path, input, cb);
//                    }
//                }.bind(this));
//            }
        },
        connect: function(input, cb){
            input = input || E.authors;
            _.each(input, function(account, id){
                if (!account._id)
                    account._id = id;
            });
            E.ajax(this._host+'/connect', input || {}, this._onlineDetector(function(output, res){
                if (output) {
                    this._connect = output;
                    this.emit('connected');
                }
                cb(output, res);
            }.bind(this)));
        },
        login: function(account, cb){
            E.ajax(this._host+'/login', account, this._loginOrSignupCb(account._id, cb) );
        },
        signup: function(account, cb){
            E.ajax(this._host+'/signup', account, this._loginOrSignupCb(account._id, cb) );
        },
        loginOrSignup: function(account, cb){
            E.ajax(this._host+'/loginOrSignup', account, this._loginOrSignupCb(account._id, cb) );
        },
        _loginOrSignupCb: function(accountId, cb){
            return this._onlineDetector(function(output, res){
                if (output) {
                    if (!this._connect)
                        this._connect = {};
                    this._connect[accountId] = output;
                    this.emit('login');
                }
                cb(output, res);
            }.bind(this))
        },
        _onlineDetector: function(cb){
            return function(output, res){
                cb(output, res);
                if (!output && res.status == 0) {
                    // Disconnected
                    if (this._online) {
                        this._online = false;
                        delete this._connect;
                        this.emit('online', this._online);
                    }
                } else {
                    if (!this._online) {
                        this._online = true;
                        this.emit('online', this._online);
                    }
                }
            }.bind(this)
        },
        isOnline: function(){
            return this._online;
        },
        getConnect: function(){
            return this._connect;
        },
        getLoginStatus: function(){
            if (this._connect && this._connect[E.authorId])
                return this._connect[E.authorId];
        },
        
        getName: function(){
            return this._name;
        },
        getUrl: function(){
            return this._host;
        },
    };
    _.extend(E.Server.prototype, E.EventEmitter.prototype);
    
//    E.Account = function(id, data){
//        this._id = id;
//        _.extend(this, data);
//    };
//    E.Account.prototype = {
//        save: function(){
//            
//        },
//    };
    
//  updateE('server', output.server || {});
//  updateE('network', output.network || {});
//  function updateE(field, obj) {
//      if (!obj || obj == E[field])
//          return;
//      var updates = E.util.getUpdates(E[field], obj);
//      E[field] = obj;
//      if (updates) {
//          var eventName = _.string.capitalize(field)+'Updated';
//          console.log('E.emit', eventName, updates);
//          E.emit(eventName, updates);
//      }
//  }
  
    
/*  
    E.Server.prototype = {
        setupWizard: function(state, cb){
            while (!E.username) {
                var name = prompt("Choose your username (character or digit or '-'):","New");
                if (name.length > 30) {
                    alert('Cannot longer than 30 characters');
                    continue;
                }
                var m = name.match(/[^a-zA-Z0-9-]/);
                if (m) {
                    alert('Cannot use "'+m[0]+'"');
                    continue;
                }
                if (name[0] == '-' || name[name.length-1] == '-') {
                    alert('Cannot use "-" as the first or the last character.');
                    continue;
                }
                E.username = name;
            }
        },
        push: function(cb){
            var remoteName = this.getName();
            var pushs = {};
            for (var treeId in E.trees) {
                var tree = E.trees[treeId];
                
                var lCommitId = tree.master;
                var rCommitId = tree.remoteMasters[remoteName];
                if (lCommitId != rCommitId) {
                    if (!pushs[treeId])
                        pushs[treeId] = {reads:{}};
                    // FIXME: find commonParent, SYNC!
                    pushs[treeId].master = lCommitId;
                }
                
                var lreads = tree.reads;
                var rreads = tree.remoteReads[remoteName];
                for (var accountId in lreads) {
                    var lread = lreads[accountId];
                    var rread = rreads[accountId];
                    if (lread != rread) {
                        if (!pushs[treeId])
                            pushs[treeId] = {reads:{}};
                        pushs[treeId].reads[accountId] = lread;
                    }
                }
                
                if (pushs[treeId]) {
                    pushs[treeId].authorId = tree.getAuthorId();
                }
            }
            
            E.ajax(this._host+'/pushTrees', pushs, function(output){
                if (Object.keys(pushs).length > 0)
                    this._pushLoop(pushs, cb);
                else
                    cb();
            });
        },
        pushLoop: function(treeId, inRes, cb){
            var askedCommits = Object.keys(inRes.commit);
            if (askedCommits.length == 0)
                return cb(null);
            
            var wait = new Wait();
            var outReq = {commit:{}, node:{}, file:{}};
            askedCommits.forEach(function(id){
                E.Record.get('commit', id, wait(function(data){
                    outReq.commit[id] = data;
                }));
            });
            
            var self = this;
            var loop = function(){
                self.send('/push/'+treeId, outReq, function(result){
                    if (!result)
                        return cb('Disconnected');
                    
                    outReq = {commit:{}, node:{}, file:{}};
                    var hasOut = false;
                    Object.keys(result).forEach(function(type){
                        Object.keys(result[type]).forEach(function(id){
                            E.Record.get(type, id, wait(function(data){
                                outReq[type][id] = data;
                                hasOut = true;
                            }));
                        });
                    });
                    wait.then(function(){
                        if (hasOut) {
                            loop();
                        } else {
                            return cb(null);
                        }
                    });
                    
                });
            };
            loop();
        },
        pushLoop: function(treeId, inRes, cb){
            var askedCommits = Object.keys(inRes.commit);
            if (askedCommits.length == 0)
                return cb(null);
            
            var wait = new Wait();
            var outZip = new JSZip();
            var outReq = {commit:{}, node:{}, file:{}};
            askedCommits.forEach(function(id){
                E.Record.get('commit', id, wait(function(data){
                    outReq.commit[id] = data;
                }));
            });
            outZip.file('body', JSON.stringify(outReq));
            
            var self = this;
            var loop = function(){
                console.log(outZip);
                self.send('/push/'+treeId, outZip.generate({type:'blob'}), function(result){
                    if (!result)
                        return cb('Disconnected');
                    
                    var lastZip = new JSZip(result);
                    var inRes = JSON.parse( lastZip.files.body.asText() );
                    
                    outZip = new JSZip();
                    var outReq = {commit:{}, node:{}, file:{}};
                    var hasOut = false;
                    Object.keys(inRes).forEach(function(type){
                        Object.keys(inRes[type]).forEach(function(id){
                            E.Record.get(type, id, wait(function(data){
                                outReq[type][id] = data;
                                hasOut = true;
                            }));
                        });
                    });
                    wait.then(function(){
                        if (hasOut) {
                            outZip.file('body', JSON.stringify(outReq));
                            loop();
                        } else {
                            return cb(null);
                        }
                    });
                    
                });
            };
            loop();
        },
    }  
    E.dns = {
            resolve: function(oriUrl){
                return this.uriResolve( new URI(oriUrl) ) + '';
            },
            uriResolve: function(uri){
                var urlHost = uri.host();
                if (urlHost == location.host || urlHost == E.server.accessDomain) {
                    return uri.authority('').scheme('');
                }
                return uri;
            },
            isPageHost: function(url){
                var urlHost = new URI(url).host();
                return !urlHost || urlHost == location.host || urlHost == E.server.accessDomain;
            },
    };
    */
})();