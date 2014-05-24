/*
 * Base on https://github.com/jeresig/jquery.hotkeys/
 */

(function(){
  
  function iskey(event, keySpec) {
    // Only care when a possible input has been specified
    if ( typeof keySpec !== "string" ) {
      return;
    }
    var keys = keySpec.toLowerCase().split(" ");
    
//    // sort by alt, ctrl, meta and shift
//    for (var i = keys.length-1; i >= 0; i--) {
//        var key = keys[i];
//        var modifs = [];
//
//        var plusIndex = key.indexOf('+');
//        var p = plusIndex > 0 ? key.substr(0, plusIndex) : '';
//        while (p == 'alt' || p == 'ctrl' || p == 'meta' || p == 'shift'){
//            modifs.push(p);
//            key = key.substr(plusIndex+1);
//            plusIndex = key.indexOf('+');
//            p = plusIndex > 0 ? key.substr(0, plusIndex) : '';
//        }
//        if (modifs.length > 0) {
//            modifs.sort();
//            keys[i] = modifs.join('+')+'+'+key;
//            //console.log(modifs.join('+')+' + '+key);
//        }
//    }
  
    // Keypress represents characters, not special keys
    var special = event.type !== "keypress" && iskey.specialKeys[ event.which ],
      character = String.fromCharCode( event.which ).toLowerCase(),
      key, modif = "", possible = {};

    // check combinations (alt|ctrl|shift+anything)
    if ( event.altKey && special !== "alt" ) {
      modif += "alt+";
    }

    if ( event.ctrlKey && special !== "ctrl" ) {
      modif += "ctrl+";
    }
    
    // TODO: Need to make sure this works consistently across platforms
    if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
      modif += "meta+";
    }

    if ( event.shiftKey && special !== "shift" ) {
      modif += "shift+";
    }

    if ( special ) {
      possible[ modif + special ] = true;

    } else {
      possible[ modif + character ] = true;
      possible[ modif + iskey.shiftNums[ character ] ] = true;

      // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
      if ( modif === "shift+" ) {
        possible[ iskey.shiftNums[ character ] ] = true;
      }
    }

    for ( var i = 0, l = keys.length; i < l; i++ ) {
      if ( possible[ keys[i] ] ) {
        // HACK: add a new field to event object to let the func know who trigger the key
        event.hotkey = keys[i];
        return true;
        // END HACK
      }
    }
  }

  iskey.specialKeys = {
    8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
    20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
    37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
    96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
    104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
    112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
    120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
  };
  
  iskey.shiftNums = {
    "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
    "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
    ".": ">",  "/": "?",  "\\": "|"
  };
  
  window.iskey = iskey;

})();