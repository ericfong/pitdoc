
function Wait() {
  // ID for each wrap
  var ID = 0;
  // waiting map for wrapped func
  var waiting = {};
  // returns
  var returns = [];
  // seq for next func
  var seq = [];

  function wait(func, param1) {
    var id = ID++;
    waiting[id] = true;
    // return the wrapped func
    return function() {
      var ret;
      // ignore the timeouted or returned funcs
      if (waiting[id]) {
        
        if (typeof func == 'function')
          ret = func.apply(this, arguments);
//        else if ((func == 'arg' || func == 'argument' || func == 'arguments') && param1 !== undefined)
//          ret = arguments[param1];
        
        delete waiting[id];
        returns[id] = ret;
      }
      next();
      return ret;
    };
  }

  function next() {
    if (seq.length > 0 && Object.keys(waiting).length == 0) {
      // when nothing waiting => call next sequence function and pass down returns
      // keep the returns in tmp for passing to next sequence function
      var tmpReturns = returns;
      // reset all variables
      ID = 0;
      waiting = {};
      returns = []
      var thenTarget = seq.shift();
      thenTarget(tmpReturns);
      next();
    }
  }

  function firstCall() {
    // insert new functions into the sequence running head
    seq = Array.prototype.slice.call(arguments).concat(seq);
    next();
    return this;
  }

  function then() {
    // queue new functions into the sequence running tail
    seq = seq.concat(Array.prototype.slice.call(arguments));
    next();
    return this;
  }

  // kill and sub-waits
  wait.children = [];
  wait.kill = function(){
      ID = 0;
      waiting = {};
      seq = [];
      
      wait.children.forEach(function(child){
          child.kill();
      });
      wait.killed = true;

      var tmpReturns = returns;
      returns = []
      return tmpReturns;
  }

  wait.next = next;
  wait.firstCall = firstCall;
  wait.then = then;
  return wait;
}
