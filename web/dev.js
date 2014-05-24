(function(){
    
    window.isDev = true;
    
    window.addEventListener("load", function(event){
        
        setTimeout(function(){
            // remote debug
            if (window.deviceType != 'desktop') {
                var script = document.createElement("script");
                script.src = "http://1.1.1.10:8080/target/target-script-min.js#anonymous";
                document.head.appendChild(script);
            }
            
            var html = '<div style="z-index:10000;position:fixed;bottom:80px;right:0px;">';
            html += '<button id="reload" class="btn btn-link">R</button>';
            html += '<button id="clear" class="btn btn-link">C</button>';
//            html += '<button id="poll" class="btn btn-link">Poll</button>';
            html += '</div>';
            var el = $(html).appendTo(document.body);

            el.find('#reload').on('click', function() {
                location.reload();
            });
            el.find('#clear').on('click', function() {
                if (confirm('Reset')) {
                    localStorage.clear();
                    delete E._save_pending;
                    
                    var cookies = document.cookie.split(";");
                    for (var i = 0; i < cookies.length; i++) {
                        document.cookie = cookies[i].split("=")[0]+"=; expires=-1; path=/";
                    }
                    
                    E.loopInterval = 0;
                    //location.hash = '';
                    location.reload();
                }
            });
            
        }, 1000);

        E.loopInterval = E.loopInterval * 3;
        
        var interval = E.loopInterval;
        setTimeout(function(){
            E.loopInterval = 0;
        }, 10*60*1000);
        window.loop = function(){
            E.loopInterval = interval;
            E.loop();
            setTimeout(function(){
                E.loopInterval = 0;
            }, 10*60*1000);
        }
        
        window.loopStop= function(){
            E.loopInterval = 0;
        }
        
    },false);
})();
