/** @jsx React.DOM */

var StationLinkPage = React.createClass({
    mixins: [MyMixin],
    
    getInitialState: function() {
        return {};
    },
    componentDidMount: function(){
        E.ajax('token', {action:'status', tree:this.props.tree._id}, function(output){
            if (output)
                this.setState(output);
        }.bind(this));
    },
    
    render: function() {
        var tree = this.props.tree;
        var state = this.state;
        
        var accessLink = state.accessUrl && state.token ? state.accessUrl+'/'+state.token : '----';
        
        return (
            <CommonPage className="StationLinkPage" title='Pilot Link Share'>
                <div className="container pageMarginTop">                

                    {React.if(state.token || state.isAdmin, (
                        <div className="panel panel-info">
                            <div className="panel-body">
                                Let others access by <a className="nowrap" href={accessLink} target="_blank">{accessLink}</a>
                                {React.if(state.token && state.wifiName, (
                                    <div>(Make sure they joined Wifi <strong className="nowrap">{'"'+(state.wifiName || '----')+'"'}</strong>)</div>
                                ))}
                            </div>
                            {React.if(state.isAdmin, (
                                <ul className="list-group">
                                    <li className="list-group-item">
                                        <div className="btn-group btn-group-justified" data-toggle="buttons">
                                            <label className={"btn btn-default "+(state.token&&'active')} onClick={_.partial(this.on_toogle, true)}>
                                                <input type="radio" defaultChecked={state.token}/> Turn On
                                            </label>
                                            <label className={"btn btn-default "+(!state.token&&'active')} onClick={_.partial(this.on_toogle, false)}>
                                                <input type="radio" defaultChecked={!state.token} /> Turn Off
                                            </label>
                                        </div>
                                        <div className="btn-group btn-group-justified" data-toggle="buttons" style={{marginTop:'10px'}}>
                                            <label className={"btn btn-default "+(state.isWifiStation&&'active')} onClick={_.partial(this.onWifiChange, true)}>
                                                <input type="radio" /> Wifi Station On
                                            </label>
                                            <label className={"btn btn-default "+(!state.isWifiStation&&'active')} onClick={_.partial(this.onWifiChange, false)}>
                                                <input type="radio" /> Wifi Station Off
                                            </label>
                                        </div>
                                    </li>
                                </ul> 
                            ))}
                        </div>                            
                    ))}
                    
                </div>    
            </CommonPage>
        )
    },
    
    on_toogle: function(value){
        var tree = this.props.tree;
        if (value && !tree.master._id) {
            var ok = confirm('Need to save first. Save now?');
            if (!ok)
                return;
            tree.checkin(function(){
            }.bind(this));
        }
        E.ajax('token', {action:'switch', value:value, tree:this.props.tree._id}, function(output){
            if (output)
                this.setState(output);
        }.bind(this));        
    },
    
    onWifiChange: function(value){
        E.ajax('setWifiStation', {enable:value}, this.componentDidMount);
    },
});
