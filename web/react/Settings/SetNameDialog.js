/** @jsx React.DOM */
var SetNameDialog = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var account = this.props.account;
        var state = this.state || {};
        return (
        <div className="modal-content">
            <div className="modal-body">
                <form role="form" onSubmit={this.onSubmit}>
                
                    <div className={"form-group"+(state.error&&' has-error')}>
                        <label htmlFor="name" className="control-label">Name</label>
                        <input ref="name" type="text" className="form-control" id="name" defaultValue={account.name}/>
                        <span className="help-block">{state.error}</span>
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
        var server = this.props.server;
        var account = this.props.account;
        // prevent http submit    
        e.preventDefault();
        var name = (this.refs.name.state.value || '').trim();
        
        if (name.length < 1 || name.length > 20)
            return this.replaceState({error:'1-20 characters'});
        
        account.name = name;
        E.setPitAccount(account);
        // try to connect and update the server data
        //server.connect(null, E.noop);
        // offline, also can set Name
        Dialog.close();
    },
});
