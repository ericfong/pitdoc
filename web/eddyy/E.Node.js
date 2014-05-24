(function() {
    /*
     * _id: sha hash, falsy for draft
     * data:
     *      oid: object id
     *      text: text string 
     *      subs: [nodeId]
     *      resPath: path string
     *      resType: string
     * subs: [E.Node]
     * _parent: current parent in memory
     * 
     */
    function Node(data, parent){
        this.construct(data, parent);
    }
    Node.prototype = {
        
        onLoad: function(){
            if (!this.oid)
                this.oid = E.util.genOid();
            if (this.subs) {
                this.subs = this.subs.map(function(sub){
                    return new E.Node(sub, this);
                }, this);
            }else {
                this.subs = [];
            }
        },
        getSubs : function() {
            return this.subs;
        },
        _loadAllSubs: function(process, cb){
            return this.load(function(){
                if (process(this) !== false) {
                    var wait = new Wait();
                    this.getSubs().forEach(function(sub){
                        sub._loadAllSubs(process, wait());
                    });
                    wait.then(cb);
                } else {
                    cb();
                }
            }.bind(this));
        },
        
        checkin: function(hashOidTable){
            if (this._id)
                return this._id;

            // fix data
            if (this.lastId) {
                delete this.lastId;
            }
            var data = E.util.omitPrivate(this);
            
            // depth-first
            data.subs = data.subs.map(function(sub){
                return sub.checkin(hashOidTable);
            });
            if (data.subs.length == 0)
                delete data.subs;

            // json and hash id
            var json = E.util.toJsonOmit(data);
            var id = this._id = E.util.hash(json);

            // store
            this._data = data;
            hashOidTable[id] = data.oid;
            E.Record.put('node', id, data);
            return id;
        },
        
//        // NOT USING
//        getDiffout: function(){
//            var oriData = this.lastId ? this.getTree().getNode(this.lastId) : {};
//            var ori = new E.Node(oriData, null);
//            var diff = {};
//            // add OR edit
//            if (ori.getText() != this.getText()) {
//                diff.isText = true;
//                diff.oriTid = this.tid;
//            }
//            // removes
//            var oriSubOids = _.pluck(ori.getSubs(), 'oid');
//            var thisSubOids = _.pluck(this.getSubs(), 'oid');
//            var removes = diff.removes = [];
//            oriSubOids.forEach(function(oid, i){
//                if (thisSubOids.indexOf(oid) < 0) {
//                    removes.push([oid, i]);
//                }
//            });
//            return diff;
//        },
        
        // text of same oid in my last commit
        getLast: function(){
            return this._data && this._data.text;
        },
        // text of same oid in my last commit and merge with all others changes
        getOther: function(){
            return this.otherText || (this._data && this._data.text);
        },
        getText: function() {
            return this.text || (this._data && this._data.text);
        },
        setText: function(text) {
            this.text = text || '';
            this.draft();
        },
        
        equals: function(b){
            var a = this;
            if (!a._id && !b._id) {
                if (a.oid != b.oid)
                    return false;
                if (a.text != b.text)
                    return false;
                if ( JSON.stringify(_.pluck(a.getSubs(), 'oid')) != JSON.stringify(_.pluck(b.getSubs(), 'oid')) )
                    return false;
            } else if (a._id != b._id) {
                return false;
            }
            return true;
        },
        
        // Async
        useDiff: function(diff, cb){
            var to = diff.to;   // must have
            var ori = diff.ori; // may not have
            
//            var other = this.getOther();
//            if (to.text != other)
//                this.otherText = this.mergeText(ori.text, to.text, other);
            
            if (to.text != this.getText()) {
                this.setText( this.mergeText(ori.text, to.text, this.getText() ) );
                this.draft();
            } else {
            }
            
            // keep the different resPath in stage node?
            // resStage, resMaster
            // remotes[remoteName] : hashId-that-remoteMaster-of-same-oid (think about re-pull-cover)
            // once remote changed, this need to re-calc
            // means in remote[remoteName], it is different for this oid pointering node
            
            // subs
            if (ori) {
                this.subs = this.mergeSubs(ori.getSubs(), to.getSubs(), this.getSubs());
                for (var i = this.subs.length - 1; i >= 0; i--) {
                    if (this.subs[i]._parent != this) {
                        var sub = this.subs[i];
                        this.subs[i] = new E.Node(sub.toData(), this);
                    }
                }
                // set parent of subs
                this.draft();
            }
            
            return cb();
        },
        /**
         * merge list of nodes
         * NEED: node.oid
         */
        mergeSubs: function(common, src, dest) {
            // handle slip only, add or remove will be globally done
            var commonOids = _.pluck(common, 'oid');
            var srcOids = _.pluck(src, 'oid');
            var destOids = _.pluck(dest, 'oid');
            
            // order is important
            var intersection = _.intersection(destOids, srcOids, commonOids);
            var srcOrder = _.intersection(srcOids, intersection);
            var commonOrder = _.intersection(commonOids, intersection);
            
            var i = 99999;
            while (commonOrder.length > 0 && i > 0) {
                if (commonOrder[0] == srcOrder[0]) {
                    // compare and drop one by one
                    commonOrder.shift();
                    srcOrder.shift();
                    continue;
                }
                // remove
                var commonFirst = commonOrder.shift();
                var srcInsertOidRef = srcOrder[srcOrder.indexOf(commonFirst) - 1];
                // insert to the ref point
                commonOrder.splice( commonOrder.indexOf(srcInsertOidRef) + 1 , 0, commonFirst);
                
                // re-play in dest, just replay the sequence, keep the node don't move
                var removeAt = destOids.indexOf(commonFirst);
                var insertAt = destOids.indexOf(srcInsertOidRef) + 1;
                if (removeAt < insertAt) {
                    var removed = dest.splice( removeAt , 1)[0];
                    destOids = _.pluck(dest, 'oid');
                    // need to re-calc
                    //insertAt = destOids.indexOf(srcInsertOidRef) + 1;
                    // just minus one, since removeAt < insertAt
                    insertAt -= 1;
                    dest.splice(insertAt, 0, removed);
                    destOids = _.pluck(dest, 'oid');
                }
                
                i--;
            }
            
            return dest;
        },
        /**
         * merge strings
         * NEED: google diff_match_patch
         */
        mergeText : function(common, src, dest) {
            common = common || '';
            src = src || '';
            dest = dest || '';
            if (src == dest)
                return dest;
            var dmp = new diff_match_patch();
            // turn dest to be patch
            var patch = dmp.patch_make(common, dest);
            // patch apply to src, so dest must be there
            var patchRet = dmp.patch_apply(patch, src);
            var merged = patchRet[0];
            //console.log('mergeText', '"'+common+'" + "'+src+'" + "'+dest+'" = "'+merged+'"');
            return merged;
        },
        

        
        _detach: function(){
            if (!this._parent) return this;
            var pSubs = this._parent.getSubs();
            var i = pSubs.indexOf(this);
            if (i >= 0) {
                pSubs.splice(i, 1);
            }
            return this;
        },
        detach: function(){
            var parent = this._parent;
            this._detach();
            parent.draft();
            return this;
        },
        remove: function(target){
            var subs = this.getSubs();
            var i = isNaN(target) ? subs.indexOf(target) : target;
            var ret;
            if (i >= 0) {
                ret = subs.splice(i, 1);
                this.draft();
            }
            return ret;
        },
        insert: function(child, at){
            if (!child) return;
            if (child._parent)
                child._detach();
            if (child._parent != this)
                child.setParent(this);
            var subs = this.getSubs();
            if (at < 0)
                at = subs.length + at + 1;  
            if (at >= subs.length)
                subs.push(child);
            else
                subs.splice(at, 0, child);
            this.draft();
            return child;
        },
        insertAfter: function(target){
            this._detach();
            var targetParent = target._parent;
            var targetIndex = targetParent.getSubs().indexOf(target);
            targetParent.insert(this, targetIndex + 1);
        },     
        insertBefore: function(target){
            this._detach();
            var targetParent = target._parent;
            var targetIndex = targetParent.getSubs().indexOf(target);
            targetParent.insert(this, targetIndex);
        },     
        
        
        jsonReplacer: function(){
            var data = E.Record.prototype.jsonReplacer.call(this);
            if (data.subs && data.subs.length == 0) {
                return _.omit(data, 'subs');
            }
            return data;
        },
        
/*        
        toCheckin: function(wait){
//            if (data.text.length > 100) {
//                var textHash = E.util.hash(data.text);
//                this.resType = data.resType = 'text';
//                this.resPath = data.resPath = 'text/'+textHash+'.txt';
//                E.put(data.resPath, data.text, wait());
//                // how about root node?
//                if (this._parent instanceof E.Node)
//                    delete data.text;
//                else
//                    data.text = data.text.substr(0, 97)+'...';
//            }
        },
*/        
        _type:'node',
    };
    _.defaults(Node.prototype, E.Record.prototype);
    E.Node = Node;
})();


