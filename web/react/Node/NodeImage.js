/** @jsx React.DOM */

var NodeImage = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var node = this.props.node;
        return (
            <section className="NodeImage">
                <div className="image-frame">
                    <img src={node.getFileDataUrl()} />
                </div>
                <div className="text">{node.text}</div>
            </section>                
                );
    },

    componentDidMount: function(){
//        if (this.state.isFile()) {
//            // android webview is slow, listen the image loading
//            this.el.find('img').on('load', function(){
//                this.height = parseFloat(this.el.css('height'));
//                this.owner().onChildResized(this);            
//            }.bind(this));
//        }
    },
    componentDidUpdate: function(){
//        if (this.state.isFile()) {
//            // android webview is slow
//            this.el.find('img').on('load', function(){
//                this.height = parseFloat(this.el.css('height'));
//                this.owner().onChildResized(this);            
//            }.bind(this));
//        }
    },
});
