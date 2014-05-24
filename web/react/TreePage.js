/** @jsx React.DOM */

var TreePage = React.createClass({
    mixins: [MyMixin],
    
    getInitialState: function(){return {}},
    componentDidMount: function(){
        var tree = this.props.tree;
        if (tree) {
            E.Server.setWatch(tree._id);
            E.Server.pollAll(function(){
                tree.mergeMasters(function(){
                    this.setState({node:tree.master.getNode()});
                }.bind(this));
            }.bind(this));
            if (window.isDev)
                window.tree = tree;
        }
    },
    
    render: function() {
        var state = this.state || {};
        var tree = this.props.tree;
        var master = tree && tree.master;
        var node = state.node;
        var title = (node && node.getText()) || 'No Title';
        
        var maxLevel = this._findMaxLevel(node, 0);
        var keys = {};
        var subDoms = [];
        this.renderAllSubs(subDoms, node, 0, maxLevel, keys);
        
        if (subDoms.length == 0) {
            subDoms.push( <div key="empty" className="alert alert-warning"><strong>Empty!</strong> Not yet have any Upload?</div> );
        }
        
        document.title = title;
        return (
            <section className="ViewTree">
        
            {TreeNavBar({ref:"navBar", page:this, tree:tree, node:node})}
            
            <div className="container">
                <div className="paper">
                    <header>
                    </header>
                    <div className="content" onFocus={this.onFocus} onBlur={this.onBlur} >
                        <div className="h1 page-header">
                            <div className="text-muted header-control">
                                {master && React.timeAbsString(master.getTime())} 
                            </div>                        
                            {title}
                        </div>
                        <div ref="list" className="list">
                            {subDoms}
                        </div>
                    </div>
                    <footer className="text-right">
                    </footer>
                </div>
            </div>
            </section>
        )
        /*
                                {' \u2022 '} 
                        {this.transferPropsTo(TreeMemberList())}
        <small className="text-muted slogan">Work Together Even Server Is Down</small>
         */
    },
    
    _findMaxLevel: function(node, level){
        if (!node) return;
        var myRet = level;
        node.getSubs().forEach(function(node){
            var subRet = this._findMaxLevel(node, level+1);
            if (subRet > myRet)
                myRet = subRet;
        }.bind(this));
        return myRet;
    },

    renderAllSubs: function(subDoms, node, level, maxLevel, keys){
        if (!node) return;
        var subLevel = level+1;
        var isLeaf = true;
        node.getSubs().forEach(function(node){
            var index = subDoms.length;
            
            var key = node.oid;
            while (keys[key])
                key += ''+Math.random();
            keys[key] = true;
            
            var subSubs = node.getSubs();
            if (isLeaf && subSubs.length == 0) {
                subDoms[index] = <p key={key} data-level={subLevel}>{node.getText()}</p>; 
            } else {
                isLeaf = false;
                var fontCss = subLevel >= maxLevel ? '' : 'h'+Math.min(4, subLevel + Math.max(0, 5 - maxLevel));
                subDoms[index] = <div key={key} className={fontCss} data-level={subLevel}>{node.getText()}</div>; 
                //({node:node, key:key, level:level, ref:'child_'+index, dataRef:'child_'+index, showDraftOut:showDraftOut});
                this.renderAllSubs(subDoms, node, subLevel, maxLevel, keys);
            }
        }.bind(this));
    },
});
