var fs = require('fs');
var React = require('react');
var glob = require('glob');

var _ = require('underscore');

var base = [
       // Non UI
       //'web/ext/underscore/underscore.js',
       //'web/ext/underscore.string/dist/underscore.string.min.js',
       'web/ext/google-diff-match-patch-js/diff_match_patch.js',
//       'web/ext/jszip/jszip.min.js',
//       'web/ext-util/BinaryFile.js',
//       'web/ext-util/EXIF.js',
       'web/ext-util/Sha.js',
       'web/ext-util/Json2.js',
       'web/ext-util/Wait.js',
       //'web/ext/uri.js/src/URI.min.js',
       //'web/util/underscore-mixins.js',
       
       'web/eddyy/E.js',
       'web/eddyy/E.util.js',
       'web/eddyy/E.Base.js',
       'web/eddyy/E.Node.js',
       'web/eddyy/E.Commit.js',
       'web/eddyy/E.Tree.js',
       'web/eddyy/E.Tree_More.js',
       'web/eddyy/E.Tree_Global.js',
       'web/eddyy/E.Server.js',
       
       // UI
       'web/util/react-mixins.js',
       'web/ext-util/dateFormat.js',
       ];


glob("../gen/react/**/*.js", function (er, files) {
    
    for (var i = 0, ii = base.length; i < ii; i++) {
        var file = base[i];
        console.error('eval: ',file);
        eval(fs.readFileSync('../'+file)+'');
    }
    
    for (var i = 0, ii = files.length; i < ii; i++) {
        var file = files[i];
        console.error('eval: ',file);
        eval(fs.readFileSync(file)+'');
    }
    
    
    
    var html = React.renderComponentToString(Main({isServerRender:true}));
    console.log(html);
    
})
