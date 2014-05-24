var Path = require('path');
var fs = require('fs');
var _ = require('underscore');
module.exports = function(grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.initConfig({
        watch : {
            all : {
                files : [ 'web/**', '!web/ext/**' ],
                tasks : [ 'build' ],
//                options : {
//                    // seems because we have two Gruntfile link togather. spawn will break it
//                    nospawn : true,
//                },
            },
        },
        less : {
            build : {
                options : {
                    paths : [ 'web/style', 'web/ext' ],
                },
                files : {
                    "gen/style/bootstrap.css" : "web/style/bootstrap.less",
                    "gen/style/style.css" : "web/style/style.less",
                }
            },
            dist : {
                options : {
                    paths : [ 'web/style', 'web/ext' ],
                    cleancss : true,
                    optimization : 0,
                },
                files : {
                    "gen/style/bootstrap.min.css" : "web/style/bootstrap.less",
                    "gen/style/style.min.css" : "web/style/style.less",
                }
            },
        },
        react : {
            base : { 
                files : [{
                    expand: true,
                    cwd: 'web/react/',
                    src: ['**/*.js'],
                    dest: 'gen/react',
                    ext: '.js'
                }]
            },
        },
        concat: {
        },
        uglify : {
            options : {
                preserveComments : 'some',
            },
            dist : {
                files : {
                }
            },
        },
        clean : {
            build : [ 'gen/*', 
                      'www/gen/*', 'www/web/*', 'www/gen.*', 
                      'platforms/android/assets/www/gen/*', 'platforms/android/assets/www/web/*', 'platforms/android/assets/www/gen.*',
                      'platforms/gae/war/gen/*', 'platforms/gae/war/web/*', 'platforms/gae/war/gen.*']
        },
        shell: {
            options: {
                stdout: true,
                stderr: true,
            },
            andPull: {
                command: 'rm -rf platforms/android/data/Pithway; adb pull /sdcard/Pithway platforms/android/data/Pithway; rm -rf platforms/android/data/Pithway-Raw; cp -r platforms/android/data/Pithway platforms/android/data/Pithway-Raw;'
            },
            gaeUpload: {
                command: '~/packages/appengine-java-sdk-1.8.9/bin/appcfg.sh update platforms/gae/war/'
            },
        }
    });
    
    grunt.loadTasks('Grunt_Tasks');

    //grunt.registerTask('build', [ 'less:build', 'react', 'requires', 'buildDone' ]);
    grunt.registerTask('build', [ 'requires', 'buildDone' ]);
    grunt.registerTask('dist', [ 'clean', 'useProduction', 'less', 'react', 'requires', 'setupUglify', 'concat','uglify','versioning', 'buildDone', 'useDefault' ]);
    grunt.registerTask('andDist', [ 'dist', 'android' ]);
    grunt.registerTask('gaeDist', [ 'dist', 'shell:gaeUpload' ]);
    grunt.registerTask('default', [ 'clean', 'build' ]);
    
    var isProduction = false;
    var min = '.min';
    var requires = null;
    
    // read requires files
    grunt.registerTask('requires', function() {
        requires = require('./web/requires')(grunt);

        grunt.file.expand([ 'gen/react/**/*.js' ]).sort().forEach(function(file) {
            requires.base.push(file);
        });
        
        getRes(requires.base);
    });
    // fix the generated css reference url
    function getRes(files) {
        var originals = [].concat(files);
        originals.forEach(function(cssFile, index) {
            if (!_.endsWith(cssFile, '.css') || !grunt.file.isFile(cssFile))
                return;
            
            if (isProduction)
                cssFile = cssFile.replace('.css', '.min.css');
                
            var cssContent = grunt.file.read(cssFile);
            // find all css required files, insert to cssRefs
            cssContent = cssContent.replace(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gm, function(match, src) {
                // remove params in urls
                var cssResPath = src.replace(/[?#].*$/, '');
                // absolute path
                var absPath = cssResPath[0] == '/' ? cssResPath : Path.join(Path.dirname(cssFile), cssResPath).replace(/\\/g, '/');
                if (files.indexOf(absPath) < 0 && grunt.file.isFile(absPath)) {
                    if (isProduction) {
                        absPath = versionFile(absPath);
                        //cssResPath = Path.relative('/'+Path.dirname(cssFile), '/'+absPath);
                        cssResPath = Path.basename(absPath);
                    }
                    //console.log(cssFile, absPath, match.replace(src, cssResPath));
                    files.unshift(absPath);
                }
                return match.replace(src, cssResPath);
            });
            grunt.file.write(cssFile, cssContent);
        });
    }

    
//    grunt.registerTask('genDetectJs', function() {
//        var detectJsTemp = grunt.file.read('web/detect.js');
//        if (isProduction) {
//            var detects = {desktop:requires.desktop_dist};
//            var detectJsStr = grunt.template.process(detectJsTemp, {data:{detects:detects}});
//            grunt.file.write('gen/gen.detect.js', detectJsStr);
//        } else {
//            var detects = _.pick(requires, 'desktop');
//            var detectJsStr = grunt.template.process(detectJsTemp, {data:{detects:detects}});
//            grunt.file.write('gen/gen.detect.js', detectJsStr);
//        }
//    });
    
    
    grunt.registerTask('setupUglify', function() {
        var concat = grunt.config.data.concat;
        var uglify = grunt.config.data.uglify.dist.files;

        for (var name in requires) {
            var files = concat['gen/gen.'+name+'.js'] = [];
            uglify['gen/gen.'+name+'.min.js'] = 'gen/gen.'+name+'.js';
            var distProfile = [];
            requires[name].forEach(function(file) {
                if (_.endsWith(file, '.js') && (grunt.file.isFile(file) || file == 'gen/gen.detect.js')) {
                    files.push(file);
                } else if (_.endsWith(file, '.css')) {
                    var trymin = file.replace(/\.css$/, min+'.css');
                    if (grunt.file.isFile(trymin)) {
                        distProfile.push(trymin);
                    } else {
                        distProfile.push(file);
                    }
                } else {
                    distProfile.push(file);
                }
            });
            distProfile.push('gen/gen.'+name+min+'.js');
            requires[name+'_dist'] = distProfile;
        }
    });

    
    grunt.registerTask('buildDone', function() {
        var indexSrc = grunt.file.read('web/index.html');
        var indexSrcWithoutAppCache = indexSrc.replace(' manifest="gen.index.appcache"', '');
        var copys = {};
        if (!isProduction)
            requires.base.unshift('web/dev.js');

        function genHtml(opt) {
            var files = [].concat(isProduction ? requires.base_dist : requires.base);
            
            if (opt.profile)
                files = files.concat(isProduction ? requires[opt.profile+'_dist'] : requires[opt.profile]);

            if (opt.extra)
                files = files.concat(opt.extra);
            
            // gen template
            var template = null;
            var baseDir = null;
            var relPaths = files;
            if (opt.template) {
                template = grunt.file.read(opt.template);
                baseDir = Path.dirname(opt.template);
                if (baseDir && baseDir != '.') {
                    relPaths = relPaths.map(function(file){
                        return Path.relative(baseDir, file);
                    });
                }
            } else {
                template = opt.withAppCache ? indexSrc : indexSrcWithoutAppCache;
            }
            var htmlStr = grunt.template.process(template, { data : { files : relPaths } });
            
//            // also copy js files but not load by default
//            if (requires[opt.profile].indexOf('gen/gen.detect.js') >= 0) {
//                if (isProduction) {
//                    files = files.concat('gen/gen.desktop'+min+'.js');
//                } else {
//                    var detects = _.pick(requires, 'desktop');
//                    for (var device in detects) {
//                        files = files.concat(detects[device]);
//                    }
//                }
//            }
            
            
            opt.dests.forEach(function(dest){
                grunt.file.write(dest, htmlStr);
                var destDir = Path.dirname(dest);
                if (baseDir && baseDir != '.') {
                    destDir = Path.join(destDir, baseDir.split('/').map(function(){return'..'}).join('/'))
                }
                copyFiles(files, destDir, opt.withAppCache, copys);
            });
        }
        
        // Web
        genHtml({
            withAppCache : true, profile:'web',
            dests : ['www/index.html', 'platforms/android/assets/www/index.html']
        });
        // Dev
        if (!isProduction) {
            genHtml({
                withAppCache : false, profile:'web',
                dests : ['www/gen.web.html', 'platforms/android/assets/www/gen.web.html']
            });
            genHtml({
                withAppCache : false, profile:'appDev',
                dests : ['www/gen.app.html', 'platforms/android/assets/www/gen.app.html']
            });
            genHtml({
                withAppCache : false, profile:'test',
                dests : ['www/gen.test.html', 'platforms/android/assets/www/gen.test.html']
            });
        }
        
        // cordova
        genHtml({
            withAppCache : false, profile:'cordova',
            dests : ['www/gen.cordova.html', 'platforms/android/assets/www/gen.cordova.html']
        });
//        // other files
//        grunt.file.expandMapping(['config.xml', 'res/**'], 'www', {cwd : 'web'}).forEach(function(pair) {
//            if (grunt.file.isFile(pair.src[0]))
//                grunt.file.copy(pair.src, pair.dest);
//        });
      
      
        // gae
        genHtml({
            withAppCache : true, profile:'gae',
            dests : ['platforms/gae/war/index.html']
        });
        // Dev
        if (!isProduction) {
            genHtml({
                withAppCache : false, profile:'gae',
                dests : ['platforms/gae/war/gen.gae.html']
            });
        }
        // other files
        copys['platforms/gae/war/WEB-INF/gen.index.appcache'] = 'platforms/gae/war/gen.index.appcache';
        copys['platforms/gae/war/WEB-INF/index.html'] = 'platforms/gae/war/index.html';
        grunt.file.expandMapping('**/*.*', 'platforms/gae/war/WEB-INF', {cwd:'platforms/gae/war-inf'}).forEach(function(pair) {
            grunt.file.copy(pair.src, pair.dest);
        });
//        grunt.file.expandMapping(['*.jar'], 'platforms/gae/war/WEB-INF/lib', {cwd:'java/lib'}).forEach(function(pair) {
//            grunt.file.copy(pair.src, pair.dest);
//        });


        // chrome
        genHtml({
            withAppCache : false, profile:'web',
            dests : ['platforms/chrome/www/gen.chrome.html']
        });
        
      
        // finally copy all files
        for (var dest in copys) {
            var src = copys[dest];
            //console.log(dest);
            if (src.indexOf('.ico') > 0)
                console.log(dest);
            if (grunt.file.isFile(src)) {
                grunt.file.copy(src, dest);
            } else if (['cordova.js'].indexOf(src) < 0) {
                console.log('File Not Found:', src);
            }
        }
    });
    function copyFiles(files, destDir, withAppCache, copys) {
        var appCacheFiles = _.uniq(files).sort();

        if (withAppCache) {
            var appCache = grunt.file.read('web/index.appcache');
            appCache = grunt.template.process(appCache, {
                data : {
                    appCacheFiles : appCacheFiles
                }
            });
            grunt.file.write(destDir + '/gen.index.appcache', appCache);
        }

        appCacheFiles.forEach(function(src) {
            copys[destDir + '/' + src] = src;
        });
    }

    
    // copy platforms/android -> platforms/android_dist
    grunt.registerTask('android', function() {
        
        if (fs.existsSync('platforms/android_dist/assets'))
            grunt.file.delete('platforms/android_dist/assets', {force:true});
        
        grunt.file.expandMapping(['**', '!src/com/pithway_dev/**', '!gen/**', '!bin/**', '!data/**'], 'platforms/android_dist', {cwd:'platforms/android'}).forEach(function(pair) {
            if (grunt.file.isFile(pair.src[0]))
                grunt.file.copy(pair.src, pair.dest);
        });
        
        // modify AndroidManifest.xml        
        var path = 'platforms/android_dist/AndroidManifest.xml';
        var xml = grunt.file.read(path);
        xml = xml.replace(/PitDocDev/g, '@string/app_name');
        xml = xml.replace(/_dev/gi, '');
        grunt.file.write(path, xml);
    });
    
    

    grunt.registerTask('useProduction', function() {
        isProduction = true;
    });
    grunt.registerTask('useUncompress', function() {
        min = '';
    });
    grunt.registerTask('useDefault', function() {
        isProduction = false;
        min = '.min';
    });

    
    grunt.registerTask('versioning', function() {
        for (var profile in requires) {
            if (_.endsWith(profile, '_dist')) {
                var files = requires[profile];
                requires[profile] = files.map(function(filepath){
                    if (!( /\.v[0-9a-f]+\./i.test(filepath) )) {
                        // version the non-version files
                        filepath = versionFile(filepath);
                    }
                    return filepath;
                });
                //console.log(profile, requires[profile]);
            }
        }
    });
    function versionFile(filepath) {
        if (!grunt.file.isFile(filepath))
            return filepath;
        var ext = Path.extname(filepath);
        var name = Path.basename(filepath, ext);
        var content = grunt.file.read(filepath);
        var v = digest(content);
        var newPath = 'gen/'+name+'.v'+v+ext;
        //var newPath = 'gen/'+name+ext;
        grunt.file.copy(filepath, newPath);
        return newPath;
    }
    function digest(input) {
        return require('crypto').createHash('md5').update(input).digest('hex');
    }
    _.mixin({
        startsWith: function(str, starts){
            if (starts === '') return true;
            if (str == null || starts == null) return false;
            str = String(str); starts = String(starts);
            return str.length >= starts.length && str.slice(0, starts.length) === starts;
        },
        endsWith: function(str, ends){
            if (ends === '') return true;
            if (str == null || ends == null) return false;
            str = String(str); ends = String(ends);
            return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
        },
    });
};
