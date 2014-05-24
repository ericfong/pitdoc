/** @jsx React.DOM */
(function(global) {

global.Main = React.createClass({
    mixins: [MyMixin],
    
    getInitialState: function(){
        return {};
    },
    componentWillMount: function(){
        this.treeProps = {ref:'tree', key:'null'};
        this.renderred = [];
        global.main = this;
    },
    componentDidMount: function(){
        FastClick.attach(document.body);
        E.ready(function(){
//            if (!location.hash) {
//                E.get('private/ui.json', wait(function(ui){
//                    var savedUri = (ui && ui.uriStr) || '';
//                    if (savedUri) {
//                        location.hash = savedUri;
//                    } 
//                }));
//            }
            
            if (location.pathname.indexOf('/view-') == 0) {
                main.isServerUrl = true;
                main.go( location.pathname.substr('/view-'.length) );
            } else {
                main.go( location.hash );
            }
            
            // all event after first real route
            $(document).delegate('[href]', "click", function(e){
                var el = $(e.currentTarget);
                var href = el.attr('href');
                if (!href) return;
                if (href == '#') {
                    e.preventDefault();
                    return;
                }
                var uri = new URI(href);
                var uriPathname = uri.pathname();
                
                if (E.isAppClient) {
                    var target = el.attr('target');
                    if (target == '_blank' || target == '_system' || uri.host()) {
                        window.open(href, '_system');
                        e.preventDefault();
                        return;
                    }
                }
                
                if (!uriPathname || uriPathname == location.pathname) {
                    main.go(uri.hash(), true);
                } else if (e.target.tagName.toUpperCase() != 'A') {
                    location.href = href;
                }
            });
            $(window).on({
                'hashchange': function(e){        
                    main.go(location.hash);
                },
                'beforeunload': function(e) {
                    // trigger focus element blur, so that make it saved before unload
                    if (document.activeElement) document.activeElement.blur();
                    
                    if (E.saveFlush()) 
                        return 'It is saving. Are you sure you want to leave?';
                },
            });
            
            E.on('tableChanged', function(){
                main.setState({});
            })
            E.on('tableUpdated', function(){
                main.setState({});
            })
            
        });        
    },
    
    go: function(uriStr, force) {
        uriStr = uriStr ? _.ltrim(uriStr, '#') : '';
        if (!force && this.state && uriStr == this.state.uriStr)
            return;
        
        // normalize
        var uri = new URI(uriStr);
        uri.normalize();
        uri.path( _.trim(uri.path(), '/') );
        
        if (!this.isServerUrl) {
            // sync
            var newHash = uri.toString();
            var oriHash = location.hash;
            if (oriHash[0] == '#') oriHash = oriHash.substr(1);
            if (newHash != oriHash) {
                // set the window.location, which will recur back
                location.hash = newHash;
            }
        }
        
        // state
        this.uri = uri;
        this.setState({uriStr : uri.toString()});
        if (force)
            this.forceUpdate();
    },
    setQuery: function() {
        var uri = this.uri;
        uri.setQuery.apply(uri, arguments);
        this.go(uri.toString());
    },
    removeQuery: function() {
        var uri = this.uri;
        uri.removeQuery.apply(uri, arguments); 
        this.go(uri.toString());
    },
    goBackToTree: function(){
        this.go(this.oriTreeUrl);
    },
    goBack: function(){
        this.renderred.shift();
        if (this.renderred.length > 0)
            window.history.back();
        else
            this.go("/");
    },
    
    shouldComponentUpdate: function(nextProps, s2) {
        //var s1 = this.state;
        return s2.uriStr //&& (s2.uriStr != s1.uriStr);
    },
    
    render: function() {
        var comps = [];
        var uri = this.uri;
        if (uri) {
            // pre-route to set the current tree
            var treeId = uri.segment(0);
            if (!treeId) {
                // hash == #/ , clean both to load the default
                this.curTreeId = null;
                this.curTree = null;
            } else if (E.util.oidRegExp.test(treeId)) {
                this.curTreeId = treeId;
                this.curTree = E.Tree.getOrNew(treeId);
            }
            
            var topComp = comps[comps.length - 1];
            
            var other = this.routeOthers(this.curTree);
            if (other) {
                if (topComp && other.constractor == topComp.constractor) {
                    // replace
                    comps[comps.length - 1] = other;
                } else {
                    // push
                    comps.push(other);
                }
            } else {
                if (this.curTree) {
                    var treeProps = this.treeProps;
                    treeProps.tree = this.curTree;
                    treeProps.key = this.curTree._id;
                    
                    var nodeOid = uri.segment(1);
                    var isEditing = !this.isServerUrl && !this.curTree.isPublic(); 
                    if (E.util.oidRegExp.test(nodeOid)) {
                        treeProps.nodeOid = nodeOid;
                        treeProps.option = uri.segment(2);
                    } else {
                        treeProps.option = nodeOid;
                        if (nodeOid == 'edit')
                            isEditing = true;
                    }
                    
                    comps = [ (isEditing ? EditTreePage : TreePage)(_.extend({}, treeProps)) ];
                } else {
//                    var defaultTree = E.Tree.getDefault();
//                    setTimeout(function(){
//                        main.go(defaultTree._id);
//                    });
                    comps = [ AboutPage({key:'about'}) ];
                }
            }
            
            this.renderred.unshift(this.state.uriStr);
            this.renderred.slice(0, 10);
        }
        
        if (comps.length == 0) {
            if (this.props.isServerRender) {
                comps = [ AboutPage({key:'about'}) ];
            } else {
                comps = [ TreePage(_.extend({}, this.treeProps)) ];
            }
        }
        
        var topComp = comps[comps.length - 1];
        //var topCompClass = topComp.constructor.displayName;
        //this.renderSet(topCompClass);
        
        if (topComp.constractor == TreePage.componentConstructor)
            this.oriTreeUrl = this.state && this.state.uriStr;
        
        return (
                <div className="onlyShowTop">
                    {comps}
                </div>
                    );
    },
    routeOthers: function(lastTree){
        var othersProps = {key:'others', ref:'others', };
        var uri = this.uri;
        if (this.uri.segment(0) == 'Accounts') {
            return AccountsPage(othersProps);
        }
        
        // Props
        if (this.uri.segment(1) == 'StationLink') {
            return StationLinkPage(_.extend({tree:lastTree}, othersProps));
        }
        if (this.uri.segment(1) == 'AddMember') {
            return AddMemberPage(_.extend({tree:lastTree}, othersProps));
        }
        return null;
    },
//    renderSet: function(bodyClass){
//        bodyClass = bodyClass || '';
//        if (!this.oldBodyClass || this.oldBodyClass != bodyClass) {
//            var bodyEl = $(document.body);
//            if (this.oldBodyClass)
//                bodyEl.removeClass(this.oldBodyClass);
//            bodyEl.addClass(bodyClass);
//            this.oldBodyClass = bodyClass;
//        }
//        
////        if (this.state && this.state.uriStr)
////            E.put('private/ui.json', {uriStr:this.state.uriStr});
//        
//        return true;
//    },
    
//    showLoading: function(){
//        $('<div className="alert alert-info abs-center" style="position:fixed"> Loading... </div>').appendTo(this.getDOMNode());
//    },
});


Main.main = function(){

    if (location.pathname.indexOf('/view-') == 0) {
        React.localUrl = '/';
    } else {
        React.localUrl = location.pathname;
    }
    React.serverUrl = (window.isDev ? location.protocol+'//'+location.host : 'http://pithway.com');
    
    React.initializeTouchEvents(true);
    React.renderComponent( Main(), document.body);
} 

})(typeof window != 'undefined' ? window : global);