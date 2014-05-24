module.exports = function(grunt) {
    var util = require('./util')(grunt);
    var shell = util.shell;
    var fileReplace = util.fileReplace;
    
    grunt.registerTask('version', 'follow the tag version', function() {
        var done = this.async();
        shell('git tag -l | tail -n 1', function(stdout){
            var version = stdout.trim(); 

            fileReplace('platforms/gae/war/WEB-INF/appengine-web.xml', /<version>[^\/]+<\/version>/, '<version>'+version.replace(/\./g, '-')+'</version>');
            
            done();
        });
    });
    
};
    