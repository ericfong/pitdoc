/** @jsx React.DOM */
// Only when Online
var SetPasswordDialog = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var state = this.state || {};
        var account = this.props.account;
        return (
        <div className="modal-content">
            <div className="modal-body">
                <form role="form" onSubmit={this.onSubmit}>
                    
                    <div>
                        <div className={"form-group"+(state.passwordOldError&&' has-error')+(account.passkey?'':' hidden')}>
                            <label htmlFor="passwordOld" className="control-label">Old password</label>
                            <input ref="passwordOld" type="password" className="form-control" id="passwordOld" placeholder="6-20 characters"/>
                            <span className="help-block">{state.passwordOldError}</span>
                        </div>
                    
                        <div className={"form-group"+(state.passwordError&&' has-error')}>
                            <label htmlFor="password" className="control-label">New password</label>
                            <input ref="password" type="password" className="form-control" id="password" placeholder="6-20 characters"/>
                            <span className="help-block">{state.passwordError}</span>
                        </div>
                        <div className={"form-group"+(state.password2NotMatch&&' has-error')}>
                            <input ref="password2" type="password" className="form-control" id="password2" placeholder="Re-confirm your password"/>
                            <span className="help-block">{state.password2NotMatch && 'Not Match'}</span>
                        </div>
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
        
        var passwordOld = (this.refs.passwordOld.state.value || '').trim();
        var password = (this.refs.password.state.value || '').trim();
        var password2 = (this.refs.password2.state.value || '').trim();
        
        if (password.length < 6 || password.length > 20) {
            this.replaceState({passwordError:'6-20 characters'});
            return null;
        }
        if (password != password2) {
            this.replaceState({password2NotMatch:true});
            return null; 
        } 
        
        var passkeyOld = passwordOld ? E.util.hash(passwordOld) : '';
        var passkey = password ? E.util.hash(password) : '';

        
        var account = this.props.account;
        account.passkey = passkey;
        
        var server = this.props.server;
        server.send('/setAccountPass', {accountId:account._id, passkey:passkey, passkeyOld:passkeyOld}, function(output, resHeaders){
            if (!output && res.status == 0) {
                // suddenly offline, also can set Name
                E.setPitAccount(account);
                Dialog.close();
            } else if (!output) {
                // other error
                this.replaceState({passwordOldError:res.responseText});
            } else if (output != 'OK') {
                // known error
                this.replaceState({passwordOldError:output});
            } else {
                // online and change password ok
                E.setPitAccount(account);
                // reconnect?
                server.connect(null, function(){
                    Dialog.close();
                });
            }
        }.bind(this));
    },
});
