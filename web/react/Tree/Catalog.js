/** @jsx React.DOM */
var Catalog = React.createClass({
    mixins: [MyMixin],
    render: function() {
        var doms = [];
        if (E.trees) {
            // grouped by memberStr
            var groups = _.groupBy(E.trees, function(tree){
                return _.compact( Object.keys(tree.getMembers()) ).sort().join(', ');
            });
            _.each(groups, function(treeArr, grouping){
                treeArr = treeArr.sort(E.util.timeSorter);
                doms.push(
                        <div key={grouping}>
                            <h5>{grouping}</h5>
                            <div className="list-group">
                                {treeArr.map(this.renderTree)}
                            </div>
                        </div>
                        );
            }, this)
        }
        
        return (
            <div id="catalogMenu" className="Catalog" ref="menu">
                {doms}
            </div>
        )
    },
    
    renderTree: function(tree) {
        var pendingCount = tree.getPendingCount(); 
        //var pending = pendingCount >= 1 ? (<span className="badge badge-danger">{pendingCount}</span>) : null; //+' '+(pendingCount>1?'unreads':'unread')
        
        return (
            <a href={React.localUrl+'#'+tree._id} key={tree._id} className="list-group-item" onClick={this.props.onCloseInbox}>
                <span className="badge">{pendingCount >= 1 ? pendingCount : null}</span>
                {tree&&tree.getName() || 'No Title'}
            </a>
                );
    },
    
    renderMembers: function(tree){
        var names = [];
        var otherCount = 0;
        _.each(tree.getMembers(), function(member, id){
            if (names.length < 2) {
                //names.push(acct.substr(0, acct.indexOf('@')));
                names.push(member.name || member.email);
            } else {
                otherCount ++;
            }
        });
        var nameStrs = names.join(', ');
        if (otherCount > 0) {
            nameStrs += ' and '+otherCount+' others';
        }
        return nameStrs; 
    },
});
