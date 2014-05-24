/** @jsx React.DOM */

var NodeText = React.createClass({
    mixins: [NodeBase],
    
    render: function() {
        return this.renderWrap(
                <div className="NodeText node-content">
                    <Text ref="text" node={this.props.node} showDraftOut={this.props.showDraftOut} placeholder="add point"
                    ></Text>
                </div>
                );
        /*
                        onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} 
                        onChange={this.onChange} onFocus={this.onFocus} onBlur={this.onBlur}
        {React.if(node.getSubs().length > 0, <button id="open-child" href="#{{node_path}}" className="btn btn-link"><i className="glyphicon glyphicon-chevron-right"></i></button> )}
        onKeyboard={this.onKeyboard} 
         */        
    },
    
//    focus: function() {
//        this.refs.text.focus();
//    },

//    onFocus: function(e){
//        this.focused = Date.now();
//        this.props.onFocus(this, e);
//    },
//    onBlur: function(e){
////        this.focused = false;
////        this.props.onBlur(this, e);
//        
//        this._dom2node();
//    },
//    
//    onChange: function(e){
//        if (this._dom2nodeTimer)
//            return;
//        this._dom2nodeTimer = setTimeout(this._dom2node, 2000);
//    },
//    
//    _dom2node: function(){
//        this._dom2nodeTimer = null;
//        var value = this.refs.text.getDomValue();
//        if (!value || value.trim() == '')
//            value = '';
//        var node = this.props.node;
//        if (value != node.text) {
//            console.log('_dom2node '+value);
//            node.setText(value);
//        }
//    },
});
