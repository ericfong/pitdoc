(function(){
    var i = 0;
    var chromeCallbacks = {};
    window.addEventListener("message", function(e) {
        var data = e.data;
        var cb = chromeCallbacks[data.id];
        if (cb)
            cb(data.body, data.headers);
        delete chromeCallbacks[data.id];
    });
    
    edd.env = {
        ajax: function(method, url, body, callback, headers){
            var id = i++;
            chromeCallbacks[id] = callback;
            var data = {id:id, method:method, url:url, body:body, headers:headers};
            window.parent.postMessage(data, "*");
        },
    };

    
//  zipSyncs: function(cb){
//  cb = cb || noop;
//  var servers = E.getOtherServers();
//  if (this._zipSyncsRunning) return cb();
//  this._zipSyncsRunning = Date.now();
//  
//  // FIXME: only sync with servers which IP smaller than localhost.host/E.hostServer
//  // Web browser should active sync with App
//
//  // call the right back-end to work
//  // only sync public things like .tree .node .commit
//  E.doZipSyncs(servers, function(changedWays){
//      
//      var isFire = false;
//      if (changedWays) {
//          // do all auto-pull
//          for (var waypath in changedWays) {
//              var waydata = changedWays[waypath];
//              tree.load(function(){
//                  tree.updateMyIfOK();
//              });
//          }
//      }
//      
//      delete this._zipSyncsRunning;
//      if (isFire)
//          E.emit('wayschanged', changedWays);
//      return cb(changedWays);
//  }.bind(this));
//},
    /*
    pushOut: function(options, cb){
        var servers = options.servers;
        delete options.servers;
        var sessionTmps = {};
        var wait = new Wait();
        Object.keys(servers).forEach(function(server){
            // prevent server is itself when APP
            this._zipSyncHost(options, server, sessionTmps, wait());
        }, this);
        wait.then(function(){
            // finally, sort tmps by .tree, merge into trees and return the changed trees
            E._zipFinish(options, sessionTmps, function(changedWays){
                if (cb)
                    cb(changedWays);
            });
        });
    },
    _zipSyncHost: function(options, server, sessionTmps, cb){
        var remoteId = server.replace(/[\\.:]+/g, "-");
        var number = 0;
        var result = null;
        var loop = function(){
            // limit for ending
            if (number < 0 || number > 99999){
                return cb();
            }
            
            this._zipMake(options, remoteId, sessionTmps, result, function(input, zipNumber){
                number = zipNumber;
                
                // as you are initiator, even number < 0, you should also make a call to server, for finishing the even
                
                var url = server ? 'http://'+server+'/forPushTrees' : '/forPushTrees';
                E.ajax(url, input, function(output){
                    if (output) {
                        result = output;
                        loop();
                    } else {
                        return cb();
                    } 
                });
                
            } );
            
        }.bind(this);
        
        loop();
    },
    _zipFinish: function(options, sessionTmps, cb){
        console.log('_zipFinish', sessionTmps);
        
        // sort by tree, instead of tmp
        var treesTmps = {};
        for (var tmpPath in sessionTmps) {
            var treePath = sessionTmps[tmpPath];
            if (treesTmps[treePath])
                treesTmps[treePath].push(tmpPath);
            else
                treesTmps[treePath] = [tmpPath];
        }
        
        var changedTrees = {}; 
        
        var wait = new Wait();
        Object.keys(treesTmps).forEach(function(treePath){
            
            // FIXME: ATOMIC READ WRITE
            var treeCallback = wait();
            E.get(treePath, function(tree){
                var treeDirty = false;
                if (!tree) {
                    tree = {};
                    treeDirty = true;
                }
                
                var wait2 = new Wait();
                treesTmps[treePath].forEach(function(tmpPath){
                    E.get(tmpPath, wait2(function(tmp){
                        E.del(tmpPath);
                        if (!tmp) {
                            console.log("zipFinish: " + tmpPath + " is not object");
                            return;
                        }
                        
                        // Merge
                        for (var key in tmp) {
                            var table = tmp[key];
                            if (typeof table == 'object') {
                                if (!tree[key])
                                    tree[key] = {};
                                treeDirty |= E.util.timeExtend(tree[key], table);
                            }
                        }
                        
                        console.log(tmpPath + " >> " + treePath);
                    }));
                });
                wait2.then(function(){
                    // write
                    if (treeDirty) {
                        // FIXME: ATOMIC READ WRITE
                        E.put(treePath, tree);
                        changedTrees[treePath] = tree;
                    }
                    treeCallback();
                });
            });
            
        });
        wait.then(function(){
            cb(changedTrees);
        });
    },
    _zipMake: function(options, remoteId, sessionTmps, last, cb){
        var currZip = new JSZip();
        var currIndex = {askes:[]};
        var lastAskesSize = 0;
        var wait = new Wait();
        
        if (!last) {
            // beginning
            currIndex.number = 0;
        } else {
            
            var lastZip = new JSZip(last);
            var zipFiles = lastZip.files;
            for (var lastPath in zipFiles) {
                var lastZipObject = zipFiles[lastPath];

                if (lastPath == "index.json") {

                    var lastIndex = JSON.parse( lastZipObject.asText() );

                    // number
                    currIndex.number = lastIndex.number >= 0 ? lastIndex.number + 1 : lastIndex.number;

                    // ask.ids -> files
                    lastAskesSize = lastIndex.askes.length
                    lastIndex.askes.forEach(function(ask){
                        // FIXME: Permission (of dir) checking for Tree
                        // ASYNC?
                        var json = localStorage.getItem(ask);
                        if (json) {
                            currZip.file(ask, json);
                        }
                    });

                } else if (_.endsWith(lastPath, ".tree")) {

                    var json = lastZipObject.asText();
                    // store as xxx.xxxx.tree.ssssID.t
                    var tmpPath = lastPath +"."+ remoteId + ".t";
                    localStorage.setItem(tmpPath, json);

                    // sessionTmps
                    sessionTmps[tmpPath] = lastPath;

                    // required files
                    var tree = JSON.parse(json);
                    if (tree && tree.nodes){
                        var dir = lastPath.substring(0, lastPath.lastIndexOf('/') + 1);
                        for (var nodeId in tree.nodes) {
                            var node = tree.nodes[nodeId];
                            var type = node.type || 'text';
                            var path = dir + nodeId + "." + type;
                            // FIXME: ASYNC?
                            if (!(path in localStorage))
                                currIndex.askes.push(path);
                        }
                    }

                } else if (!lastZipObject.options.dir) {
                    // ASYNC?
                    localStorage.setItem(lastPath, lastZipObject.asBinary() );
                }
            }
        }
        
        // first request or first response
        if (currIndex.number == 0 || currIndex.number == 1) {
//            // pulls?
//            if (options.pulls) {
//                Object.keys(options.pulls).forEach(function(path){
//                    currIndex.askes.push(path);
//                });
//            }
            // push?
            if (options.pushs) {
                Object.keys(options.pushs).forEach(function(path){
                    E.get(path, wait(function(obj){
                        currZip.file(path, JSON.stringify(obj));
                    }));
                });
            }
        }
        
        wait.then(function(){
            if (lastAskesSize == 0 && currIndex.askes.length == 0 && Object.keys(currZip.files).length == 0)
                currIndex.number = -1;
            currZip.file('index.json', JSON.stringify(currIndex));

            console.log(lastZip, currZip, currIndex.number);
            return cb( currZip.generate({type:'blob'}), currIndex.number);
        });
    },
    */
        
})();



//assign window.deviceType
window.deviceType = 'desktop';
