module.exports = function() {
    /*
     * deviceType = [mobile / tablet / desktop]
     *  
     * phonegap : mobile
     * chrome : desktop
     * appcache : mobile / desktop
     * gae: mobile / desktop
     */
    var requires = {
        base: [
                'gen/style/bootstrap.css', 
                'gen/style/style.css',
                
                // Non UI
                'web/ext/underscore/underscore.js',
                'web/ext/underscore.string/dist/underscore.string.min.js',
                'web/ext/jszip/jszip.min.js',
                'web/ext/google-diff-match-patch-js/diff_match_patch.js',
                'web/ext-util/BinaryFile.js',
                'web/ext-util/EXIF.js',
                'web/ext-util/Sha.js',
                'web/ext-util/Json2.js',
                'web/ext-util/Wait.js',
                //'web/ext-util/parseUri.js',
                'web/ext/uri.js/src/URI.min.js',
                'web/util/underscore-mixins.js',
                
                'web/eddyy/E.js',
                'web/eddyy/E.util.js',
                'web/eddyy/E.Base.js',
                'web/eddyy/E.Node.js',
                'web/eddyy/E.Commit.js',
                'web/eddyy/E.Tree.js',
                'web/eddyy/E.Tree_More.js',
                'web/eddyy/E.Tree_Global.js',
                'web/eddyy/E.Server.js',
                
                // Before Render
                'web/ext/react/react-with-addons.js',
                
                // UI
                'web/ext/raf.js/raf.min.js',
                'web/ext/jquery/dist/jquery.min.js',
                //'web/ext/jquery/jquery.min.map',
                'web/ext/jquery-ui/ui/jquery.ui.position.js',
                'web/ext/jquery.transit/jquery.transit.js',
                'web/ext/bootstrap/dist/js/bootstrap.min.js',
                //'web/ext/iscroll/build/iscroll.js',
                'web/ext-util/dateFormat.js',
                'web/ext-util/fastclick.js',
                'web/ext-util/slip.js',
                
                'web/util/jquery-mixins.js',
                'web/util/react-mixins.js',
                //'web/util/touchEvents.js',
                'web/ext/rangy/rangy-core.js',
                'web/util/iskey.js',
                
                //for text-paste.js
                //'utils/Mark.js',
                //'utils/html-sanitizer.js',
                ],
                
                
        gae: ['web/eddyy/Web.js', 'web/eddyy/Gae.js'],
        
        cordova: ['cordova.js', 'web/eddyy/App.js', 'web/eddyy/AppCordova.js'],
        appDev: ['web/eddyy/App.js', 'web/eddyy/AppDev.js'],
        web: ['web/eddyy/Web.js'],
        
        test: ['web/eddyy/Web.js', 'web/test/test.js'],
    };
    
    

    if (__filename in require.cache) {
        // always refresh requires.js
        delete require.cache[__filename];
    } else {
        console.warn("Cannot always refresh requires.js");
    }
    return requires;
}
