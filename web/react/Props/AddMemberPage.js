/** @jsx React.DOM */
var AddMemberPage = React.createClass({
    mixins: [MyMixin],
    
    componentDidMount: function(dom){
        this.$('acct').on('invalid', this.onInvalid)
    },
    
    render: function() {
        var tree = this.props.tree;
        return (
            <CommonPage className="AddMemberPage" title='Add Member'>
                <div className="container pageMarginTop">                
                    <div className="panel panel-default">
                        <div className="panel-body">
                        
                            <form role="form" onSubmit={this.onSubmit} novalidate="true">
                                <div className="form-group">
                                    <label htmlFor="acct">Email Address</label>
                                    <input ref="acct" id="acct" type="email"
                                        className="form-control" placeholder="your@email.com" multiple="multiple"/>
                                </div>
                                <button type="submit" className="btn btn-success btn-block" style={{marginTop:'25px'}}>Add</button>
                            </form>
                            
                        </div>
                    </div>
                </div>    
            </CommonPage>
        )
    },
    
    onInvalid: function(e){
        this.onSubmit(e);
    },
    
    onSubmit: function(e){
        e.preventDefault();

        var acct = this.refs.acct.state.value;
        var tree = this.props.tree;
        tree.addMember(acct);
        
        main.goBackToTree();
    },
});
