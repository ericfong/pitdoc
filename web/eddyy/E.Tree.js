(function() {
    /**
     * Tree must be leader-processed in few servers. Optimize for PullPush 
     * 
     * DB:
     * master: commitId    (draft or just-read or joined or cached)
     * members/[accountId(email/username)] : {master:commitId, time:}     (merged from remotes pull) 
     * remotes/[remoteName]/master : E.Commit
     * remotes/[remoteName]/members/[accountId] : {time:}
     * 
     * newMembers : boolean     (because members directly updated)
     *
     * CLIENT:
     * stage: E.Commit
     * authorId: 
     * atime: access time
     * time: mtime
     * 
     * _name:
     */
    function Tree(id, data){ 
        this.members = {};
        this._remotes = {};
        
        this._id = id;
        _.extend(this, data);
        delete this.remotes;
        
        this.stage = new E.Commit(this.stage || this.getAuthorCommitId() || this.master, this);
        this.master = new E.Commit(this.master);
        
        this.change = _.debounce(this._change.bind(this), 300);
    }
    Tree.prototype = {
        getStage: function(){
            return this.stage;
        },
        getName: function(){
            return this.stage && this.stage.getNode().load().getText();
        },
        getTime: function() {
            return Math.max(this.stage.getTime() || 0, this.time || 0);
        },
        
        getAuthor: function(){
            return E.getAuthor(this.authorId);
        },
        getAuthorId: function(){
            var author = this.getAuthor();
            var id = author && (author.email || author.name);
            return id ? id.trim().toLowerCase() : null;
            
        },
        setAuthorId: function(authorId){
            if (this.authorId !== authorId) {
                this.authorId = authorId;
                this.change();
            }
        },
        getAuthorCommitId: function(){
            return _.tryget(this.members, this.getAuthorId(), 'master');
        },
        
        getMembers: function(){
            return this.members;
        },
        addMember: function(id, member){
            if (!id) return;
            id = id.trim().toLowerCase();
            var member = _.extend({}, member);
            member.time = Date.now();
            this.members[id] = member;
            this.change();
        },
        
        isPublic: function(){
            return false;
        },
        
        hasOtherMembers: function(){
            var accountIds = [];
            var account = E.getPitAccount();
            if (account)
                accountIds.push(account._id);
            return _.difference( Object.keys(this.members), accountIds ).length > 0;
        },

        draft: function(){
            // make sure added member
            var authorId = this.getAuthorId();
            if (authorId && !this.members[authorId]) {
                this.addMember(authorId, this.getAuthor());
            }
            
//            // only for pithway
//            var server = E.getPithwayServer();
//            if (server && server.isOnline()) {
//                var account = E.getPitAccount();
//                if (account) {
//                    server.send('/draft', {treeId:this._id, accountId:account._id, draft:this.stage.toJson()}, E.noop);
//                }
//            }
            
            this.emit('draft', this);
            E.save();
        },
            
        // tree to individual blobs
        checkin: function() {
            var author = this.getAuthor();
            // make sure added member
            this.addMember(this.getAuthorId(), author);
            
            var commitId = this.stage.checkin(author);
            if (commitId && commitId != this.master._id) {
                this.master = new E.Commit(commitId);
                this.moveAuthorCommitId();
                this.change();
                return true;
            }
            
            // this should trigger pushCheck in a debounced way
            
            return false;
        },

        push: function(cb){
            var author = this.getAuthor();
            this.addMember(this.getAuthorId(), author);
            var commitId = this.stage.checkin(author);
            if (commitId && commitId != this.master._id) {
                this.master = new E.Commit(commitId);
                this.moveAuthorCommitId();
                this.change();
            }
            
            var wait = new Wait();
            var ret = null;
            this._forPushRemotes(function(remote, serverId, server){
                var pushMaster = null;
                var pushMembers = {};
                var shouldPush = false;
                
                if (this.master._id != remote.master._id) {
                    if (!remote.master._id || this.master.findCommon(remote.master)._id == remote.master._id) {
                        pushMaster = this.master._id;
                        shouldPush = true;
                    }
                }
                
                for (var accountId in this.members) {
                    var lmember = this.members[accountId];
                    var rmember = remote.members[accountId];
                    if (!rmember || lmember.time > rmember.time) {
                        accountId = accountId.trim().toLowerCase()
                        pushMembers[accountId] = lmember;
                        shouldPush = true;
                    }
                }
                if (shouldPush) {
                    // real push
                    var treeId = this._id;
                    var pushData = {treeId:this._id, authorId:this.getAuthorId(), master:pushMaster, members:pushMembers};
                    
                    if (pushMaster) {
                        this._pushPack(server, pushMaster, wait(function(pack){
                            _.extend(pushData, pack);
                            server.send('/push', pushData, wait(function(result){
                                ret = result;
                            }));
                        }));
                    } else {
                        server.send('/push', pushData, wait(function(result){
                            ret = result;
                        }));
                    }
                }
            });
            wait.then(function(){
                if (cb)
                    cb(ret);
            });
        },
        
        moveAuthorCommitId: function(){
            var authorId = this.getAuthorId();
            if (authorId && this.master) {
                var aMember = _.sure(this.members, authorId);
                if (aMember.master !== this.master._id) {
                    aMember.master = this.master._id;
                    aMember.time = Date.now();
                    this.change();
                }
            }
        },
        
        getPendingCount: function(){
            var lMaster = this.master;
            var pending = [];
            this._eachRemotes(function(remote, serverId){
                if (remote.master._id == lMaster._id)
                    return;
                pending.concat( remote.master.pastDifference(lMaster) );
            });
            _.uniq(pending);
            return pending.length;
        },
        
        _change: function(){
            //this.pushCheck();
            this.emit('change', this);
            E.save();
        },
        
        pushCheck: function(){
            this._forPushRemotes(function(remote, serverId, server){
                var pushMaster = null;
                var pushMembers = {};
                var shouldPush = false;
                
                if (this.master._id != remote.master._id) {
                    if (!remote.master._id || this.master.findCommon(remote.master)._id == remote.master._id) {
                        pushMaster = this.master._id;
                        shouldPush = true;
                    }
                }
                
                for (var accountId in this.members) {
                    var lmember = this.members[accountId];
                    var rmember = remote.members[accountId];
                    if (!rmember || lmember.time > rmember.time) {
                        accountId = accountId.trim().toLowerCase()
                        pushMembers[accountId] = lmember;
                        shouldPush = true;
                    }
                }
                if (shouldPush) {
                    // real push
                    var treeId = this._id;
                    var pushData = {treeId:this._id, authorId:this.getAuthorId(), master:pushMaster, members:pushMembers};
                    
                    if (pushMaster) {
                        this._pushPack(server, pushMaster, function(pack){
                            _.extend(pushData, pack);
                            server.send('/push', pushData, function(result){
                                console.log('pushResult', result);
                            });
                        });
                    } else {
                        server.send('/push', pushData, function(result){
                            console.log('pushResult', result);
                        });
                    }
                }
            }); 
        },
        
        _pushPack:function(server, commitId, cb){
            var pack = {commit:{}, node:{}};
            var isMissing = function(query){
                server.send('/isMissing', query, function(result){
                    if (!result) return cb('Disconnected');
                    
                    query = {commit:{}, node:{}};
                    var wait = new Wait();
                    var hasNextMissing = false;
                    Object.keys(result).forEach(function(type){
                        var typeArr = Object.keys(result[type]);
                        if (typeArr.length > 0) {
                            typeArr.forEach(function(id){
                                // remote don't have this id
                                E.Record.get(type, id, wait(function(data){
                                    if (data) {
                                        
                                        pack[type][id] = data;
                                        
                                        if (type == 'commit') {
                                            if (data.pasts) {
                                                data.pasts.forEach(function(pastId) {
                                                    query.commit[pastId] = 1; 
                                                    hasNextMissing = true;
                                                });
                                            }
                                            if (data.node) {
                                                query.node[data.node] = 1; 
                                                hasNextMissing = true;
                                            }
                                        } else if (type == 'node') {
                                            if (data.subs) {
                                                data.subs.forEach(function(nodeId){
                                                    query.node[nodeId] = 1; 
                                                    hasNextMissing = true;
                                                });
                                            }
                                        }
                                    }
                                }));
                            });
                        }
                    });
                    
                    wait.then(function(){
                        if (hasNextMissing) {
                            isMissing(query);
                        } else {
                            cb(pack);
                        }
                    });
                });
            };
            var query = {commit:{}};
            query.commit[commitId] = 1;
            isMissing(query);
        },
        
        setRemotes: function(remotesData){
            var shouldCheck = false;
            var stageJson = null;
            for (var serverId in remotesData) {
                var rTree = remotesData[serverId];
                var remote = this._remotes[serverId];
                if (!remote) {
                    remote = this._remotes[serverId] = {};
                    shouldCheck = true;
                }
                
                if (!remote.master || remote.master._id != rTree.master) {
                    remote.master = new E.Commit(rTree.master);
                    shouldCheck = true;
                    if (remote.master._id && (!this.master._id || this.master.findCommon(remote.master)._id != remote.master._id)) {
                        // remote master should refect in _time 
                        console.log("remoteNewMaster", this, serverId);
                        
                        remote.isNewMaster = true;
                        // as the remote master.time < this.master.time, but still need to merge, and notify the UI
                        this.time = Date.now();
                        this.emit('remoteNewMaster', this, serverId);
                    }
                }
                
                // directly update
                remote.members = rTree.members || {};
                if (E.util.timeExtend(this.members, rTree.members)) {
                    this.emit('newMembers', this);
                }
                
                // drafts
//                if (rTree.drafts) {
//                    if (!remote.drafts)
//                        remote.drafts = {};
//                    for (var accountId in rTree.drafts) {
//                        var draftStr = rTree.drafts[accountId];
//                        if (draftStr && draftStr != remote.drafts[accountId]) {
//                            remote.drafts[accountId] = draftStr;
//                            
//                            if (!stageJson)
//                                stageJson = this.stage.toJson();
//                            if (draftStr != stageJson) {
//                                console.log("remoteNewDraft", this._id, draftStr);
//                                this.emit('remoteNewDraft', this, serverId, accountId);
//                            }
//                        }
//                    }
//                }
            }
            if (shouldCheck)
                this.pushCheck();
        },
        getRemotes: function(){
            var ret = {}
            _.each(E._servers, function(server){
                var remote = this._remotes[server._id];
                if (remote)
                    ret[server._id] = remote;
            }, this);
            return ret;
        },
        _eachRemotes: function(func){
            _.each(E._servers, function(server){
                var remote = this._remotes[server._id];
                // remote == null means it every not connected or this server is not the push target
                if (remote)
                    func.call(this, remote, server._id, server);   
            }, this);
        },
        _forPushRemotes: function(func){
            _.each(E._servers, function(server){
                var remote = this._remotes[server._id];
                // remote == null means it every not connected or this server is not the push target
                if (remote)
                    func.call(this, remote, server._id, server);   
            }, this);
        },
    };
    _.defaults(Tree.prototype, E.EventEmitter.prototype);
    E.Tree = Tree;
})();