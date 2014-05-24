/** @jsx React.DOM */
var Dialog = React.createClass({
    mixins: [MyMixin],

    render: function() {
        var comp = this.props.comp;
        return <div className="modal-dialog"><div className="container">{comp}</div></div>;
        
//        var content = null;
//        if (this.props.content) {
//            content = this.props.content;
//        } else {
//            if (this.props.title) {
//                this.props.header = <div className="modal-header"><button type="button" className="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 className="modal-title">{this.props.title}</h4></div>;
//            }
//            
//            if (typeof this.props.header == 'string')
//                this.props.header = <div className="modal-header">{this.props.header}</div>;
//            if (typeof this.props.body == 'string')
//                this.props.body = <div className="modal-body">{this.props.body}</div>;
//            if (typeof this.props.footer == 'string')
//                this.props.footer = <div className="modal-footer">{this.props.footer}</div>;
//            content = (
//                    <div className="modal-content">
//                        {this.props.header}
//                        {this.props.body}
//                        {this.props.footer}
//                    </div>
//                    );
//        }
//        return <div className="modal-dialog">{content}</div>;
    },
});
Dialog.open = function(comp, cb, context){
    if (Dialog.el) {
        Dialog.el.modal('hide');
    }
    
    var props = {};
    if (React.isValidComponent(comp)) {
        props.comp = comp;
    }
    
    var modalEl = Dialog.el = $('<div class="modal fade" role="dialog" aria-labelledby="Dialog" aria-hidden="true" tabindex="-1"></div>').appendTo(document.body);
    modalEl.on('hide.bs.modal', function(){
        React.unmountComponentAtNode(modalEl.get(0));
        modalEl.remove();
        var returnArguments = Dialog.returnArguments;
        Dialog.returnArguments = null;
        Dialog.el = null;
        Dialog.comp = null;
        if (cb)
            cb.apply(context, returnArguments);
    });
    Dialog.comp = React.renderComponent(Dialog(props), modalEl.get(0), function(a, b){
        if (modalEl.find('input, form').length == 0) {
            modalEl.find('.modal-dialog').addClass('modal-vertical-centered');
        } else {
            modalEl.find('.modal-dialog').addClass('modal-fullwidth');
        }
        modalEl.modal('show');
    });
}
//Dialog.prompt = function(comp, cb){
//}
Dialog.close = function(){
    if (Dialog.el) {
        Dialog.returnArguments = arguments;
        Dialog.el.modal('hide');
    }
}