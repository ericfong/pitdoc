Main.main = function(){
localStorage.clear();
E.loopInterval = 0;
var num = 0;
E.util.genOid = function(){
    return 'oid'+(num++);
}
E.ready(function(){
    var wait = new Wait();

    var master = new E.Commit({
        node:{
            text:'Title',
            subs:[{
                text:'A',
            }, {
                text:'B',
            }, {
                text:'C',
            }]
        }
    });
    master.checkin(null, 1);
    
    var s1 = new E.Commit(master._id);
    s1.loadAllSubs(E.noop);
    s1.getNode().getSubs()[2].setText('C1');
    s1.getNode().insert(new E.Node({text:'D'}), 0);
    s1.getNode().remove(1);
    s1.getNode().remove(1);
    var s1texts = JSON.stringify(_.pluck(s1.node.subs, 'text'));
    
    var s2 = new E.Commit(master._id);
    s2.loadAllSubs(E.noop);
    s2.getNode().getSubs()[0].setText('A2');
    s2.getNode().getSubs()[2].setText('C2');
    s2.getNode().insert(new E.Node({text:'E'}), 3);
    s2.getNode().remove(1);
    var s1texts = JSON.stringify(_.pluck(s2.node.subs, 'text'));

    var s3 = new E.Commit(s1.toData());
    s3.merge(s2, wait(function(s3){
        var s1_s2 = JSON.stringify(_.pluck(s3.node.subs, 'text'));
        console.assert(s1_s2 == '["A2","D","C21","E"]', s1_s2);
        
        var s4 = new E.Commit(s2.toData());
        s4.merge(s1, wait(function(s4){
            var s2_s1 = JSON.stringify(_.pluck(s4.node.subs, 'text'));
            console.assert(s2_s1 == '["D","A2","C12","E"]', s2_s1);
        }));
        
    }));
    
    wait.then(function(){
        //_.each(E.cache.commit, function print(item, key){return console.log(key+'.commit', item.data)});
        //_.each(E.cache.node, function print(item, key){return console.log(key+'.node', item.data)});
        console.log('All Done');
    });    
})
}