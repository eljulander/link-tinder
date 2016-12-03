//links is a cheerio object
linkValidator.validateLinks = function (links, runNext) {
    var me  = this;
 
    function isBroken(url){
        var urls = me.blackList;
        var broken = false;
        
        for(var i in urls){
            var current = urls[i].link;
            if(url.match(new RegExp("("+current+")", "g"))){
                console.log(url.match(new RegExp("("+current+")", "g")));
                broken = true;
                break;
            }else{
                console.log(`${current} was not found in ${url}`, current);
            }
        }
        
        return broken;
    }
    
    function exists(link, nextPhase) {
      
        
        var url = link.attr("href") || link.attr("src");
        //console.flag("Starting Scan for:\n"+url);
        
        var parser = require("url");
        var stringer = require("querystring");
        if(url === undefined)
            return;
        var options = {
            method:"head",
            host: parser.parse(url, true).hostname,
            path: parser.parse(url, true).pathname +"?"+stringer.stringify(parser.parse(url, true).query)
        }
        var done = false;
        if (!options.host){
            if(options.path.substr(0,4).toLowerCase() !== "/d2l"){
                // preforms a search for the file locally
                if(me.currentPath){
                    console.log("PATH ME: ", me.currentPath);
                    fs.stat("./temp/"+me.currentPath, function(err, data){
                        if(err){
                            me.invalidLinks.push(link);
                            nextPhase(null,link);
                            called = true;
                            return;
                        }
                        
                        me.valid.push(link);
                        nextPhase(null,link);
                        called = true;
                    });
                    
                    return;
                }
            }else{
                console.log("MY PATH: ",options.path);
                if(url.match(/ou=+\d*/g) && url.match(/ou=+\d*/g)[0].split("=")[1] !== this.ou){
                    console.flag("He is not one of us! He will be executed at once.");
                    me.invalidLinks.push(link);
                    if(!called){
                        nextPhase(null, link);
                        called = true;
                    }
                }else{
                    console.flag("Clear: ", url);
                }
            }
            options.host = "byui.brightspace.com";
        } 
        
        var red = "";
        var called = false;
        if(url === "#"){
            done = true;
            called  = true;
            me.valid.push(link);
            nextPhase(null, link);
            return;
        }
        
        var callback = function (response) {
            
            if(response.statusCode == 404){
                me.invalidLinks.push(link);
            }else if(response.statusCode == 403){
                me.unsure.push(link);
            }else if(isBroken(url)){
                    console.log("Response: ",response.statusCode, ", URL: ", response.responseUrl);
                    console.log("OOPS! This durn broken!", url);
                    me.invalidLinks.push(link);
            }else{
                me.valid.push(link);
            }
                
            done = true;
            if(!called){
                try{
                    nextPhase(null, link);
                    called = true;
                }catch(e){
                    console.log("Oops.. I guess something already happened!");
                }
            }
        }
        
        var http = require("follow-redirects").http;
        var req = http.request(options, callback).on("error", function(){
            me.invalidLinks.push(link);
            console.log("Oops. Err.", url);
            done = true;
            if(!called){
                nextPhase(null, link);
                called = true;
            }
        }).end();
        
        setTimeout(function(){
           // console.log("Triggered", url);
            if(!done){
                console.log("Abort Mission!",url);
                me.unsure.push(link);
                if(!called){
                    nextPhase(null, link);
                    called = true;
                }
                //console.log(me.unsure);
            }
           
        },2500);
        
    }
    
    var linkArray = [];
    for(var i = 0; i < links.length; i ++)
        linkArray.push(links.eq(i));

    $async.map(linkArray, exists, function(err, results){
        if(err) console.flag("There was an err");
        runNext();
    });
    
}