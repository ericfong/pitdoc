/** @jsx React.DOM */
var TreeMemberList = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var tree = this.props.tree;
        var doms = [];
        if (tree && tree.hasOtherMembers()) {
            var array = [];
            if (tree) {
                _.each(tree.getMembers(), function(member, id){
                    array.push(_.extend({_id:id}, member));
                });
            }
            array = array.sort(E.util.timeSorter);
            
            //var lastTimeStr = null;
            array.forEach(function(member){
                /*
                var timeStr = React.timeAbsString(member.time);
                var timeDom = null;
                if (timeStr != lastTimeStr) {
                    timeDom = <sup className="time">{timeStr}</sup>;
                    lastTimeStr = timeStr;
                }
                var arrow = doms.length > 0 ? <span className="fa fa-arrow-left" style={{margin:'0 5px'}}/>: null;
                */
                
                var key = member._id;
                var name = member.name || member.email;
                doms.push(<span className="member" key={key}>{name}</span>)
            });
        }
        return <div className="MemberList">{doms}</div>
    },
    
});
