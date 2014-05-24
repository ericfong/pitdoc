Main.main = function(){
localStorage.clear();
E.loopInterval = 0;
var num = 0;
E.util.genOid = function(){
    return 'oid'+(num++);
}
E.ready(function(){
    var wait = new Wait();

    // create
    var stage = new E.Commit({node:{}});
    stage.checkin(null, 1);
    
    var cid1 = stage._id; 
    
    // edit
    stage.getNode().setText('New');
    stage.getNode().insert(new E.Node({text:'first node'}), 0);
    stage.checkin(null, 2);

    // merge in 
    var another = new E.Commit(cid1);
    another.getNode().setText('New');
    another.getNode().insert(new E.Node({text:'added by B'}), 0);
    another.checkin(null, 3);
    
    var target = new E.Commit(stage._id);
    target.merge( another, wait());
    wait.then(function(){
        var masterId = target.checkin(null, 4);

        // merge to draft
        stage.getNode().insert(new E.Node({text:'added by A'}), 1).insert(new E.Node({text:'added by A sub'}), 0);
        stage.merge(target, wait());
        stage.loadAllSubs(wait(function(){
            
            var subs = stage.getNode().getSubs();
            console.assert(subs.length == 3, _.pluck(subs, 'text'));
            console.assert(subs[0].text == 'first node', _.pluck(subs, 'text'));
            console.assert(subs[1].text == 'added by B', _.pluck(subs, 'text'));
            console.assert(subs[2].text == 'added by A', _.pluck(subs, 'text'));
            
        }));
    });
    
    // slip
    wait.then(function(){
        // slip last to first node
        var rootNode = stage.getNode();
        var subs = rootNode.getSubs();
        rootNode.insert(subs[subs.length-1], 0);
        var c5 = stage.checkin(null, 5);
        
        // before another merge to c5, it changed
        another.getNode().insert(new E.Node({text:'another 2'}), -1);
        another.checkin(null, 6);
        
        // then merge to another
        another.merge(new E.Commit(c5), wait(function(){
            var c7 = another.checkin(null, 7);
            another.loadAllSubs(E.noop);

            var subs = another.getNode().getSubs();
            console.assert(subs.length == 4, _.pluck(subs, 'text'));
            console.assert(subs[0].text == 'added by B', _.pluck(subs, 'text'));
            console.assert(subs[1].text == 'another 2', _.pluck(subs, 'text'));
            console.assert(subs[2].text == 'added by A', _.pluck(subs, 'text'));
            console.assert(subs[3].text == 'first node', _.pluck(subs, 'text'));
            
            // slip again and only
            var rootNode = stage.getNode();
            var subs = rootNode.getSubs();
            rootNode.insert(subs[subs.length-1], 0);
            var c8 = stage.checkin(null, 8);

            another.merge(new E.Commit(c8), wait(function(another){
                var c9 = another.checkin(null, 9);
                
                var subs = another.getNode().getSubs();
                console.assert(subs.length == 4, _.pluck(subs, 'text'));
                console.assert(subs[0].text == 'added by B', _.pluck(subs, 'text'));
                console.assert(subs[1].text == 'another 2', _.pluck(subs, 'text'));
                console.assert(subs[2].text == 'added by A', _.pluck(subs, 'text'));
                console.assert(subs[3].text == 'first node', _.pluck(subs, 'text'));
                console.assert(c7 != c9, another);
                console.assert(c9 == '32f4229d9beff99a1e19931a2eb42a6cf520b1d3', another);
                
            }));
        }));
    });
    
    
    wait.then(function(){
        //_.each(E.cache.commit, function print(item, key){return console.log(key+'.commit', item.data)});
        //_.each(E.cache.node, function print(item, key){return console.log(key+'.node', item.data)});
    });    
})
}
    
