/** @jsx React.DOM */
var AddAccountPage = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var type = this.state && this.state.type;
        return (
            <CommonPage className="AddAccountPage" backHref={location.hash} title='Add Account'>
            {
                React.if(type == 'other', (
                        
                    <div key="other" className="pagePadding">
                        <div className="panel panel-default">
                            <div className="panel-body">
                                <form role="form" onSubmit={this.onSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="domain">Pith Service Provider</label>
                                        <input ref="domain" id="domain" type="text" className="form-control" placeholder="mystore.pithway.com" defaultValue="localhost:8888" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input ref="username" type="text" className="form-control" id="username" placeholder="Username" defaultValue="eric" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input ref="password" type="password" className="form-control" id="password" placeholder="Password" defaultValue="eric" />
                                    </div>
                                    <button type="submit" className="btn btn-success btn-block" onClick={this.onOtherLogin} style={{marginTop:'25px'}}>Log-In a Existing Account</button>
                                    <br/>
                                    <button type="button" className="btn btn-default btn-block" onClick={this.onOtherSignup}>Sign-Up a New Account</button>
                                </form>
                            </div>
                        </div>
                        
                        <br/>
                        <button className="btn btn-default btn-block" onClick={this.onGoPithway}>Add pithway.com Account</button>
                    </div>
                    
                ), (
                        
                    <div key="pithway" className="pagePadding">
                        <div className="panel panel-default">
                            <div className="panel-body">
                                <form role="form" onSubmit={this.onLogin}>
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input ref="username" type="text" className="form-control" id="username" placeholder="Username" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input ref="password" type="password" className="form-control" id="password" placeholder="Password" />
                                    </div>
                                    <button type="submit" className="btn btn-success btn-block" style={{marginTop:'25px'}}>Log-In a Existing Account</button>
                                    <br/>
                                    <button type="button" className="btn btn-default btn-block" onClick={this.onPithwaySignup}>Sign-Up a New Account</button>
                                </form>
                            </div>
                        </div>
                        
                        <br/>
                        <button className="btn btn-default btn-block" onClick={this.onGoOther}>Other Pith Service Providers</button>
                    </div>
                    
                ))
                }
            </CommonPage>
        )
    },
    
    onGoOther: function(){
        this.setState({type:'other'});
    },
    onGoPithway: function(){
        this.setState({type:'pithway'});
    },

    onOtherLogin: function(){
        var url = this.refs.domain.state.value;
        var username = this.refs.username.state.value;
        var password = this.refs.password.state.value;
        E.loginWith(url+'/@'+username, E.util.hash(password), function(result){
            if (result) {
                main.go('/Settings');
            } else {
                alert('Login Fail');
            }
        });
    },
    onOtherSignup: function(){
        alert("Not Support Yet");
    },
    
    onLogin: function(e){
        e.preventDefault();
        var username = this.refs.username.state.value;
        var password = this.refs.password.state.value;
        if (!username || !password) {
            alert('Username and Password cannot be empty!');
            return;
        }
        E.loginWith('http://www.pithway.com/@'+username, E.util.hash(password), function(result){
            if (result) {
                E.save();
                main.go('/Settings');
            }
        });
    },
    onPithwaySignup: function(){
        alert("Not Support Yet");
    },
    
});
