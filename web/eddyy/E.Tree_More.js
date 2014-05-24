(function() {
    _.extend(E.Tree.prototype, {
        
        getNode: function(nodeOid){
            // diffin is not compare to master, the updated should last for a while .. !!! or session .. or ...  within a time
            // diffin is calc on the fly and display only, de-couple from here
            var node = this.stage.findByOid(nodeOid);
            if (!node)
                node = this.stage.getNode();
            return node;
        },
        
        open: function(cb){
            E.Server.setWatch(this._id);
            if (!this.stage._data) {
                E.Server.pollAll(E.noop);
                //this.atime = Date.now();
                //E.save();
            }
            this.mergeRemotes(cb);
        },
        
        // remotes -> master
        mergeRemotes: function(cb){
            var done = function(updated){
                this.stage.loadAllSubs(function(){
                    if (cb)
                        cb(updated);
                });
            }.bind(this);
            
            this.mergeMasters(function(updated){
                if (updated || (!this.stage._data && this.master._id)) {
                    // merge to stage
                    console.log('mergeMasterToStage', this.stage, this.master);
                    this.stage.merge(this.master, function(newStage){
                        this.stage = newStage;
                        this.emit('stageUpdated', this);
                        this.stage.setParent(this);
                        if (this.stage._id) {
                            this.lastId = this.stage._id;
                        }
                        this.stage.pasts = [this.master._id];
                        done(true);
                    }.bind(this));
                } else {
                    done(false);
                }
            }.bind(this));
        },
        
        mergeMasters: function(cb){
            var remoteMasters = [];
            this._eachRemotes(function(remote){
                if (remote.master._id && (!this.master._id || this.master.findCommon(remote.master)._id != remote.master._id )) {
                    if (remote.master.getTime()) {
                        remoteMasters.push( remote.master );
                        delete remote.isNewMaster;
                    }
                }
//                if (remote.drafts) {
//                    if (!stageJson)
//                        stageJson = this.stage.toJson();
//                    for (var accountId in remote.drafts) {
//                        var draftStr = remote.drafts[accountId];
//                        // stupid compare
//                        if (draftStr && draftStr != stageJson)
//                            drafts.push( new E.Commit(JSON.parse(draftStr)) );
//                    }
//                }
            });
//            var mergeDrafts = function(){
//                var draft = drafts.shift();
//                if (draft) {
//                    console.log('mergeDraft', draft);
//                    // merge with other draft
//                    this.stage.merge(draft, function(stage){
//                        this.stage = stage;
//                        mergeDrafts();
//                    }.bind(this));
//                } else {
//                    done();
//                }
//            }.bind(this);
            
            var done = function(updated){
                this.master.loadAllSubs(function(){
                    if (cb)
                        cb(updated);
                });
            }.bind(this);
            
            if (remoteMasters.length == 0)
                return done(false);
            
            var setMaster = function(localMaster){
                // checkin the localMaster, so that even pull-merge-again, the new localMaster can based on this localMaster
                var author = this.getAuthor();
                var commitId = localMaster.checkin(author, Date.now());
                if (commitId && commitId != this.master._id) {
                    this.master = localMaster;
                    this.emit('masterUpdated', this);
                    this.moveAuthorCommitId();
                    this.change();
                    
                    done(true);
                } else {
                    done(false);
                }
            }.bind(this);
            
            // sort to asc by time
            remoteMasters = remoteMasters.sort(E.util.timeSorter).reverse();
            function mergeOneByOne(localMaster){
                var remoteMaster = remoteMasters.shift();
                if (remoteMaster) {
                    console.log('mergeRemoteMaster', remoteMaster);
                    localMaster.merge( remoteMaster, mergeOneByOne );
                } else {
                    setMaster(localMaster);
                }
            }
            mergeOneByOne( new E.Commit(this.master._id) );
        },
    });    
})();
