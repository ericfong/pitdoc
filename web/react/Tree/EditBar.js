/** @jsx React.DOM */

var TreeEditBar = React.createClass({
    mixins: [MyMixin],
    
    componentDidMount: function(){
        var tree = this.props.tree;
        if (tree) {
            tree.on('remoteNewMaster', this.remoteNewMaster);
        }
    },
    componentWillUnmount: function(){
        var tree = this.props.tree;
        if (tree) {
            tree.off('remoteNewMaster', this.remoteNewMaster);
        }
    },
    remoteNewMaster: function(tree, serverId){
        var newState = {};
        newState[serverId] = {type:'remoteNewMaster'};
        this.setState(newState);
    },
    render: function() {
        var state = this.state || {};
        var tree = this.props.tree;
        var stage = tree && tree.getStage();
        var isEdit = this.props.isEdit;
        
        var canSubmit = stage && !stage._id;
        
        var mainBtn = null;
//        var hasOtherMembers = tree && tree.hasOtherMembers();
//        if (hasOtherMembers) {
//            mainBtn = <button ref="submitBtn" key="send" className="btn btn-transparent navbar-btn" onClick={this.onSubmit}><span className="glyphicon glyphicon-send"></span> Submit</button>;
//        } else {
//            mainBtn = <button className="btn btn-transparent navbar-btn" onClick={this.onShare}><span className="glyphicon glyphicon-share-alt"></span> Share</button>;
//        }
        
        var account = E.getPitAccount() || {};
        
        var serverUrl = React.serverUrl+'/view-'+tree._id;
        
        return (
        <div>
            <nav className="navbar-base">
                <div className="navbar navbar-fixed-top navbar-default">
                    <div className="container">

                        <ul className="nav navbar-nav">
                            <li>
                                <a href="#" onClick={this.onInbox}><span className="fa fa-folder-open-o"></span><span className="hidden-xs"> Locals</span></a>
                            </li>
                            
                            <li><a href="#" onClick={this.onCreate}><span className="fa fa-file-o"></span><span className="hidden-xs"> New Page</span></a></li>
                            
                        </ul>
                        
                        <ul className="nav navbar-nav navbar-right">
                        
                            <li className="dropdown">
                              <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-xs">More </span><span className="fa fa-fw fa-bars"></span></a>
                              <ul className="dropdown-menu">
                              
                                  <li><a href="#" onClick={this.onReset}><span className="fa fa-fw fa-eraser"/> Reset</a></li>
                              
                                  {account._id ? (
                                      <li><a href={"#Accounts"}><span className="fa fa-fw fa-user"/><span> <small>{account._id}</small></span></a></li>                                                    
                                  ) : (
                                      <li><a href={"#Accounts"}><span className="fa fa-fw fa-user"/><span> Account</span></a></li>                                                    
                                  )}
                                  
                              </ul>
                            </li>
                            
                        </ul>
                        
                    </div>
                </div>
            </nav>
            
            {state.control && (
            <div className="local">
                <div className="container">
                    {state.control == 'Inbox' && Catalog({ref:'catalog', onCloseInbox:this.onCloseInbox}) }
                </div>
            </div>
            )}
            
            <div className="container" style={{marginTop:20}}>
                
                {_.map(E._servers, function(server){
                    var remote = tree._remotes[server._id];
                    var msgDom = null;
                    var submitDisabled = false; 
                    var status = state[server._id];
                    if (status) {
                        if (status.type == 'remoteNewMaster') {
                            submitDisabled = true;
                            msgDom = <a href="#" className="list-group-item list-group-item-danger" onClick={this.onMerge}>Merge new verion sent by {remote.master.author.email} at {React.timeAbsString(remote.master.time)}</a>;
                        } else if (status.type == 'Cannot Login') {
                            msgDom = <a href="#" className="list-group-item list-group-item-danger" onClick={_.partial(this.onLogin, server)}>Cannot Login! Try login {status.authorId} and Up&amp;Merge again.</a>;
                        } else if (status.type == 'error') {
                            msgDom = <li className="list-group-item list-group-item-danger">{status.message}</li>;
                        } else if (status.type == 'success') {
                            msgDom = <a href={server._userHost+'/view-'+tree._id} className="list-group-item list-group-item-success">Done. View the server version.</a>;
                        }
                    }
                    return (
                            <div className="panel panel-default" key={server._id}>
                            <div className="panel-body positionRelative">
                                <button className={"btn btn-primary remoteBtn "+(submitDisabled ? ' disabled' : '')} onClick={this.onSubmit}>
                                    <span className="glyphicon glyphicon-export"></span>{' '}<span className="hidden-xs">Send</span>
                                </button>
                                <span className="glyphicon glyphicon-globe"></span>{' '}<a href={server._userHost+'/view-'+tree._id} target="_blank">{server._userHost+'/view-'+tree._id}</a>
                            </div>
                            {msgDom && <ul className="list-group">{msgDom}</ul>}
                          </div>
                            );
                }, this)}
                
            </div>
        </div>
            )
        /*
         *
                <div className="server-box">
                    <a href={serverUrl}>{serverUrl}</a>
                    <button className="btn btn-default server-btn" onClick={this.onSubmit}>
                        <span className="glyphicon glyphicon-cloud-upload"></span> <span className="hidden-xs">Send</span>
                    </button>
                </div>
                {alert && (
                    <div ref="alert" className={"alert alert-"+alert.type+" alert-dismissable"}>
                        <button type="button" className="close" aria-hidden="true" onClick={(function(){ this.setState({alert:null}); }).bind(this)}>&times;</button>
                        {alert.message}
                    </div>
                )}
                
         *{E.isAppClient && <li><a href={"#"+(tree && tree._id)+"/StationLink"}><span className="fa fa-fw fa-rss"></span><span> Pilot Link Share</span></a></li>}
         *
         * <li><a href="#" onClick={this.onSetupAuthor}>{authorDisplay ? <small>Author as "{authorDisplay}"</small> : 'Setup Author'}</a></li>
         * 
         * <button id="picture_btn" className="btn btn-link btn-nav pull-right" onClick={this.onPicture}><i className="fa fa-picture"></i></button>
         * 
         * <button className="btn btn-link btn-icon" onClick={this.onTrash}><span className="fa fa-fw fa-trash-o"></span></button> <button className="btn btn-link btn-icon"
         * onClick={this.onCloseEdit}><span className="fa fa-times-circle-o"></span></button> <button className="btn btn-link btn-icon" onClick={this.onEditClick}><span className="fa fa-fw fa-edit
         * text-primary"></span></button>
         */
    },
    
    onReset: function(){
        var tree = this.props.tree;
        tree.stage = new E.Commit(tree.master._id, tree);
        E.save();
        tree.stage.loadAllSubs(function(){
            //tree.emit('stageUpdated');
            E.saveFlush(function(){
                location.reload();
            });
        });
    },
    
    onMerge: function(){
        var tree = this.props.tree;
        tree.mergeRemotes(function(){
            var newState = {};
            var server = E.getPithwayServer();
            newState[server._id] = null;
            this.setState(newState);
        }.bind(this));
    },
    
    onInbox: function(){
        var state = this.state || {};
        if (state.control != 'Inbox')
            this.setState({control:'Inbox'});
        else
            this.setState({control:null});
    },
    onCloseInbox: function(){
        this.setState({control:null});
    },
    
    onCreate: function() {
        // prompt for name
        var name = prompt("The Name","New");
        if (name) {
            var tree = E.Tree.create(name);
            main.go(tree._id);
        }
    },
    
//    onShare: function(cb){
//        
//        AccountsPage.ensureAccount(function(hasAccount){
//            if (hasAccount) {
//                var tree = this.props.tree;
//                if (!tree.master._id)
//                    tree.checkin();
//                // fix this link
//                var link = location.href;
//                var dom = (
//                    <div className="modal-content">
//                        <div className="modal-header">
//                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">&times;</button>
//                            <h4 className="modal-title">Share Link</h4>
//                        </div>
//                        <div className="modal-body">
//                        
//                            <div className="form-group">
//                                {/*<label htmlFor="link" className="control-label">Share Link</label>*/}
//                                <input type="text" className="form-control" id="link" value={link}/>
//                            </div>
//                                
//                            <div className="text-right">
//                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
//                            </div>
//                        </div>
//                    </div>        
//                    );
//                Dialog.open(dom);
//            }
//        }.bind(this));        
//    },
    
    onSubmit: function(e){
        var comp = this;
        var server = E.getPithwayServer();
        var account = E.getPitAccount() || {};
        var tree = this.props.tree;
        
        var pushHandler = function(result){
            var newState = {};
            if (result && result.error) {
                var error = result.error;
                if (error == "Cannot Login") {
                    var authorId = tree.getAuthorId();
                    newState[server._id] = {type:'Cannot Login', authorId:authorId};
                } else {
                    newState[server._id] = {type:'error', message:error};
                }
            } else if (result) {
                newState[server._id] = {type:'success'};
            }
            this.setState(newState);
        }.bind(this)
        
        if (!account._id) {
            AccountsPage.setEmail('For identifying your works, please setup your author email.', function(submited){
                if (submited) {
                    this.props.tree.push(pushHandler);
                }
            }.bind(this));
        } else {
            this.props.tree.push(pushHandler);
        }
    },

    onLogin: function(server){
        var account = E.getPitAccount() || {};
        Dialog.open(SetAccountDialog({server:server, account:account, mode:'Log-In'}), function(hasAccount){
            //if (hasAccount)
                //comp.onCloseAlert();
        });
    },
    
    /*
    onPicture: function(e){
        var self = this;
// if (navigator.camera) {
// navigator.camera.getPicture(onSuccess, onFail, {
// quality : 100,
// sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
// destinationType: Camera.DestinationType.DATA_URL
// });
// function onSuccess(imageData) {
// return self.addPicture({}, null, "data:image/jpeg;base64,"+imageData);
// }
// function onFail(message) {
// alert('Failed because: ' + message);
// }
// } else {
            // appcache || chrome
            var el = this.$();
            // create and attach the input[type=file]
            var inputFileEl = $('<input type="file" multiple id="inputFile"  style="visibility:hidden;height:0px"></input>').appendTo(el);
            // android need to wait until the dom is added
            setTimeout(function(){
                // on change event handler
                inputFileEl.change(function(e) {
                    // remove input
                    inputFileEl.remove();
                    
                    // readFiles
                    var files = e.target.files;
                    if (!files || files.length <= 0)
                        return;
                    var errors = [];
                    for (var i = 0; i < files.length; i++) {
                        if ( ! readFile(files[i]) )
                            errors.push(files[i]);
                    }
                    if (errors.length > 0)
                        console.log(errors);
                });
                // click 'input[type=file]' to open the native file dialog box
                inputFileEl.click();
            }, 16);
            
            function readFile(file) {
                var reader = new FileReader();
                if (file.type.indexOf('text/') == 0) {
// reader.onload = function(e) {
// };
// reader.readAsText(file);
                    return false;
                } else {
                    // assume binary image?
                    reader.onload = function(e) {
                        var fileBinaryStr = e.target.result;
                        var node = {
                            fileName: file.name || file.fileName,
                            fileMime: file.type || 'application/binary',
                            fileMtime: file.lastModifiedDate && file.lastModifiedDate.getTime(),
                            fileSize: file.size || file.fileSize,
                            _fileBinaryStr: fileBinaryStr,
                            _fileDataUrl: null,
                        }
                        var binaryFile = new BinaryFile(fileBinaryStr);
                        var exif = EXIF.readFromBinaryFile(binaryFile);
                        
                        // fileTime
                        var dateStr = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime;
                        node.fileTime = dateStr ? new Date( dateStr.replace(/^(\d{4}):(\d{2}):/g, '$1-$2-') ).getTime() : null;
                        if (!node.fileTime && file.lastModifiedDate)
                            node.fileTime = file.lastModifiedDate.getTime();
                        
                        // date part in the fileTime
                        var dateStr = new Date(node.fileTime).toISOString().substr(0, 10)
                        node.fileId = node.fileMime+'/'+dateStr+'/'+node.fileName;
                        
                        console.log(node.fileId, node.fileTime, node.fileMtime);
                        edd.put(node.fileId, fileBinaryStr);
                        
                        return self.addPicture(node);
                    };
                    reader.readAsBinaryString(file);
                }
                return true;
            }
// }
    },
    addPicture: function(file){
        // data from file object
        var data = file;
        data.text = file.fileName;
        
        var node = this.state.node;
        var newChild = new E.Node(data, node);
        node.getSubs().unshift(newChild);
        newChild.draft();
        this.replaceState(node);
    },    
    */
});
