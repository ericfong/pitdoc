/** @jsx React.DOM */

var EditTreePage = React.createClass({
    mixins: [MyMixin, EditTreePage],
    
    getInitialState: function(){return {}},
    componentDidMount: function(){
        var tree = this.props.tree;
        if (tree) {
            if (window.isDev)
                window.tree = tree;
            tree.open(this.rerender);
            tree.on('newMembers', this.rerender);
            tree.on('stageUpdated', this.rerender);
            tree.on('masterUpdated', this.rerender);
            
            tree.on('draft', this.rerender);
            tree.on('change', this.rerender);
        }
        
        $('body').addClass('EditTreePage');
    },
    componentWillUnmount: function(){
        var tree = this.props.tree;
        if (tree) {
            tree.off('newMembers', this.rerender);
            tree.off('stageUpdated', this.rerender);
            tree.off('masterUpdated', this.rerender);
            
            tree.off('draft', this.rerender);
            tree.off('change', this.rerender);
        }
        $('body').removeClass('EditTreePage');
    },
    rerender: function(){
        // forceUpdate will skip shouldComponentUpdate, cannot control the updating during slip
        this.replaceState(this.state);
    },
    
    shouldComponentUpdate: function(nextProps, nextState) {
        return !this._isSlipReordering;
    },
    
    render: function() {
        var state = this.state || {};
        var tree = this.props.tree;
        var node = this.getRootNode();
        
        if (node && node.getSubs().length == 0) {
            node.insert(new E.Node({}), 0);
        }
        
//        if (tree && tree.isLoaded() && tree.isNotFound())
//            return NotFoundPage(); 
        //console.log('Tree.render', this.props.key, tree, node);
        
        var option = this.props.option;
        var isEditing = option == 'edit'; 
            
        document.title = (tree && tree.getName()) || 'No Title';
        
        var keys = {};
        var subDoms = [];
        var hasOtherMembers = tree && tree.hasOtherMembers();
        hasOtherMembers = false;
        this.renderAllSubs(subDoms, node, 0, hasOtherMembers, keys);
        
        return (
            <section className="EditTreePage">
            
                {TreeEditBar({ref:"navBar", tree:tree})}
                
            <div className="container paperContainer">
            
                <div className="paper">
                    <header>
                    </header>
                    <div className="content" onFocus={this.onFocus} onBlur={this.onBlur} >
                        <div className="h1 page-header">
                            <Text ref="text" node={node} placeholder="No Title" showDraftOut={hasOtherMembers}></Text>
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
                        {this.transferPropsTo(TreeMemberList())}
                        <small className="text-muted slogan">Work Together Even Server Is Down</small>
                <div className="keyboardPlaceholder"></div>
         */
    },
    
    getRootNode: function(){
        var tree = this.props.tree;
        return tree && tree.stage.getNode();
    },
    
    onFocus: function(e){
        this.focusAt = Date.now();
    },
    onBlur: function(e){
        this.focusAt = null;
        if (this._onBlurCb) {
            var cb = this._onBlurCb;
            delete this._onBlurCb;
            cb();
        }
    },
    afterBlur: function(cb){
        if (!this.focusAt)
            return cb();
        this._onBlurCb = cb;
    },
    
    /*
    remoteNewMaster: function(){
        var tree = this.props.tree;
        // TODO: UI, indicate
        this.afterBlur(function(){
            // the problem of update from few E.Servers
            tree.mergeRemotes(function(){
                var node = tree.getNode(this.props.nodeOid);                
                this.setState({node:node});
            }.bind(this));
            //this.loadAndMove(tree, this.props.nodeOid);
        }.bind(this));
    },
     */
//    onBulkEdit: function(enable){
//        this.setState({isEdit:enable});
//    },
//    onChildSelect: function(child){
//        if (!this.state.isEdit) {
//            this.setState({isEdit:true});
//        }
//    },
});
//if (this.isJustMount) {
//console.log('isJustMount');
//var firstText = this.el.find('.list .text').get(0);
//if (firstText) {
//  firstText.selectionStart = firstText.selectionEnd = firstText.value.length; 
//  firstText.focus();
//}
//}
