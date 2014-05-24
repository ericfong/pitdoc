(function() {
  // Remove elements and attributes that do not meet a whitelist lookup of lowercase element
  // name to list of lowercase attribute names.
  // ex: filterNodes(o.node, {p: [], br: [], a: ['href']});
  function filterNodes(element, allow) {
    // Recurse into child elements
    //
    arrayFromList(element.childNodes).forEach(function(child) {
      if (child.nodeType === 1) {
        filterNodes(child, allow);

        var tag = child.tagName.toLowerCase();
        if ( tag in allow) {

          // Remove unwanted attributes
          //
          arrayFromList(child.attributes).forEach(function(attr) {
            if (allow[tag].indexOf(attr.name.toLowerCase()) === -1)
              child.removeAttributeNode(attr);
          });

        } else {

          // Replace unwanted elements with their contents
          //
          while (child.firstChild)
          element.insertBefore(child.firstChild, child);
          element.removeChild(child);
        }
      } else if (child.nodeType === 8) {
        element.removeChild(child);
      }
    });
  }

  // Utility function used by filterNodes. This is really just `Array.prototype.slice()`
  // except that the ECMAScript standard doesn't guarantee we're allowed to call that on
  // a host object like a DOM NodeList, boo.
  //
  arrayFromList = function(list) {
    var array = new Array(list.length);
    for (var i = 0, n = list.length; i < n; i++)
      array[i] = list[i];
    return array;
  };
  
  window.sanitizeDom = function(node){
    filterNodes(node, {b: [], i: [], u: [], br: [], a: ['href'], s:[], e:[]}); //, 
  };

  window.sanitizeHtml = function(html) {
    return html.replace(/<(?!\s*\/?(b|i|u|s|e)\b)[^>]+>/ig,"");
  };
})();
