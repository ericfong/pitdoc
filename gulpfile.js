var Path = require('path');
var fs = require('fs');
var _ = require('underscore');
var gulp = require('gulp');
var lazypipe = require('lazypipe');
var through2 = require('through2');
var exec = require('child_process').exec;
var P = require("gulp-load-plugins")();
//P.grunt(gulp);

var isWatch = false;
gulp.task('setWatch', function(){ isWatch = true });


gulp.task('less', function () {
    var styleDir = 'web/style';
    gulp.src(["web/style/bootstrap.less", "web/style/style.less"])
    .pipe(P.plumber())
    .pipe(P.less({
        paths: [ 'web/style', 'web/ext' ]
    }))
    .pipe( P.replace(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gm, function(match, src) {
        // remove params in urls
        var cssResPath = src.replace(/[?#].*$/, '');
        // absolute path
        var absPath = cssResPath[0] == '/' ? cssResPath : Path.join(styleDir, cssResPath).replace(/\\/g, '/');
        if (fs.existsSync(absPath)) {
//            if (isProduction) {
//                absPath = versionFile(absPath);
//                //cssResPath = Path.relative('/'+Path.dirname(cssFile), '/'+absPath);
//                cssResPath = Path.basename(absPath);
//            }
            gulp.src(absPath).pipe(dest('gen/style'));
            cssResPath = Path.basename(absPath);
            //console.log(absPath, match.replace(src, cssResPath));
//            files.unshift(absPath);
        }
        return match.replace(src, cssResPath);
    }) )
    .pipe( gulp.dest('gen/style') )
    .pipe(dest('gen/style'))
    .pipe( gruntStream() )
    
    if (isWatch)
        gulp.watch(["web/style/*.less"], ['less'])
});


gulp.task('react', function(){
    var glob = 'web/react/**/*.js';
    (isWatch ? P.watch({glob:glob}).pipe(P.plumber()) : gulp.src(glob))
    .pipe(P.react())
    .pipe( gulp.dest('gen/react') )
    .pipe(dest('gen/react'))
    .pipe( gruntStream() )
});


gulp.task('js', function(){
    var glob = 'web/eddyy/**/*.js';
    (isWatch ? P.watch({glob:glob}).pipe(P.plumber()) : gulp.src(glob))
    .pipe(dest('web/eddyy'))
    .pipe( gruntStream() )
    
    var glob = 'web/*.js';
    (isWatch ? P.watch({glob:glob}).pipe(P.plumber()) : gulp.src(glob))
    .pipe(dest('web'))
    .pipe( gruntStream() )
});

gulp.task('distStatic', function(){
    var glob = 'web/static/**/*.*'
    P.watch({glob:glob}).pipe(P.plumber())
    .pipe(dest('web/static'))
});

gulp.task('build', ['less', 'react', 'js']);
gulp.task('default', ['setWatch', 'build']);


var dest = function(dest){
    return lazypipe()
    .pipe(gulp.dest, 'platforms/gae/war/'+dest)
    //.pipe( P.filelog )
    .pipe(gulp.dest, 'platforms/android/assets/www/'+dest)
    //.pipe( P.filelog )
    ()
}

var shell = function(cmd, cb) {
    var child = exec(cmd, function (error, stdout, stderr) {
        if (cb)
            cb(stdout);
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
//    process.stdin.resume();
//    process.stdin.setEncoding('utf8');
//    process.stdin.pipe(child.stdin);
}
var gruntCall = _.debounce(function(){
    //console.log(new Date());
    shell('grunt build');
}, 2000, true)    
var gruntStream = function(){
    return through2.obj(function(file, enc, callback) {
        gruntCall();
        this.push(file);
        return callback();
    })
}
function copy(src, dest) {
    fs.writeFileSync(dest, fs.readFileSync(src));
}