/*    
    // B+ and C+ ; then push to A ; A.draft ; B++ -> A & C++ -> A ; A.checkin 
    wait.then(function(){
        push(treeId, 'A', 'C');
        function insert(user, cb){
            setUser(user);
            var tree = E.Tree.open(treeId);
            tree.loadAndMove(wait(function(){
                var rootNode = tree.getStage().getNode();
                var sub = rootNode.insert(new E.Node({text:'second by '+user}), 0);
                sub.insert(new E.Node({text:'sub by '+user}), 0);
                tree.checkin(wait(function(){
                    push(treeId, user, 'A');
                    cb();
                }));
            }));
        }
        function again(user, cb){
            setUser(user);
            var tree = E.Tree.open(treeId);
            tree.loadAndMove(wait(function(){
                var rootNode = tree.getStage().getNode();
                rootNode.setText(rootNode.text+' ['+user+']');
                rootNode.getSubs().forEach(function(n){
                    var newText = n.text+' ['+user+']';
                    //console.log(n.oid, '"'+n.text+'" -> "'+newText+'"');
                    n.setText(newText);
                });
                var sub = rootNode.insert(new E.Node({text:'again by '+user}), 0);
                tree.checkin(wait(function(){
                    push(treeId, user, 'A');
                    cb();
                }));
            }));
        }
        insert('B', wait(function(){
            insert('C', wait(function(){
                setUser('A');
                var tree = E.Tree.open(treeId);
                tree.load(wait(function(){
                    //console.log(tree.getStage()._id);
                    tree.loadAndMove(wait(function(){
                        var rootNode = tree.getStage().getNode();
                        var subs = rootNode.getSubs();
                        
                        console.assert(subs[0].text == 'added by B', rootNode);
                        console.assert(subs[1].text == 'second by B', rootNode);
                        console.assert(subs[1].getSubs()[0].text == 'sub by B', rootNode);
                        console.assert(subs[2].text == 'second by C', rootNode);
                        console.assert(subs[2].getSubs()[0].text == 'sub by C', rootNode);
                        
//                        subs.forEach(function(sub){
//                            var d = tree.diffins[sub.oid];
//                            console.log(sub.text, sub.oid, d);
//                        });
//                        console.log(tree.diffins);
                        
                        // make draft
                        rootNode.setText('Title');
                        rootNode.insert(new E.Node({text:'final added by A'}), 0);
                        E.Tree.flush(wait(function(){
                            
                            again('B', wait(function(){
                                again('C', wait(function(){
                                    
//                                    tree.checkUpdate(wait(function(isUpdated){
//                                        console.assert(isUpdated, 'No update?');
                                        setUser('A');
                                        tree = E.Tree.open(treeId);
                                        tree.loadAndMove(wait(function(){
                                            var rootNode = tree.getStage().getNode();
                                            var subs = rootNode.getSubs();
                                            
                                            tree.checkin(wait(function(){
                                                var stage = tree.getStage();
                                                var rootNode = stage.getNode();
                                                var subs = rootNode.getSubs();
                                                console.assert(rootNode.text == 'Title [B] [C]', rootNode);
                                                console.assert(subs[0].text == 'final added by A', rootNode);
                                                console.assert(subs[1].text == 'added by B [B] [C]', rootNode);
                                                console.assert(subs.length == 6, rootNode);
                                                console.assert(subs[5].text == 'again by C', rootNode);
                                                
                                                // rootNode merged, and 4 nodes merged, 2 simple income add 
                                                console.assert(Object.keys(stage.log).length == 5, rootNode);
                                                
                                                //console.log(stage.log);
//                                                console.log(rootNode.text);
//                                                subs.forEach(function(sub){
//                                                    console.log(sub.text, sub.oid, tree.diffins[sub.oid]);
//                                                });
//                                                console.log(tree);
                                            }));
                                        }));
//                                    }));
                                    
                                }));
                            }));
                            
                        }));
                        
                    }));
                }));
            }));            
        }));
    });

    // B -> C ; A -> C
    wait.then(function(){
        push(treeId, 'B', 'C');
        setUser('C');
        var tree = E.Tree.open(treeId);
        tree.loadAndMove(wait(function(){
            
            push(treeId, 'A', 'C');
            setUser('C');
            var tree = E.Tree.open(treeId);
            tree.loadAndMove(wait(function(){
                
                var stage = tree.getStage();
                var rootNode = stage.getNode();
                var subs = rootNode.getSubs();
                
                console.assert(rootNode.text == 'Title [B] [C]', rootNode);
                console.assert(subs[0].text == 'final added by A', rootNode);
                console.assert(subs[1].text == 'added by B [B] [C]', rootNode);
                console.assert(subs.length == 6, rootNode);
                console.assert(subs[5].text == 'again by C', rootNode);
                
                console.log(rootNode.text);
                subs.forEach(function(sub){
                    console.log('"'+sub.text+'"', sub.oid, tree.diffins[sub.oid]);
                });
                console.log(tree);
                
            }));

        }));
    });
    
*/