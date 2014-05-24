/** @jsx React.DOM */

var NotFoundPage = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        document.title = 'Not Found';
        return (
            <section className="NotFoundPage">
                <div className="alert alert-warning">
                    <h1>Not Found!</h1> 
                    <br/>
                    <p>Please check the url.</p> 
                    <p>Or you want to <a href="#/">go back to the Home page</a>.</p> 
                </div>
            </section>
        )
    },
    
});
