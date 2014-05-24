
var caches = {};

function getItem(key) {
    return caches[key];
}
function setItem(key, value) {
    caches[key] = value;
}
function removeItem(key) {
    delete caches[key];
}

// on result from sandboxed frame:
window.addEventListener('message', function(e) {
    var id = e.data.id;
    var method = e.data.method;
    var url = e.data.url;
    var body = e.data.body;
    var headers = e.data.headers;
    
    function callback(resBody, resHeaders){
        document.getElementById('theFrame').contentWindow.postMessage({id:id, body:resBody, headers:resHeaders}, '*');
    }
    
    if (method == 'PUT') {
        return callback( setItem(url, body) , {store:'device'} );
    } else if (method == 'DELETE') {
        return callback( removeItem(url) , {store:'device'} );
    } else {
        if (url == 'device/index.json') {
            // combine all local changes
            var ret = {};
            for (key in caches) {
                if (_.endsWith(key, '.repo')) {
                    var repoId = key.substring(0, key.length-5);
                    var nsi = repoId.lastIndexOf('/');
                    if (nsi >= 0) {
                        var ns = repoId.substr(0, nsi);
                        var oid = repoId.substr(nsi + 1);
                        var repoData = JSON.parse( getItem(key) );
                        repoData._id = oid;
                        ret[oid] = repoData;
                    }
                }
            }
            return callback( ret , {store:'device'} );
        }
        
        var item = getItem(url);
        if (item === null) {
            // not found
            return callback(null, {});
        } else {
            return callback(item , {store:'device'});
        } 
    }

});

function galleries(){
    chrome.mediaGalleries.getMediaFileSystems({
        interactive : 'if_needed'
     }, function(results){
         results.forEach(function(item, index, arr) {
             var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(item);
             if (mData) {
                 console.log(mData);
             }
             
             var fs = item;
             var gGalleryReader = fs.root.createReader();
             gGalleryReader.readEntries(function(){
                 console.log(arguments);
             }, function(){
                 console.log(arguments);
             });
          });
     });
}