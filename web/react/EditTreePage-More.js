/** @jsx React.DOM */
// Slip related 
EditTreePage = {
    renderAllSubs: function(subDoms, node, level, showDraftOut, keys){
        if (!node || !node.getSubs()) return;
        node.getSubs().forEach(function(node){
            var index = subDoms.length;
            var key = node.oid || index;
            while (keys[key])
                key += ''+Math.random();
            keys[key] = true;
            subDoms[index] = NodeText({node:node, key:key, level:level, ref:'child_'+index, dataRef:'child_'+index, showDraftOut:showDraftOut});
            
            this.renderAllSubs(subDoms, node, level+1, showDraftOut, keys);
        }.bind(this));
    },
    
    componentDidMount: function(){
        var list = this.refs.list.getDOMNode();
        this.slip = new Slip(list);
        list.addEventListener('slip:beforeswipe', this.onSlipBeforeSwipe);
        list.addEventListener('slip:swipe', this.onSlipSwipe);
        list.addEventListener('slip:afterswipe', this.onSlipAfterSwipe);
        list.addEventListener('slip:beforereorder', this.onSlipBeforeReorder);
        list.addEventListener('slip:reorder', this.onSlipReorder);
        list.addEventListener('slip:tap', function(e){
            // to allow the default onTouchEnd event gen by slip
            e.preventDefault();
        });
    },
    
    onSlipBeforeReorder: function(e){
        // check for valid focus
        if (this.focusAt && Date.now() - this.focusAt > 500) {
            e.preventDefault()
        } else {
            // blur and TextSelection cancel
            if (document.activeElement) document.activeElement.blur();
            rangy.getSelection().removeAllRanges();
            this._slipWrapSubs();
        }
    },
    
    onSlipReorder: function(e){
        var wrapDom = e.target;
        var targetDom = e.target.firstChild;
        var movingRef = targetDom.getAttribute('data-ref');
        var movingComp = this.refs[movingRef];
        var movingNode = movingComp.props.node;
        
        var insertParent = null;
        var insertIndex = 0;
        var insertAfterDom = e.detail.insertBefore ? e.detail.insertBefore.previousSibling : e.target.parentElement.lastChild;
        
        this._slipUnwrap();
        if (insertAfterDom == wrapDom) {
            return;
        }
        
        if (insertAfterDom) {
            var insertAfterRef = insertAfterDom.getAttribute('data-ref');
            var insertAfterComp = this.refs[insertAfterRef];
            var insertAfterNode = insertAfterComp.props.node;
            
            // try to keep the level
            var movingLevel = movingComp.props.level;
            var insertAfterLevel = insertAfterComp.props.level;
            if (movingLevel > insertAfterLevel) {
                insertParent = insertAfterNode;
                // should not have any child
                insertIndex = 0;
            } else {
                var step = insertAfterLevel - movingLevel;
                step = isNaN(step) ? 0 : step;
                insertParent = insertAfterNode._parent;
                for (var s = step; s > 0; s--) {
                    if (insertParent._parent instanceof E.Node) {
                        insertAfterNode = insertParent;
                        insertParent = insertParent._parent;
                    }
                }
                // skip the draft event trigger is important
                movingNode._detach();
                insertIndex = insertParent.getSubs().indexOf(insertAfterNode) + 1;
            }
        } else {
            // insert to root node, as the first child
            insertParent = this.getRootNode();
            insertIndex = 0;
        }
        //console.log('onSlipReorder', insertParent.text, insertIndex, (insertParent.getSubs()[insertIndex] || {}).text);
        
        
        this._isSlipReordering = true;
        if (insertParent) {
            insertParent.insert(movingNode, insertIndex);
        }
        this._isSlipReordering = false;
        
        
        // so that the target will not jump
        //e.target.style.display = 'none';
//        el.hide();
        this.forceUpdate(function(){
//            requestAnimationFrame(function() {
//                //e.target.style.display = '';
//                el.show();
//            });
        });
    },
    
    onSlipBeforeSwipe: function(e){
        this._slipWrapSubs();
    },
    
    onSlipSwipe: function(e){
        // always animate back to original position instead swipe out the view
        e.preventDefault();
        var absMove = e.detail;
        var x = absMove.x;
        if (Math.abs(x) <= 30)
            return;
        
        var wrapDom = e.target;
        var targetDom = e.target.firstChild;
        var movingRef = targetDom.getAttribute('data-ref');
        var movingComp = this.refs[movingRef];
        var movingNode = movingComp.props.node;
        var parentNode = movingNode._parent;
        
        if (x > 30) {
            var parentSubs = parentNode.getSubs();
            var newParentNode = parentSubs[parentSubs.indexOf(movingNode) - 1];
            if (newParentNode)
                newParentNode.insert(movingNode, newParentNode.getSubs().length);
        } else if (x < 30 && parentNode._parent instanceof E.Node) {
            // parentNode._parent, should not be root
            movingNode.insertAfter(parentNode);
        }
    },
    
    onSlipAfterSwipe: function(){
        this._slipUnwrap();
    },
    
    _slipWrapSubs: function(){
        var slipTarget = this.slip.target;
        // check the node have subs or not?
        // wrap the target and all its subs
        // wrap and move in
        var wrap = document.createElement('div');
        wrap.className = 'slipWrap';
        slipTarget.node.parentNode.insertBefore(wrap, slipTarget.node);
        wrap.appendChild(slipTarget.node);
        // move in all the level below
        var level = parseInt(slipTarget.node.getAttribute('data-level'));
        while (wrap.nextSibling && parseInt(wrap.nextSibling.getAttribute('data-level')) > level) {
            wrap.appendChild(wrap.nextSibling);
        }
        slipTarget.node = wrap;
        slipTarget.height = wrap.offsetHeight;
    },
    _slipUnwrap: function(){
        var slipTarget = this.slip.target;
        if (slipTarget.node) {
            var el = $(slipTarget.node);
            if (el.hasClass('slipWrap')) {
                slipTarget.node = slipTarget.node.firstChild;
                el = el.children().unwrap();
            }
        }
    },
};
