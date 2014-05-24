/** @jsx React.DOM */

var TreeNavBar = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var state = this.state || {};
        var tree = this.props.tree;
        var stage = tree && tree.getStage();
        var node = this.props.node;
        var isEdit = this.props.isEdit;
        var backHref = (node && node._parent instanceof E.Node) ? '#'+tree._id+'/~'+node._parent.oid : '#/';
        
        var canSubmit = stage && !stage._id;
        
        var mainBtn = null;
//        var hasOtherMembers = tree && tree.hasOtherMembers();
//        if (hasOtherMembers) {
//            mainBtn = <button ref="submitBtn" key="send" className="btn btn-transparent navbar-btn" onClick={this.onSubmit}><span className="glyphicon glyphicon-send"></span> Submit</button>;
//        } else {
//            mainBtn = <button className="btn btn-transparent navbar-btn" onClick={this.onShare}><span className="glyphicon glyphicon-share-alt"></span> Share</button>;
//        }
            
        var account = E.getPitAccount() || {};
        
        var isDown = tree && E.Tree.get(tree._id);
        
        return (
        <div>
            <nav className="navbar-base">
                <div className="navbar navbar-default navbar-fixed-top navbar-inverse">
                    <div className="container">
                    
                        <ul className="nav navbar-nav">
                            <li>
                                <a href="#" onClick={this.onInbox}><span className="fa fa-folder-open-o"></span><span className="hidden-xs"> Locals</span></a>
                            </li>
                            
                            <li><a href="#" onClick={this.onCreate}><span className="fa fa-file-o"></span><span className="hidden-xs"> New Page</span></a></li>
                            
                        </ul>
                        
                        <ul className="nav navbar-nav navbar-right">
                            {tree && <li className={isDown && 'active'}><a href={'/#'+tree._id}><span className="glyphicon glyphicon-import"></span><span className="hidden-xs"> Down&amp;Edit</span></a></li>}
                            
                            {account._id ? (
                                <li><a href={"#Accounts"}><span className="fa fa-fw fa-user"/><span> <small className="hidden-xs">{account._id}</small></span></a></li>                                                    
                            ) : (
                                <li><a href="#" onClick={this.onLogin}><span className="fa fa-fw fa-user"/><span><span className="hidden-xs"> Login</span></span></a></li>                                                    
                            )}
                            
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
        </div>
            )
        /*
         *
         * {<li><a href="#" onClick={this.onShare}><span className="glyphicon glyphicon-share-alt"></span> Share</a></li>}
         * 
         * <li><a href="#" onClick={this.onSetupAuthor}>{authorDisplay ? <small>Author as "{authorDisplay}"</small> : 'Setup Author'}</a></li>
         * 
         * <li><a href={"#"+(tree && tree._id)+"/AddMember"}><span className="fa fa-fw fa-plus"></span><span> Add Member</span></a></li>
         * 
         * <button id="picture_btn" className="btn btn-link btn-nav pull-right" onClick={this.onPicture}><i className="fa fa-picture"></i></button>
         * 
         * <button className="btn btn-link btn-icon" onClick={this.onTrash}><span className="fa fa-fw fa-trash-o"></span></button> <button className="btn btn-link btn-icon"
         * onClick={this.onCloseEdit}><span className="fa fa-times-circle-o"></span></button> <button className="btn btn-link btn-icon" onClick={this.onEditClick}><span className="fa fa-fw fa-edit
         * text-primary"></span></button>
         */
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

    onLogin: function(){
        AccountsPage.ensureAccount(function(hasAccount){
            if (hasAccount) {
                this.forceUpdate();
            }
        }.bind(this));        
    },
    
    onShare: function(){
        AccountsPage.ensureAccount(function(hasAccount){
            if (hasAccount) {
                var tree = this.props.tree;
                if (!tree.master._id)
                    tree.checkin();
                // fix this link
                var link = location.href;
                var dom = (
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 className="modal-title">Share Link</h4>
                        </div>
                        <div className="modal-body">
                        
                            <div className="form-group">
                                {/*<label htmlFor="link" className="control-label">Share Link</label>*/}
                                <input type="text" className="form-control" id="link" value={link}/>
                            </div>
                                
                            <div className="text-right">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>        
                    );
                Dialog.open(dom);
            }
        }.bind(this));        
    },
    
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
});
