/** @jsx React.DOM */
// Only call this in online
var SetEmailDialog = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var account = this.props.account || {};
        var state = this.state || {};
        return (
        <div className="modal-content">
            <div className="modal-body">
                <form role="form" onSubmit={this.onSubmit}>
                
                    <p>{this.props.instruction}</p>
                
                    <div className={"form-group"+(state.emailError&&' has-error')}>
                        <label htmlFor="email" className="control-label">Email</label>
                        <input ref="email" type="email" className="form-control" id="email" defaultValue={account.email}/>
                        <span className="help-block">{state.emailError}</span>
                    </div>
                    
                    <div className="text-right">
                        <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                        {' \u00A0 '}
                        <button type="submit" className="btn btn-primary">Ok</button>
                    </div>
                </form>
            </div>
        </div>        
        )
    },
    
    onSubmit: function(e){
        e.preventDefault();
        
        var email = (this.refs.email.state.value || '').trim().toLowerCase();
        if (!email) {
            this.replaceState({emailError:'Email is empty'});
            return;
        }
        
        var account = this.props.account || {};
        account.email = email;
        E.setPitAccount(account);
        Dialog.close(true);
    },
});
