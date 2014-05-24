var Text_key = {
    onKeyDown: function(e){
        // return, backspace, del
        if (iskey(e, 'return')) {
            return this.downReturn(e);
        }
        if (iskey(e, 'backspace')) {
            return this.downBackspace(e);
        }
//        if (iskey(e, 'del')) {
//            return delKey(e);
//        }
//
//        // four direction
//        if (iskey(e, 'left up')) {
//            return up_left_key(e);
//        } 
//        if (iskey(e, 'right down')) {
//            return down_right_key(e);
//        } 
//        
//        // indent and move
//        if (iskey(e, 'alt+up alt+shift+up'))
//            return moveUp(e);
//        if (iskey(e, 'alt+down alt+shift+up'))
//            return moveDown(e);
//        if (iskey(e, 'tab alt+right alt+shift+right'))
//            return indent(e);
//        if (iskey(e, 'shift+tab alt+left alt+shift+left'))
//            return outdent(e);

        // Save
        if (iskey(e, 'ctrl+s meta+s')) {
            e.preventDefault();
            if (document.activeElement) document.activeElement.blur();
        }
        
//        // Undo / Redo
//        //iskey(e, 'ctrl+z meta+z', undo);
//        //iskey(e, 'ctrl+y meta+shift+z', redo);
    },
     
    // Enter 
    downReturn: function(e) {
        // keydown can preventDefault but not keyup
        e.preventDefault();

        // cut out valAfter
        var isKeepBefore = true;
        var beforeText = '';
        var afterText = '';
        var sel = rangy.getSelection();
        var range = sel.rangeCount > 0 ? sel.getRangeAt(sel.rangeCount - 1) : null;
        if (range) {
            var editDom = this.getEditDom();
            range.deleteContents();
            range.setStart(editDom, 0);
            
            beforeText = range.cloneContents().textContent;
            
            var wholeText = editDom.textContent;
            if (beforeText.length > wholeText.length / 2) {
                // select afterText and extract it
                range.collapse(false);
                range.setEndAfter(editDom.lastChild);
                afterText = range.extractContents().textContent;
            } else {
                isKeepBefore = false;
                range.deleteContents();
            }
        }
        this._fullSetText();

        // insert a new node after this node 
        var node = this.props.node;
        if (isKeepBefore) {
            var newNode = new E.Node({text:afterText});
            newNode._selStart = 0;        
            newNode._selEnd = 0;        
            newNode.insertAfter(node);
        } else {
            var newNode = new E.Node({text:beforeText});
            newNode.insertBefore(node);
        }
    },
    
    downBackspace: function(e) {
        var sel = rangy.getSelection();
        var range = sel.rangeCount > 0 ? sel.getRangeAt(sel.rangeCount - 1) : null;
        if (!range || !range.collapsed)
            return false;

        // get before text
        var editDom = this.getEditDom();
        var beforeRange = rangy.createRange();
        beforeRange.setStart(editDom, 0);
        beforeRange.setEnd(range.startContainer, range.startOffset);
        var beforeText = beforeRange.cloneContents().textContent || '';

        if (!beforeText) {
            // remove this
            var node = this.props.node;
            node.detach();
            
            // set select
            var all = $('.Text > .edit');
            var index = all.index(editDom);
            var target = all.get(index-1);
            if (target) {
                // prevent delete char in target
                e.preventDefault();
                var newRange = rangy.createRange();
                newRange.selectNodeContents(target);
                newRange.collapse(false);
                sel.setSingleRange(newRange);
            }
        }
        
        return;
        refreshRangy();
        if (isEdge('left')) {
            // if current is empty
            if (textEl.text().trim() == ''){
                // set sel to prevNodeInDisplay
                var targetEl = prevNodeInDisplay(itemEl);
                range.selectNodeContents(targetEl.find(selfTextSelector).get(0));
                range.collapse(false);
                sel.setSingleRange(range);
                e.preventDefault();
                // remove it 
                itemEl.remove();
                // save
                window.copyChildrenToModel( targetEl.parent().closest('.item') );
                saveNodes(targetEl);
                return;
            }

            // has prev and prev dont have child
            var targetEl = itemEl.prev('.item')
            if (targetEl.length > 0 && targetEl.children('.item').length == 0) {
                // delete and collapse current range
                range.deleteContents();

                // move the prev content to the beginning of this node
                range.insertNode(range.createContextualFragment(targetEl.find(selfTextSelector).html()));
                range.collapse(false);
                range.normalizeBoundaries();

                // remove the empty contentEl
                targetEl.remove();

                // refersh the sel and prevent the browser go to the prevous page
                sel.setSingleRange(range);
                e.preventDefault();

                window.copyChildrenToModel( itemEl.parent().closest('.item') );
                saveNodes(itemEl);
            }
//          // backspace
//          // Notice: android webview don't fire backspace when it is beginning of the text
//          var dom = e.target;
//          if ((dom.selectionStart == 0 && dom.selectionEnd == 0)
//                  || (dom.value.length == 1 && dom.selectionStart == 1 && dom.selectionEnd == 1)) {
//              e.preventDefault();
//
//              var textEl = $(e.target);
//              var textVal = ''+textEl.val().substr(dom.selectionEnd);
//              
////              var itemEl = textEl.closest('.item');
////              var itemIndex = itemEl.index();
////              var siblings = itemEl.parent().children();
////              var sectionEl = itemEl.closest('section');
////
////              var prevDom = siblings.get( itemIndex - 1 );
////              var prevEl = $(prevDom);
////              // FIXME: prevent move itemEl.textarea to prevEl when one of them have child items
////
////              var listIsDirty = false;
////
////              if (prevEl.length > 0) {
////                  var prevTextEl = prevEl.find('textarea');
////                  var prevVal = prevTextEl.val();
////
////                  // concat
////                  var newPrevTextVal = prevVal + textVal;
////                  prevTextEl.val(newPrevTextVal);
////                  prevTextEl.trigger('autoSize');
////
////                  // model
////                  var prevModel = prevEl.model();
////                  prevModel.text = newPrevTextVal
////                  edd.save(newModel);
////
////                  // set select to the end of prevVal
////                  var targetDom = prevTextEl[0];
////                  targetDom.selectionStart = prevVal.length;
////                  targetDom.selectionEnd = prevVal.length;
////                  targetDom.focus();
////
////                  itemEl.remove();
////                  listIsDirty = true;
////              } else if (textVal.trim() == '' && itemIndex < siblings.length-1) {
////                  // when current text is empty and not last placeholder, even it is the first one, still need to remove it
////                  itemEl.remove();
////                  listIsDirty = true;
////              }
////
////              if (listIsDirty) {
////                  window.copyDomListToModelList(sectionEl);
////                  edd.save(sectionEl.model());
////              }
//
        }
    },

    delKey: function(e) {
        refreshRangy();
        if (isEdge('right')) {
            // if current is empty
            if (textEl.text().trim() == ''){
                // set sel to nextNodeInDisplay
                var targetEl = nextNodeInDisplay(itemEl);
                range.selectNodeContents(targetEl.find(selfTextSelector).get(0));
                range.collapse(true);
                sel.setSingleRange(range);
                e.preventDefault();
                // remove it 
                itemEl.remove();
                // save
                window.copyChildrenToModel( itemEl.parent().closest('.item') );
                saveNodes(targetEl);
                return;
            }

            // has next and current node dont have child
            var targetEl = itemEl.next('.item')
            if (targetEl.length > 0 && itemEl.children('.item').length == 0) {

                var $parent = itemEl.parent('.item');
                var delIndex = $parent.children('.item').index(itemEl);

                // delete and collapse current range
                range.deleteContents();

                // move the next content to the end of this node
                range.insertNode(range.createContextualFragment(targetEl.find(selfTextSelector).html()));
                range.collapse(true);
                range.normalizeBoundaries();

                // move all child from targetEl to here
                targetEl.children('.item').appendTo(itemEl);

                targetEl.remove();

                sel.setSingleRange(range);
                e.preventDefault();

                // change model
                window.copyChildrenToModel( itemEl.parent().closest('.item') );
                saveNodes(itemEl);
            }
        }
    },
};
