(function() {
    /*
     * when tree is cloned, all commits and structure will be cloned
     * 
     * In Tree:
     * _id: sha hash, falsy for draft
     * 
     * time: TS
     * author: {id, name, email}
     * pasts: [id]
     * node: [nodeId/E.Node]
     * 
     * _parent: E.Tree
     * _nexts: {id:true}
     * 
     * ??subs: {treeId : commitId or versionString} sub-trees
     */
    function Commit(data, parent){ 
        this.construct(data, parent);
        // SYNC func, commits are cached
        this.load();
        this._oidCaches = {};
    }
    Commit.prototype = {
        
        getNode: function(){
            if (!(this.node instanceof E.Node)) {
                this.node = new E.Node(this.node || (this._data && this._data.node), this);
                // TODO: make sure this
                // force the root node oid
                if (this._parent) {
                    this.node.oid = this._parent._id;
                }
                // SYNC func, root nodes are cached
                this.node.load();
            }
            return this.node;
        },
        loadAllSubs: function(cb){
            var _oidCaches = this._oidCaches;
            return this.load(function(){
                this.getNode()._loadAllSubs(function(node){
                    _oidCaches[node.oid] = node;
                }, cb);
            }.bind(this));
        },
        
        findByOid: function(oid){
            return this._oidCaches[oid];
        },
        getAllOid: function(){
            return this._oidCaches;
        },
        
        // draft to set pasts
        draft: function(){
            this.time = Date.now();
            if (this._id) {
                this.pasts = [this._id];
                delete this.logs;
                delete this.author;
            }
            E.Record.prototype.draft.call(this);
        },
        
        checkin: function(author, time){
            if (this._id)
                return this._id;
            
            // depth-first
            var logs = {};
            var nodeId = this.getNode().checkin(logs);
            // same root nodeId ?  have time, means force
            if (!time && nodeId == (this._data && this._data.node)) {
                // revert draft process
                this._id = this.lastId || this.pasts[0];
                _.extend(this, this._data);
                return this._id;
            }
            
            // fix data
            if (this.lastId) {
                //this.pasts = [this.lastId];
                delete this.lastId;
            }
            this.time = time || Date.now();
            if (author)
                this.author = author;
            this.logs = logs;
            var data = E.util.omitPrivate(this);
            // need this for putting into cache
            data.node = nodeId;
            
            // json and hash id
            var json = E.util.toJsonOmit(data);
            var id = this._id = E.util.hash(json);

            // store
            this._data = data;
            E.Record.put('commit', id, data);
            return id;
        },
        
        getTime: function(){
            return this.time;
        },
        
        
        // need commit.time
        findCommon : function(commit1) {
            var commit0 = this;
            if (!commit1)
                return null;
            if (commit0 == commit1 || (commit0._id && commit0._id == commit1._id))
                return commit1;

            function sort_insert(array, p) {
                var pTime = p.time || Date.now();
                for (var i = 0, ii = array.length; i < ii; i++) {
                    if ((array[i].time || Date.now()) <= pTime)
                        break;
                }
                array.splice(i, 0, p);
            }

            function find(array, p) {
                for ( var key = p._id, i = 0, ii = array.length; i < ii; i++) {
                    if (array[i]._id === key) {
                        return array[i];
                    }
                }
            }

            var commits = [ [], [] ];
            commits[0].push(commit0);
            commits[1].push(commit1);
            
            // loop only when commits[0] has something to compare with commits[1]
            while (commits[0].length > 0 && commits[1].length > 0) {
                // latest commits side is our current side
                var cur = (commits[0][0].time || Date.now()) > (commits[1][0].time || Date.now()) ? 0 : 1;
                var peer = (cur + 1) % 2;
                var curCommits = commits[cur];
                var peerCommits = commits[peer];
                var curCommit = curCommits.shift();

                // check current commit in peerCommits or not
                var found = find(peerCommits, curCommit);
                if (found) {
                    // shortcut to exit loop and return
                    return found;
                }
                
                // load all pasts and insert to curCommits
                var curPasts = curCommit.pasts;
                if (curPasts && curPasts.length > 0) {
                    curPasts.forEach(function(pastId){
                        sort_insert(curCommits, new E.Commit(pastId));
                    });
                }
            }
            return new E.Commit(null);
        },

        merge: function(another, cb){
            if (!this._id && !this.lastId && !this.pasts) {
                // no master?
                return cb(another);
            }

            if (this._id && this._id == another._id) {
                // equal
                return cb(this);
            }
            
            var target = this;
            target.loadAllSubs(function(){
                another.loadAllSubs(function(){
                    
                    var common = (target._id ? target : new E.Commit(target.lastId)).findCommon(another._id ? another : new E.Commit(another.lastId));
                    
                    if (common._id == target._id) {
                        return cb(another);
                    }
                    if (common._id == another._id) {
                        return cb(target);
                    }
                    
                    common.loadAllSubs(function(){
                        // diffArr: {oid:{ ori:E.Node, to:E.Node }} }
                        var diff = another.getDiff(common);

                        // do all sync and async merge by matching oid (may need to walk through the whole stage tree)
                        // async or mark and merge file later?
                        target.useDiff(diff, function(){
                            
                            // add another._id to the pasts of target
                            var anotherId = another._id || another.lastId;
                            if (anotherId && target.pasts.indexOf(anotherId) < 0) {
                                if (target._id) {
                                    target.pasts = [target._id];
                                    delete target._id;
                                }
                                target.pasts.push(another._id);
                                target.draft();
                            }
                            
                            cb(target);
                            //return target.loadAllSubs(function(){
                                //return cb(target);
                            //});
                            
                        });
                    });
                });
            });
        },
        
        getDiff: function(base){
            var tableA = this.getAllOid();
            var tableB = _.extend({}, base.getAllOid());
            var diffs = {};
            for (var oid in tableA) {
                var a = tableA[oid];
                var b = tableB[oid];
                if (b) {
                    delete tableB[oid];
                    // Edit in A
                    if (!a.equals(b)) {
                        diffs[oid] = {to:a, ori:b};
                    }
                } else {
                    // Add in A, but not in B
                    diffs[oid] = {to:a};
                }
            }
            // in B, but not in A
            for (var oid in tableB) {
                var b = tableB[oid];
                diffs[oid] = {ori:b};
            }
            return diffs;
        },
            
        // do all sync and async merge by matching oid (may need to walk through the whole stage tree)
        // call draft to remove the _id, but don't save
        useDiff: function(diff, cb){
            var wait = new Wait();
            var tree = this._parent;
            for (var oid in diff) {
                var d = diff[oid];
                var target = this.findByOid(oid);
                if (target) {
                    if (d.to) {
                        // add OR edit
                        target.useDiff(d, wait());
                        // slip ?
                    } else {
                        // remove
                        var target = this.findByOid(d.ori.oid);
                        if (target && target._parent instanceof E.Node) {
                            target._parent.remove(target, true);
                        }
                    }
                } else if (d.to) {
                    
                    // cannot find target, but need to add, use parent oid
                    var toP = d.to._parent;
                    if (toP instanceof E.Node) {
                        var targetParent = this.findByOid(toP.oid);
                        if (targetParent) {
                            // clone the node
                            var newNode = new E.Node(d.to._id || d.to.toData(), targetParent);
                            
                            // find the targetParent subs index by matching the nodes in front of the to Node
                            var targetSubs = _.pluck(targetParent.getSubs(), 'oid');
                            var toSubs = toP.getSubs();
                            var originalIndexInToParentSubs = toSubs.indexOf(d.to);
                            // default insert to the end if not found
                            var index = targetSubs.length;
                            for (var i = originalIndexInToParentSubs - 1; i >= 0; i--) {
                                var refIndex = targetSubs.indexOf(toSubs[i].oid);
                                if (refIndex >= 0) {
                                    index = refIndex+1;
                                    break;
                                }
                            }
                            for (var i = originalIndexInToParentSubs + 1; i < toSubs.length; i++) {
                                var refIndex = targetSubs.indexOf(toSubs[i].oid);
                                if (refIndex >= 0) {
                                    index = refIndex-1;
                                    break;
                                }
                            }
                            
                            targetParent.insert(newNode, index, true);
                        } else {
                            // ignore those add/edit which parent is not found
                            // AS the targetParent will be search and add back 
                            //console.log('I1', d);
                        }
                    }
                    
                } else {
                    // no d.to and not target, meanse removed in both dest and src
                    //console.log('I2', d);
                }
            }
            wait.then(cb);
        },
        
        pastDifference: function(another){
            return _.compact(_.difference( _.pluck(this.getAllPasts(), '_id'), _.pluck(another.getAllPasts(), '_id') ));
        },
        
//        packForPush: function(another, cb){
//            var commitIds = this.pastDifference(another);
//            var commits = {}; nodes = {};
//            var wait = new Wait();
//            commitIds.forEach(function(commitId){
//                var commitData = E.Record.get('commit', commitId);
//                if (commitData) {
//                    commits[commitId] = commitData;
//                    if (commitData.logs) {
//                        Object.keys(commitData.logs).forEach(function(nodeId){
//                            E.Record.get('node', nodeId, wait(function(nodeData){
//                                if (nodeData) {
//                                    nodes[nodeId] = nodeData;
//                                }
//                            }));
//                        });
//                    } 
//                }
//            });
//            wait.then(function(){
//                cb({commit:commits, node:nodes});
//            });
//        },
        
        getAllPasts: function(walker){
            return this._getAllPasts([], walker); 
        },
        _getAllPasts: function(array, walker){
            if (!walker || walker(this) !== false) {
                array.push(this);
                if (this.pasts) {
                    this.pasts.forEach(function(pastId){
                        (new E.Commit(pastId))._getAllPasts(array, walker); 
                    });
                }
            }
            return array;
        },
        
        /*
        walkPasts: function(commitData, iterator){
            if (commitData && commitData.pasts) {
                var tree = this._tree;
                commitData.pasts.forEach(function(pastId){
                    var past = tree.getCommit(pastId);
                    if (iterator(past));
                        this._walkPasts(past, iterator);
                }, this);
            }
        },
        walkNexts: function(commitData, iterator){
            if (commitData && commitData._nexts) {
                var tree = this._tree;
                Object.keys(commitData._nexts).forEach(function(id){
                    var c = tree.getCommit(id);
                    if (iterator(c));
                        this._walkPasts(c, iterator);
                }, this);
            }
        },
        // collect commit which in the path from this to base
        getInBetween: function(base){
            var thisTime = this.time;
            var baseTime = base.time;
            var pasts = [];
            this.walkPasts(this, function(past){
                if (past.time > baseTime)
                    pasts.push(past);
            });
            var nexts = [];
            this.walkNexts(this, function(c){
                if (c.time > thisTime)
                    nexts.push(c);
            });
            var inter = _.intersection(pasts, nexts);
            inter = inter.sort(E.util.timeSorter);
            var tree = this._tree;
            inter = inter.map(function(c){
                return new E.Commit(c, tree);
            });
            return inter.unshift(this);
        },
        // sync; diff: {oid:[diffout] } }
        getDiffArr: function(base){
            var betweens = this.getInBetween(base);
            var diff = {};
            for (var i = betweens.length - 1; i >= 0; i--) {
                var commit = betweens[i];
                for (var oid in commit.log) {
                    var diffout = commit.log[oid];
                    var dOidArr = diff[oid];
                    if (!dOidArr)
                        dOidArr = diff[oid] = [];
                    dOidArr.unshift(diffout);
                }
            }
            return diff;
        },
        */
        _type:'commit',
    };
    _.defaults(Commit.prototype, E.Record.prototype);
    E.Commit = Commit;
    
    /*
    E.CommitData.prototype = {
        build: function(){
            for (var commitId in commits) {
                var commit = commits[commitId];
                commit._id = commitId;
                if (commit._pasted)
                    continue;
                commit._pasted = true;
                if (commit.pasts) {
                    commit.pasts.forEach(function(pastId){
                        var past = commits[pastId];
                        if (past) {
                            if (!past._nexts)
                                past._nexts = {};
                            past._nexts[commitId] = true;
                        }
                    });
                }
            }
        },
    }
    */
})();
