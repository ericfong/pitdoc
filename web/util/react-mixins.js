(function(global){
//  getDefaultProps: function(){},
//  getInitialState: function(){},
//  componentWillMount: function(){},
//  componentDidMount: function(dom){},
      
//  componentWillReceiveProps: function(nextProps){},
//  shouldComponentUpdate: function(nextProps, nextState){},
//  componentWillUpdate: function(nextProps, nextState){},
//  componentDidUpdate: function(prevProps, prevState, dom){},
      
//  componentWillUnmount: function(){},

    global.MyMixin = {
        componentDidMount: function(dom){
            // memory leak?
            //this.el = $(dom).data('react', this);
            if (this.didRender) this.didRender(dom);
        },
        componentDidUpdate: function(prevProps, prevState, dom){
            // memory leak?
            //this.el = $(dom).data('react', this);
            if (this.didRender) this.didRender(dom);
        },
            
        $: function(selector){
            if (selector == null) {
                return $(this.getDOMNode()); 
            } else {
                var ref = this.refs[selector];
                return $(ref && ref.getDOMNode());
            }
        },
    };
    
//    window.AsyncState = {
//        componentWillMount: function(){
//            if (this.load) this.load();
//        },
//        componentWillReceiveProps: function(nextProps){
//            if (this.load) this.load();
//        },
//        shouldComponentUpdate: function(nextProps, nextState) {
//            // suppose load based on this.props, so ignore props changes
//            return (!this.load && !shallowEqual(nextProps, this.props)) || !shallowEqual(nextState, this.state);
//        },
//    };
//    // copy from reactjs
//    function shallowEqual(objA, objB) {
//        if (objA === objB) {
//            return true;
//        }
//        if ((!objA && objB) || (objA && !objB))
//            return false;
//        var key;
//        // Test for A's keys different from B.
//        for (key in objA) {
//            if (objA.hasOwnProperty(key) &&
//                    (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
//                return false;
//            }
//        }
//        // Test for B'a keys missing from A.
//        for (key in objB) {
//            if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
//                return false;
//            }
//        }
//        return true;
//    }

    
    _.extend(React, {
        emitTo: function(funcName, selector, isFind){
            return function(e){
                var el = $(e.currentTarget);
                if (selector) {
                    if (isFind)
                        el = el.find(selector);
                    else
                        el = el.closest(selector);
                }
                var comp = el.data('react');
                if (comp && comp[funcName])
                    return comp[funcName].apply(comp, arguments);
            }
        },
        
        'if': function(exp, exp2, exp3){
            if (exp)
                return exp2;
            else if (exp3)
                return exp3;
        },
        
        map : function(list, iterator, whenEmpty, context){
            if (typeof whenEmpty != 'function') {
                context = whenEmpty;
                whenEmpty = null;
            }
            var ret = _.map(list, iterator, context);
            if (ret.length == 0 && whenEmpty) {
                ret.push(whenEmpty.call(context));
            }
            return ret;
        },
        
        timeAbsString : function(time, now){
            if (!now)
                now = Date.now();
            var minutes = (now - time) / (1000);
            var hours = minutes / 3600;
            var days = hours / 24;
            if (days < 1) {
                var timeDate = new Date(time);
                var nowDate = new Date(now);
                if (timeDate.getDate() == nowDate.getDate()) {
                    return timeDate.format('h:MMtt');
                } else {
                    return timeDate.format('mmmd h:MMtt');
                }
            }
            if (days < 7) 
                return (new Date(time)).format('mmmd htt');
            if (days < 31) 
                return (new Date(time)).format('mmmd');
            if (days < 366) 
                return (new Date(time)).format('yyyy mmm d');
        },    
    });
    
})(typeof window != 'undefined' ? window : global);
