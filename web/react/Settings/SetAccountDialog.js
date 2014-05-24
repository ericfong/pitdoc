/** @jsx React.DOM */
// Must Online
var SetAccountDialog = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var state = this.state || {};
        var mode = state.mode || this.props.mode;
        var account = this.props.account || {};
        return (
        <div className="modal-content">
            <div className="modal-body">
                <form role="form" onSubmit={this.onSubmit}>
                
                    <div className={"form-group"+(state.emailError&&' has-error')}>
                        <label htmlFor="email" className="control-label">Email</label>
                        <input ref="email" type="email" className="form-control" id="email" defaultValue={account.email}/>
                        <span className="help-block">{state.emailError}</span>
                    </div>
                    
                    <div className={"form-group"+(state.passwordError&&' has-error')}>
                        <label htmlFor="password" className="control-label">Password</label>
                        <input ref="password" type="password" className="form-control" id="password" placeholder="6-20 characters"/>
                        <span className="help-block">{state.passwordError}</span>
                    </div>
                    
                    <div className="pull-right">
                        <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                        {' \u00A0 '}
                        {' \u00A0 '}
                        <button type="submit" className={"btn "+(mode == 'Log-In' ? 'btn-primary' : 'btn-success')}>{mode}</button>
                    </div>
                    <button type="button" className={"btn "+(mode == 'Log-In' ? 'btn-success' : 'btn-primary')} onClick={this.switchMode}>{mode == 'Log-In' ? 'Sign-Up' : 'Log-In'}</button>
                </form>
            </div>
        </div>        
        )
    },
    
    componentDidUpdate: function(prevProps, prevState, dom){
        this.$().removeAddClass('render');
    },
    
    switchMode: function(){
        var state = this.state || {};
        var mode = state.mode || this.props.mode;
        this.setState({mode:mode == 'Log-In' ? 'Sign-Up' : 'Log-In'});
    },
    
    onSubmit: function(e){
        var state = this.state || {};
        var mode = state.mode || this.props.mode;
        if (e)
            e.preventDefault();
        
        var email = (this.refs.email.state.value || '').trim().toLowerCase();
        if (!email) {
            this.replaceState({emailError:'Email is empty'});
            return;
        }
        
        var password = (this.refs.password.state.value || '').trim();
        if (password.length < 6 || password.length > 20) {
            this.replaceState({passwordError:'6-20 characters'});
            return null;
        }
        var passkey = password ? E.util.hash(password) : '';
        
        var account = {_id:email, email:email, passkey:passkey};
        
        var server = this.props.server;
        if (mode == 'Sign-Up') {
            server.signup(account, function(output, res){
                if (!output && res.status == 0) {
                    // suddenly offline, also can set Name
                    E.setPitAccount(account);
                    Dialog.close(true);
                } else if (!output) {
                    // other error
                    this.replaceState({passwordError:res.responseText});
                } else if (output != 'OK') {
                    // known error
                    if (output == 'Account Id Used') {
                        if (confirm('Email is registered. Log-In instead?')) {
                            this.setState({mode:'Log-In'});
                            this.onSubmit();
                        } else {
                            this.replaceState({emailError:'Email is registered'});
                        }
                    } else {
                        this.replaceState({emailError:output});
                    }
                } else {
                    // online and login ok
                    E.setPitAccount(account);
                    Dialog.close(true);
                }
            }.bind(this));
        } else {
            server.login(account, function(output, res){
                if (!output && res.status == 0) {
                    // suddenly offline, also can set Name
                    E.setPitAccount(account);
                    Dialog.close(true);
                } else if (!output) {
                    // other error
                    this.replaceState({passwordError:res.responseText});
                } else if (output != 'OK') {
                    // known error
                    if (output == 'Account Id Not Exist') {
                        if (confirm('Email is not registered. Sign-Up instead?')) {
                            this.setState({mode:'Sign-Up'});
                            this.onSubmit();
                        } else {
                            this.replaceState({emailError:'Email is not registered'});
                        }
                    } else if (output == 'Passkey Not Match') {
                        this.replaceState({passwordError:'Passkey Not Match'});
                    } else {
                        this.replaceState({emailError:output});
                    }
                } else {
                    // online and login ok
                    E.setPitAccount(account);
                    Dialog.close(true);
                }
            }.bind(this));
        }
    },
});
