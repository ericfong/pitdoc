/** @jsx React.DOM */
(function(global) {
global.Text = React.createClass({
    mixins: [MyMixin, Text_key],
    
    getInitialState: function() {
        return {};
    },

    shouldComponentUpdate: function(p2, s2) {
        var node = p2.node;
        // last -> other -> value
        var l2 = node && node.getLast() || '';
        var o2 = node && node.getOther() || '';
        var v2 = node && node.getText() || '';

        var l1 = this._last;
        var o1 = this._other;
        var v1 = this._value;
        return (v2!=v1 || o2!=o1 || l2!=l1);
    },
    
    render: function() {
        var node = this.props.node;
        // last -> other -> value
        var last = this._last = node && node.getLast() || '';
        var other = this._other = node && node.getOther() || '';
        var value = this._value = node && node.getText() || '';
        
        var selStart = -1; 
        var selEnd = -1;
        if (node && !isNaN(node._selStart)) {
            selStart = node._selStart;
            selEnd = !isNaN(node._selEnd) ? node._selEnd : selStart;
            delete node._selStart;
            delete node._selEnd;
        }
        
        var editDom = this.getEditDom();
        
        // if caret in this Text
        if (this.focusAt) {
            var sel = rangy.getSelection();
            var range = sel.rangeCount > 0 ? sel.getRangeAt(sel.rangeCount - 1) : null;
            if (range) {
                // get texts
                var domValue = editDom.textContent || '';
                var insideText = range.cloneContents().textContent || '';
                var insideLen = insideText.length;
                
                var beforeRange = rangy.createRange();
                beforeRange.setStart(editDom, 0);
                beforeRange.setEnd(range.startContainer, range.startOffset);
                var beforeText = beforeRange.cloneContents().textContent || '';
                var beforeLen = beforeText.length;
                var beforeInsideLen = beforeLen + insideLen;
                var afterText = domValue.substr(beforeInsideLen);
                
                // search in new value -> new caret start and end index
                selStart = dmp.match_main(value, insideText || afterText, beforeLen);
                if (selStart < 0)
                    selStart = beforeLen;
                selEnd = dmp.match_main(value, afterText, beforeInsideLen);
                if (selEnd < 0)
                    selEnd = beforeInsideLen;
            }
        }
        
        var doms = this.diffDecorate(last, other, value, selStart, selEnd);
        // console.log('TextRender : '+last+' , '+other+' , '+value+' , '+doms.join(''));
        // null and '' is diff
        var domValue = editDom && editDom.textContent;
        var valueHtml;
        if (!this.focusAt && value !== domValue) {
            
            if (selStart >= 0 && selEnd >= 0) {
                var before = value.substr(0, selStart);
                var inside = value.substr(selStart, selEnd);
                var after = value.substr(selEnd);
                this.renderSelId = Math.random()+'';
                valueHtml = t2h(before) + '<span id="selStart'+this.renderSelId+'"></span>' + t2h(inside) + '<span id="selEnd'+this.renderSelId+'"></span>' + t2h(after);
            } else {
                valueHtml = t2h(value);
            }
                
            // saved, prevent react change the dom
            this._reactValueHtml = valueHtml; 
        } else {
            // hope reactjs won't change it
            valueHtml = this._reactValueHtml;
        }


        var editDom = this.transferPropsTo(
                <div ref="edit" className="edit plain needsfocus needsclick" contentEditable="true"
                    onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus} onBlur={this.onBlur}
                    dangerouslySetInnerHTML={{__html:valueHtml}}
                ></div>);
        
        var underClass = "under"+(this.props.showDraftOut?' diffout':'');
        var under = <div ref="under" className={underClass} dangerouslySetInnerHTML={{__html:doms.join('')}}></div>;
        
        return (
            <div className="Text">
                {editDom}
                {under}
            </div>
        );
    },
    
    diffDecorate: function(last, other, value, selStart, selEnd){
        var doms = [];
        // diff decorate
        // value(md/text) + last,other -> o2v,r2v -> html1,2 -> value(md/text)
        var r2v, o2v;
        if (other != last) {
            var reverse = dmp.patch_apply( dmp.patch_make(other, last), value )[0]
            r2v = dmp.diff_main(reverse, value);
            dmp.diff_cleanupSemantic(r2v);
        } else {
            r2v = [];
        }
        if (other != value) {
            o2v = dmp.diff_main(other, value);
            dmp.diff_cleanupSemantic(o2v);
        } else {
            o2v = [[DIFF_EQUAL, value]];
        }
        
        // drop all del content
        var diffPair = [o2v, r2v];
        diffPair.forEach(function(diff){
            diff.forEach(function(d){
                if (d[0] == DIFF_DELETE) 
                    d[1] = '';
            });
        });
        
        var charUsed = 0;
        while (diffPair[0].length > 0 || diffPair[1].length > 0) {
            var heads = [ diffPair[0][0], diffPair[1][0] ];
            
            // use the shorter one
            var use = !heads[0]?1 : !heads[1]?0 :  (heads[0][1].length <= heads[1][1].length)?0:1;
            var not = (use + 1) % 2;
            
            var text = heads[use][1];
            if (text.length > 0 && heads[not])
                // cut the longer side
                heads[not][1] = heads[not][1].substr(0, text.length);

            var charWillUsed = charUsed + text.length;
            
            // use class to decorate both side operation
            var op = heads[use][0];    // Operation (insert, delete, equal)
            var myClaz = SideClaz[use]+DiffClaz[op+1];
            if (op == DIFF_DELETE) {
                doms.push( '<del class="'+myClaz+'"><del></del></del>' );
            } else if (text || charWillUsed == value.length) {
                var notClaz = heads[not] ? ' '+SideClaz[not]+DiffClaz[heads[not][0]+1] : '';
                var content = null;
                
//                if (selStart >= 0) {
//                    var textBefore = '', textAfter = '', start = '', end = '';
//                    if (selStart >= charUsed && (selStart < charWillUsed || charWillUsed == value.length)) {
//                        start = '<span id="selStart"></span>';
//                        this.hasRenderSel = true; 
//                        
//                        var relStart = selStart - charUsed;
//                        textBefore = text.substr(0, relStart)
//                        text = text.substr(relStart);
//                        
//                        charUsed += relStart;
//                        charWillUsed = charUsed + text.length;
//                    }
//                    if (selEnd >= charUsed && (selEnd < charWillUsed || charWillUsed == value.length)) {
//                        end = '<span id="selEnd"></span>';
//                        this.hasRenderSel = true;
//                        
//                        var relEnd = selEnd - charUsed;
//                        textAfter = text.substr(relEnd);
//                        text = text.substr(0, relEnd)
//                    }
//                    charUsed = charWillUsed;
//                    content = t2h(textBefore) + (start) + t2h(text) + (end) + t2h(textAfter);
//                } else {
                    content = t2h(text);
//                }
                
                if (content)
                    doms.push( '<span class="'+myClaz+notClaz+'">'+content+'</span>' );
            }
            diffPair[use].shift();
        }
        return doms;
    },
    
    didRender: function(prevProps, prevState, dom){
        if (this.renderSelId) {
            var start = document.getElementById('selStart'+this.renderSelId);
            var end = document.getElementById('selEnd'+this.renderSelId);
            if (start || end) {
                var sel = rangy.getSelection();
                var range = rangy.createRange();
                if (start)
                    range.setStartAfter(start, 0);
                if (end)
                    range.setEndBefore(end, 0);
                sel.removeAllRanges();
                sel.addRange(range);
                //console.log('Re-select : '+this.getDomValue() );
            }
            delete this.renderSelId;
        }
    },
    
    onKeyUp: function(e){
        this._setText();
    },
    _setText: function(){
        var value = this.getDomValue();
        if (!value || value.trim() == '')
            value = '';
        var node = this.props.node;
        if (node && value != node.text) {
            node.text = value;
            
            // mark re-render in order to update the style
            if (!this.setTextTimer)
                this.setTextTimer = setTimeout(this._afterSetText, 1000);
        }
    },
    _afterSetText: function(){
        clearTimeout(this.setTextTimer);
        delete this.setTextTimer;
        var node = this.props.node;
        if (node)
            node.draft();
        //this.forceUpdate();
    },
    _fullSetText: function(){
        this._setText();
        // if have set text, need to draft and re-render
        if (this.setTextTimer)
            this._afterSetText();
    },
    onBlur: function(e){
        this.focusAt = null;
        this._fullSetText();
    },
    onFocus: function(e){
        this.focusAt = Date.now();
    },
    
    getEditDom: function(){
        return this.refs && this.refs.edit && this.refs.edit.getDOMNode();  
    },
    getDomValue: function(){
        var edit = this.getEditDom();
        return edit && edit.textContent || '';
    }, 

    
//    focus: function(){
//        var sel = rangy.getSelection();
//        var range = rangy.createRange();
//        var editDom = this.getEditDom();
//        range.setStart(editDom, 0);
//        range.setEnd(editDom, 0);
//        sel.removeAllRanges();
//        sel.addRange(range);
//    },
//    getCaret: function(){
//        var sel = rangy.getSelection();
//        var range = sel.rangeCount > 0 ? sel.getRangeAt(sel.rangeCount - 1) : null;
//        if (range) {
//            var beforeRange = range.cloneRange();
//            beforeRange.collapse(true);
//            var editDom = this.getEditDom();
//            beforeRange.setStart(editDom, 0);
//            
//            var beforeText = beforeRange.cloneContents().textContent || '';
//            var selRangeText = range.cloneContents().textContent || '';
//            //var domValue = editDom.textContent || '';
//            
//            var start = beforeText.length;
//            var end = start + selRangeText.length;
//            //console.log('|', this.getDomValue(), '|', beforeText, '|', selRangeText);
//            return [start, end, beforeText, selRangeText]; 
//        }
//    },
});



//static
var dmp = new diff_match_patch();
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;
var pattern_amp = /&/g;
var pattern_lt = /</g;
var pattern_gt = />/g;
var pattern_para = /\n/g;
var SideClaz= ['my', 'other'];
var DiffClaz= ['-del', '-eq', '-ins'];

// TODO: also convert md to html, make sure no width different
var t2h = function(text){
    if (!text)
        return '';
    text = text.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;').replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br/>');
    return text;
}



