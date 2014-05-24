/** @jsx React.DOM */

var AccountsPage = React.createClass({
    mixins: [MyMixin],
    
    componentDidMount: function(){
        _.each(E._servers, function(server){
            server.on('online', this.onOnlineChange);
        }, this)
    },
    componentWillUnmount: function(){
        _.each(E._servers, function(server){
            server.off('online', this.onOnlineChange);
        }, this)
    },
    onOnlineChange: function(){
        this.forceUpdate();
    },
    
    render: function() {
        var server = E.getPithwayServer();
        var isOnline = server.isOnline();
        var account = E.getPitAccount() || {};
        var body = null, list = null;
        if (isOnline) {
            
            if (account._id) {
                var status = server.getLoginStatus();
                if (status == 'OK') {
                    body = <div className="panel-body">Log-In with {account._id}</div>;
                    list = (
                            <div className="list-group">
                                <a href="#" className="list-group-item" onClick={this.onLogOut}>
                                    Email <span className="text-primary pull-right">{account.email}{'\u00A0'}<span className="fa fa-chevron-right"/></span>
                                </a>
                                <a href="#" className="list-group-item" onClick={this.onSetPassword}>
                                    Change password <span className="text-primary pull-right"><span className="fa fa-chevron-right"/></span>
                                </a>
                            </div>
                                );
                } else {
                    // login fail
                    body = <div className="panel-body">Log-In fail for {account._id}</div>;
                    list = (
                            <div className="list-group">
                                <li className="list-group-item list-group-item-danger">{status}</li>
                                <a href="#" className="list-group-item" onClick={this.onLogIn}>
                                    Change password <span className="text-primary pull-right"><span className="fa fa-chevron-right"/></span>
                                </a>
                                <a href="#" className="list-group-item" onClick={this.onSignUp}>
                                    Sign-Up a new account<span className="text-primary pull-right"><span className="fa fa-chevron-right"/></span>
                                </a>
                            </div>
                                );
                } 
            } else {
                body = <div className="panel-body">Log-In or Sign-Up to auto-merge with others</div>;
                list = (
                        <div className="list-group">
                            <a href="#" className="list-group-item" onClick={this.onLogIn}>
                                Log-In <span className="text-primary pull-right"><span className="fa fa-chevron-right"/></span>
                            </a>
                            <a href="#" className="list-group-item" onClick={this.onSignUp}>
                                Sign-Up <span className="text-primary pull-right"><span className="fa fa-chevron-right"/></span>
                            </a>
                        </div>
                            );
            }
            
        } else {
            
            if (account._id) {
                //body = <div className="panel-body">Cannot access the server at this moment</div>;
                list = (
                        <div className="list-group">
                            <a href="#" className="list-group-item" onClick={this.onRemoveEmail}>
                                Email <span className="text-primary pull-right">{account.email}{'\u00A0'}<span className="fa fa-chevron-right"/></span>
                            </a>
                        </div>
                            );
            } else {
                body = <div className="panel-body">Setup email for identification of your notes</div>;
                list = (
                        <div className="list-group">
                            <a href="#" className="list-group-item" onClick={this.onSetEmail}>
                                Email <span className="text-primary pull-right">{account.email}{'\u00A0'}<span className="fa fa-chevron-right"/></span>
                            </a>
                        </div>
                            );
            }
            
        } 
        return (
            <CommonPage className="AccountsPage" title='Account'>
                <div className="container pageMarginTop">
                    <div className="panel panel-primary">
                        <div className="panel-heading">{server.getName()}</div>
                        {body}
                        {list}
                    </div>
                </div>
            </CommonPage>
        )
        /*
        <a href="#" className="list-group-item" onClick={this.onSetName}>
            Name <span className="text-primary pull-right">{account.name}{'\u00A0'}<span className="fa fa-chevron-right"/></span>
        </a>
         */
    },
    
    // Online Only
    onLogIn: function(){
        Dialog.open(SetAccountDialog({server:E.getPithwayServer(), account:E.getPitAccount(), mode:'Log-In'}), function(){
            this.forceUpdate();
        }.bind(this));
    },
    // Online Only
    onSignUp: function(){
        Dialog.open(SetAccountDialog({server:E.getPithwayServer(), mode:'Sign-Up'}), function(){
            this.forceUpdate();
        }.bind(this));
    },
    // Online Only
    onSetPassword: function(){
        var server = E.getPithwayServer();
        var account = E.getPitAccount();
        // onConnect will call forceUpdate
        Dialog.open(SetPasswordDialog({server:server, account:account}));
    },
    // Online Only
    onLogOut: function(){
        if (confirm('Want to logout?')) {
            var server = E.getPithwayServer();
            E.setPitAccount(null);
            server.connect(null, E.noop);
            this.forceUpdate();
        }
    },
    
    
    // Offline Only
    onSetEmail: function(){
        var server = E.getPithwayServer();
        Dialog.open(SetEmailDialog({account:E.getPitAccount()}), function(){
            if (server.isOnline()) {
                // suddenly online
                this.onLogIn();
            } else {
                this.forceUpdate();
            }
        }.bind(this));
    },
    onRemoveEmail: function(){
        if (confirm('Remove this email?')) {
            E.setPitAccount(null);
            this.forceUpdate();
        }
    },
    
    
    // Both
    onSetName: function(){
        var server = E.getPithwayServer();
        var account = E.getPitAccount();
        Dialog.open(SetNameDialog({server:server, account:account}), function(){
            this.forceUpdate();
        }.bind(this));
    },
});

AccountsPage.setEmail = function(instruction, cb){
    Dialog.open(SetEmailDialog({instruction:instruction}), function(submited){
        if (submited) {
            var server = E.getPithwayServer();
            var account = E.getPitAccount();
            server.loginOrSignup(account, function(){
                if (cb) cb(submited);
            });
            return;
        }
        if (cb) cb(submited);
    });
}

AccountsPage.ensureAccount = function(cb){
    var server = E.getPithwayServer();
    var account = E.getPitAccount() || {};
    if (server && server.isOnline()) {
        
        if (account._id) {
            
            if (server.getLoginStatus() == 'OK') {
                cb(true);
            } else {
                Dialog.open(SetAccountDialog({server:server, account:account, mode:'Log-In'}), cb);
            }
            
        } else {
            Dialog.open(SetAccountDialog({server:server, account:account, mode:'Log-In'}), cb);
        }
        
    } else {
        
        Dialog.open(SetEmailDialog({server:server, account:account}), function(submited){
            if (submited && server.isOnline()) {
                // suddenly online
                AccountsPage.ensureAccount(cb);
            } else {
                cb(submited);
            }
        });
        
    }    
}
