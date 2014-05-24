var exec = require('child_process').exec;
module.exports = function(grunt){
    return {
        
        shell: function(cmd, cb) {
            var child = exec(cmd, function (error, stdout, stderr) {
                cb(stdout);
            });
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.pipe(child.stdin);
        },

        fileReplace: function(filepath){
            var str = grunt.file.read(filepath);
            str = str.replace.apply(str, Array.prototype.slice.call(arguments, 1))
            grunt.file.write(filepath, str);
        },
        
    }
}