////if (window.deviceDetected != 'desktop') {
//(function(){
//    // keyboard detection
//    var winEl = $(window);
//    var originalW = winEl.width();
//    var originalH = winEl.height();
//    var minD = Math.min(originalW, originalH);
//    var maxD = Math.max(originalW, originalH);
//    var keyboardShown = false;
//    window.addEventListener("resize", function() {
//        // detect keyboard shown
//        var w = winEl.width();
//        var h = winEl.height();
//        // portrait (w is closer to minD)
//        var isPortrait = Math.abs(w-minD) < Math.abs(w-maxD);
//        var shown = false;
//        if (isPortrait && h < maxD * 0.8) {
//            shown = true;
//        } else if (!isPortrait && h < minD * 0.7) {
//            shown = true;
//        }
//        if (shown != keyboardShown) {
//            keyboardShown = shown;
//            
//            $('body').toggleClass('softKeyboard', shown);
//            
//            var el = shown ? $(document.activeElement) : $('.keyboard_position');
//            el.toggleClass('keyboard_position', shown);
//            
//            var comp = el.data('react');
//            if (comp && comp.props.onKeyboard) {
//                comp.props.onKeyboard(shown);
//            }
//        }
//    });
//})();
////}

})(typeof window != 'undefined' ? window : global);