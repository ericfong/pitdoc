(function() {
     var detects = <%=JSON.stringify(detects)%>     
     var matchFiles = detects[window.deviceType];
     if (matchFiles) {
         var head = document.head;
         matchFiles.forEach(function(file){
             if (file.match(/\.css$/)) {
                 var tag = document.createElement('link');
                 tag.setAttribute('rel', 'stylesheet');
                 tag.setAttribute('href', file);
                 head.appendChild(tag);
             } else if (file.match(/\.js$/)) {
                 var script = document.createElement('script');
                 script.src = file;
                 head.appendChild(script);
             }
         });
     }
 })();
