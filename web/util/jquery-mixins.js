(function() {

    $.throttleRAF = function(func) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            cancelAnimationFrame(timeout);
            timeout = requestAnimationFrame(function() {
                func.apply(context, args);
                timeout = null;
            });
        };
    }
    
    $.fn.removeAddClass = function(className){
        var el = this.removeClass(className);
        requestAnimationFrame(function(){
            el.addClass(className);
        })
    };

    $.fn.scroll = function(destX, destY, duration, relative){
        duration = duration || 0;
        this.each(function(index, dom){
            if (relative) {
                destX = dom.scrollLeft + destX;
                destY = dom.scrollTop + destY;
            }
            var destT = Date.now() + duration;
            function step () {
                var curT = Date.now();
                var curX = dom.scrollLeft;
                var curY = dom.scrollTop;

                if (curX == destX && curY == destY){
                    return;
                }
                if (curT >= destT) {
                    dom.scrollLeft = destX;
                    dom.scrollTop = destY;
                    return;
                }

                var ratio = (destT - curT) / duration;
                newX = Math.round( destX - (destX - curX) * ratio );
                newY = Math.round( destY - (destY - curY) * ratio );
                if (newX != curX) {
                    dom.scrollLeft = newX;
                }
                if (newY != curY) {
                    dom.scrollTop = newY;
                }

                requestAnimationFrame(step);
            }
            step();
        });
        return this;
    }
    
//    $.cookie = function(c_name, value, exdays) {
//        if (value === undefined) {
//            var c_value = document.cookie;
//            var c_start = c_value.indexOf(" " + c_name + "=");
//            if (c_start == -1) {
//                c_start = c_value.indexOf(c_name + "=");
//            }
//            if (c_start == -1) {
//                c_value = null;
//            } else {
//                c_start = c_value.indexOf("=", c_start) + 1;
//                var c_end = c_value.indexOf(";", c_start);
//                if (c_end == -1) {
//                    c_end = c_value.length;
//                }
//                c_value = unescape(c_value.substring(c_start, c_end));
//            }
//            return c_value;
//        } else {
//            // set
//            var exdate = new Date(Date.now() + (exdays*24*3600*1000));
//            var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
//            document.cookie = c_name + "=" + c_value;
//        }
//    };
    
//    /* Should define function directly into global variables
//     * Call Ons 
//     */
//     $.fn.when = function(selector, event, callback) {
//         if (event === undefined || $.isFunction(event)) {
//             callback = event; 
//             event = selector; 
//             // like bind
//             for (var i = 0; i < this.length; i++) {
//                 $.event.add(this[i], event, callback, '*', function(fn){
//                     return function(e) {
//                         if (!e.data || !e.data.selector || e.data.selector == selector) {
//                             e.that = event;
//                             var ret = fn.apply(this, arguments);
//                             handleReturn(e, ret);
//                             return ret;
//                         }
//                     }
//                 });
//             }
//         } else {
//             // like delegate
//             for (var i = 0; i < this.length; i++) {
//                 var element = this[i];
//                 $.event.add(element, event, callback, selector, function(fn) {
//                     return function(e) {
//                         var evt, match = $(e.target).closest(selector, element).get(0);
//                         if (match && (!e.data || !e.data.selector || e.data.selector == selector)) {
//                             evt = $.extend(e, {
//                                 currentTarget: match,
//                                 liveFired: element
//                             });
//                             evt.that = event;
//                             var ret = fn.apply(match, [evt].concat([].slice.call(arguments, 1)));
//                             handleReturn(e, ret);
//                             return ret;
//                         }
//                     }
//                 });
//             }
//         }
//         return this;
//     };
//     function handleReturn(event, ret) {
//         var data = event.data;
//         if (data && data.ret === 'call') {
//             event.data.ret = ret;
//             event.stopImmediatePropagation();
//         }
//     }
//     $.fn.apply = function(event, data, selector) {
//         if (typeof event == 'string')
//             event = $.Event(event);
//         event.data = data || [];
//         event.data.ret = 'call';
//         event.data.selector = selector;
//         for (var i = 0; i < this.length; i++) {
//             this[i].dispatchEvent(event)
//         }
//         return event.data.ret;
//     };
//    $.fn.call = function(event) {
//        return this.apply(event, Array.prototype.slice.call(arguments, 1));
//    };    
})();

//(function() {
///*
//* States
//*/
//window.pushHash = function(newHash) {
//  return pushOrReplace(newHash, false);
//};
//window.replaceHash = function(newHash) {
//  return pushOrReplace(newHash, true);
//};
//function pushOrReplace(newHash, replace) {
//  var oldHref = window.location.href;
//  var oldHash = $.ensurePrefix(window.location.hash, '#');
//  var newHash = $.ensurePrefix(newHash, '#');
//  var newHref = oldHref.indexOf('#') >= 0 ? oldHref.replace(oldHash, newHash) : oldHref + newHash;
//  var title = document.title;
//  try {
//      if (replace)
//          window.history.replaceState(newHash, title, newHref);
//      else
//          window.history.pushState(newHash, title, newHref);
//      $(window).trigger("hashchange", {
//          newURL: newHref,
//          oldURL: oldHref
//      });
//  } catch (e) {
//      console.error(e);
//  }
//  return newHash;        
//}    
//})();

//window.fireWindowEvent = function(type, data) {
//  var evt = createEvent(type, data);
//  window.dispatchEvent(evt);
//  return evt;
//}
//function createEvent(type, data) {
//  var event = document.createEvent('Events');
//  event.initEvent(type, false, false);
//  if (data) {
//      for (var i in data) {
//          if (data.hasOwnProperty(i)) {
//              event[i] = data[i];
//          }
//      }
//  }
//  return event;
//}
