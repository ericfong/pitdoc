/** @jsx React.DOM */
var CommonPage = React.createClass({
    render: function() {
        if (this.props.title)
            document.title = this.props.title;
        return this.transferPropsTo(
            <section>
                <nav className="navbar-base">
                    <div className="navbar navbar-default navbar-fixed-top">
                        <div className="container">
                        
                            <div className="navbar-header pull-left">
                                <button className="btn btn-link navbar-btn" onClick={main.goBack}><span className="fa fa-chevron-left"></span></button>
                            </div>
                            
                            {this.props.navRight && <div className="navbar-header pull-right">this.props.navRight</div>}
                            
                            <div className="abs-center title">{this.props.title}</div>
                            
                        </div>
                    </div>
                </nav>
                {this.props.children}
            </section>
                    );
    },
});
