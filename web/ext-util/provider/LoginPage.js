/** @jsx React.DOM */
var LoginPage = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        return (
            <section className="LoginPage" style={{padding:'10px'}}>
                <form role="form" onSubmit={this.onSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input ref="username" type="text" className="form-control" id="username" placeholder="Username" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input ref="password" type="password" className="form-control" id="password" placeholder="Password" />
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <button type="submit" className="btn btn-primary btn-block">Log-In</button>
                        </div>
                    </div>
                </form>
            </section>
        )
    },
    
    onSubmit: function(e){
        e.preventDefault();

        var username = this.refs.username.state.value;
        var password = this.refs.password.state.value;
        E.loginWith('/@'+username, E.util.hash(password), function(result){
            if (result) {
                main.showLoading();
                location.reload();
            } else {
                alert('Login Fail');
            }
        });
    },
    
});
