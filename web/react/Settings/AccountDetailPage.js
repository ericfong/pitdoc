/** @jsx React.DOM */
var AccountDetailPage = React.createClass({
    mixins: [MyMixin],
    
    componentDidMount: function(dom){
        window.addEventListener('resize', this.onResize);
        this.onResize();
    },
    componentWillUnmount: function(dom){
        window.removeEventListener('resize', this.onResize);
    },
    
    onResize: function(){
        this.$('iframe')
        .attr('frameborder', '0')
        .attr('seamless', 'true')
        .height( $(window).height() - 50 );
    },
    
    render: function() {
        var acct = this.props.acct;
        var account = E.accounts[acct];
        document.title = acct;
//                        
        
        return (
            <CommonPage className="AccountDetailPage" backHref={location.hash} title={acct}>
                <iframe ref="iframe" src="http://1.1.1.10:8080"  style={{width:'100%', height:'100%'}}></iframe>
            </CommonPage>
        )
    },
});
