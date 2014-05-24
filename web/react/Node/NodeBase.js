/** @jsx React.DOM */

var NodeBase = _.extend({}, MyMixin, {
    
    isNode: true,
    
    renderWrap: function(content) {
        var node = this.props.node;
        var level = this.props.level;
        var state = this.state || {};
        
//        var subs = node.getSubs();
//        var subDoms = null;
//        if (subs.length > 0) {
//            subDoms = subs.map(function(node){
//                return NodeText({node:node, level:level+1, key:node.oid});
//            }.bind(this));
//        }
//        <div className="node-subs">{subDoms}</div>
        
        return (
            <div className="NodeBase node" data-ref={this.props.dataRef} data-level={level} style={{marginLeft:(level*30)+'px'}}>
                <button className="node-point btn btn-link" tabIndex="-1" onClick={this.onDot}>
                    <span className={"fa fa-fw " + (state.isSelected ? 'fa-check-circle-o' : 'fa-circle')}></span>
                </button> 
                {content}
            </div>
            )
    },
    
    onDot: function(){
        var node = this.props.node;
        var dom = (
            <div className="modal-content">
                <div className="list-group" style={{margin:0}}>
                    <a href="#" className="list-group-item" onClick={_.partial(Dialog.close,'REMOVE')}>Remove</a>
                </div>                
            </div>    
            );
        Dialog.open(dom, function(action){
            if (action == 'REMOVE') {
                console.log(action);
                node.detach();
            }
        }.bind(this));
    },
});
