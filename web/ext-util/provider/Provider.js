/** @jsx React.DOM */
var Provider = React.createClass({
    render: function() {
        return (
            <section>
                Hello World
            </section>
                    );
    },
});
Provider.render = function(){
    FastClick.attach(document.body);
    React.initializeTouchEvents(true);
    React.renderComponent( Provider(), document.body);
}