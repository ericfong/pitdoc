(function(){
    /*
     * 
     * in wifi, use the lowest IP as leader?
     * because on-the-fly-reading-cache, all non-draft trees will be clean for a while
     */
    _.extend(E.Tree, {
        // 30 days
        Expired: 30,
        Limit: 20,
        
        ready: function(state) {
            E.trees = state.trees || {};
            for (var treeId in E.trees) {
                E.trees[treeId] = new E.Tree(treeId, E.trees[treeId]);
            }
        },
        
        get: function(treeId){
            return E.trees[treeId];
        },
            
        getOrNew: function(treeId){
            var tree = E.trees[treeId];
            if (!tree) {
                // url-pointed-tree || E.Server.pull
                tree = E.trees[treeId] = new E.Tree(treeId);
                E.emit('treeAdd', tree);
                E.save();
            }
            return tree;
        },
        
        getArray: function(){
            return _.values(E.trees).sort(E.util.timeSorter);
        },
        
//        getDefault: function(){
//            var arr = this.getArray();
//            if (arr.length == 0) {
//                return this.create('');
//            } else {
//                return arr[0];
//            }
//        },
        
        create: function(name){
            var oid = E.util.genOid();
            var tree = new E.Tree(oid, {stage:{time:Date.now(), node:{oid:oid, text:name}}});
            E.trees[oid] = tree;
            E.emit('treeCreate', tree);
            E.save();
            return tree;
        },
        
    });
})();