/*
text: file.name,
fileSize: file.size,
fileName: file.name, 
fileMime: file.type,
fileMtime: file.lastModifiedDate.getTime(),
_fileBinaryStr: binaryStr,
fileId: id string
getFileDataUrl: function(){
if (!this._fileDataUrl)
this._fileDataUrl = 'data:'+this.fileMime+';base64,'+btoa(this._fileBinaryStr);
return this._fileDataUrl;
},
getFileBinaryStr: function(){
if (!this._fileBinaryStr)
// cut data:image/png;base64,
this._fileBinaryStr = atob( this._fileDataUrl.substr(this._fileDataUrl.indexOf(',')+1) );
return this._fileBinaryStr;
},
isFile: function(){
return this.fileId || this._fileBinaryStr || this._fileDataUrl;
},
*/
////load binary string
//function loadFile(node) {
////prevent always loading ...
//if (node.isFile() && !node._fileBinaryStr) {
//  // get binaryStr / dataUrl by fileId
//  edd.get(node.fileId, function(body, resHeaders){
//      // by resHeaders to determine it is what ???
//      node._fileBinaryStr = body;
//      return cb(node);
//  });
//} else {
//  return cb(node);
//}
//}
////save binary string
//if (this._fileBinaryStr || this._fileDataUrl) {
//  var binaryFile = new BinaryFile(this.getFileBinaryStr());
//  var exif = EXIF.readFromBinaryFile(binaryFile);
//  var dateStr = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime;
//  this.fileTime = dateStr ? new Date( dateStr.replace(/^(\d{4}):(\d{2}):/g, '$1-$2-') ).getTime() : null;
//  if (!this.fileTime)
//      this.fileTime = this.fileMtime;
//  var dateStr = new Date(this.fileTime).toISOString().substr(0, 10)
//  this.fileId = dateStr+'/'+this.fileName;
//  console.log(new Date(this.fileTime), this.fileTime, this.fileMtime);
//  E.put(this._dir+'/'+this.fileId, this._fileBinaryStr);
//}

//if (this._data.resPath) {
//E.get(this._data.resPath, function(data){
//  return cb();
//}.bind(this));
//}


