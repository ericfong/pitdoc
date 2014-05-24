//Touch events are from zepto/touch.js
(function() {

    // match
    $.lastStartTouches = {};
    $.lastMoveTouches = {};

    // longTap
    var longTapTimer = null;

    var captures = {

        'touchstart' : function(e) {
            // last
            for ( var i = e.changedTouches.length - 1; i >= 0; i--) {
                var t = e.changedTouches[i];
                t.event = e;
                $.lastStartTouches[t.identifier] = $.extend({}, t);
            }

            // longTap
            if (!longTapTimer) {
                longTapTimer = setTimeout(function() {
                    e.isLongTap = true;
                    var el = $(parentIfText(e.touches[0].target));
                    el.trigger('longTap', e);
                }, $.longTapDelay || 500);
            }
        },

        'touchmove' : function(e) {
            // last
            for ( var i = e.changedTouches.length - 1; i >= 0; i--) {
                var t = e.changedTouches[i];
                t.event = e;
                $.lastMoveTouches[t.identifier] = $.extend({}, t);
            }

            // longTap
            clearTimeout(longTapTimer);
            longTapTimer = null;
        },
        
        'touchend' : function(e) {
            // longTap
            clearTimeout(longTapTimer);
            longTapTimer = null;
        },

        'touchcancel' : function(e) {
            // longTap
            clearTimeout(longTapTimer);
            longTapTimer = null;
        },
    };
    
    var eventLayerEl;
    function preventFollowingClick(){
        // capture all touch/mouse events for 400ms to prevent text or other things being focus
        if (!eventLayerEl) {
            eventLayerEl = $('<div style="z-index:10000;position:fixed;top:0;right:0;bottom:0;left:0;"></div>').appendTo(document.body);
        } else {
            eventLayerEl.show();
        }
        setTimeout(function(){
            eventLayerEl.hide();
        }, 400);
    }
    
    var listeners = {
        'touchend' : function(e) {
            var t = e.changedTouches[0];
            var lastStart = $.lastStartTouches[t.identifier];
            //console.log(lastStart, lastStart.event.isLongTap, lastStart.event.defaultPrevented);
            if (lastStart) {
                if (!lastStart.event.isLongTap && !lastStart.event.defaultPrevented) {
                    var endTarget = parentIfText(t.target);
                    var startTarget = parentIfText(lastStart.target);
                    if (endTarget == startTarget) {
                        var btn = $(endTarget).closest('button,a,[href]');
                        if (btn.length > 0) {
                            //console.log('fast click', btn);
                            // faster click for non input (should it just affect in )
                            btn.trigger('click', e);
                            preventFollowingClick();
                        }
                    }
                }
            }
            
            // chain
            listeners.touchcancel(e);
        },

        'touchcancel' : function(e) {
            // housekeeping
            if (e.touches.length == 0) {
                $.lastStartTouches = {};
                $.lastMoveTouches = {};
            }
        },
    };

    for ( var key in captures) {
        document.addEventListener(key, captures[key], true);
    }
    // hope this make listener at the very end
    window.addEventListener("load", function(event){
        setTimeout(function(){
            for ( var key in listeners) {
                document.addEventListener(key, listeners[key], false);
            }
        }, 200);
    });

    // Util functions
    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
    }
    
    // clicked effect
    $(document).delegate('button', {
        touchstart: function(e){
            var el = $(e.target).closest('button');
            if (!el.hasClass('skipClicked'))
                el.addClass('clicked');
        },
        touchend : function(e) {
            var el = $(e.target).closest('button');
            setTimeout(function(){
                el.removeClass('clicked');
            }, 350);
        },
        touchcancel : function(e) {
            $(e.target).closest('button').removeClass('clicked');
        },
    });

})();
