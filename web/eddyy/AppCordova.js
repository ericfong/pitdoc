(function() {
    _.extend(E, {
        
        envReady: function(cb) {
            var wait = new Wait;
            document.addEventListener("deviceready", wait(), false);
            $(document).ready(wait());
            wait.then(cb);
        },

        // called by cordova
        appNotify: function(type, message){
            console.error(type, message);
        },
        
        http: function(method, url, body, callback, headers) {
            if (URI(url).host()) {
                E.util.http(method, url, body, callback, headers);
                return;
            }
            return E.native(method, url, body, callback, headers);
        },
        
        native: function(method, url, body, callback, headers){
            if (typeof body != 'string')
                body = JSON.stringify(body);
            //alert("native "+method+":"+url);
            var cb = function(resBody, resHeaders){
                if (callback) {
                    //alert(method+":"+url+" "+resBody);
                    setTimeout(function(){ callback(resBody, resHeaders) }, 0);
                }
            }
            try {
                //alert('exec: '+url);
                cordova.exec(function(response){
                    //alert('ret: '+url+' : '+response.body);
                    if (!response) {
                        console.warn('no res:' + url);
                        cb(null, {});
                    } else if (response.status < 200 || response.status >= 400) {
                        cb(null, {
                            error : new Error(response.status),
                            errorText : response.body
                        });
                    } else {
                        cb(response.body, response.headers);
                    }
                }, function(err) {
                    //alert('err: '+url+' : '+err);
                    console.error(err);
                    if (err instanceof Error)
                        cb(null, {error:err});
                    else
                        cb(null, {error:new Error(err + '')});
                }, "PithwayPhonegapPlugin", method, [url, body, headers||{}]);
            } catch (err) {
                console.error(err);
                cb(err);
            }
        },
        
        _get: function(path, cb) {
            return E.exec(path, cb);
        },
        _put: function(path, body, cb) {
            return E.exec(path, body, cb);
        },
    });    

})();

//assign window.deviceType
window.deviceType = 'mobile';
