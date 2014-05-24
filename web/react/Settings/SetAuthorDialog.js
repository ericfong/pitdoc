/** @jsx React.DOM */
var SetAuthorDialog = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var state = this.state || {};
        return (
        <div className="modal-content">
            <div className="modal-body">
                <form role="form" onSubmit={this.onSubmit}>
                
                    <div className="form-group" style={{marginTop:'15px'}}>
                        <label htmlFor="name">Name</label>
                        <input ref="name" type="text" className="form-control" id="name" placeholder="Peter" defaultValue={this.props.name} />
                    </div>
                    
                    <div className={"form-group"+(state.emailError&&' has-error')} style={{marginTop:'15px'}}>
                        <label htmlFor="email">Email</label>
                        <input ref="email" type="email" className="form-control" id="email" placeholder="peter@email.com" defaultValue={this.props.email} />
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
        var name = (this.refs.name.state.value || '').trim();
        var email = (this.refs.email.state.value || '').trim().toLowerCase();
        
        if (!email && !name)
            return this.replaceState({emailError:'Input your name or email please'});

        if (!name)
            name = email.substring(0, email.indexOf('@'))
        
        var id = email || name.toLowerCase();
        var author = {email:email, name:name};
        E.setAuthor(id, author);
        
        Dialog.close(id, author);
    },
});
