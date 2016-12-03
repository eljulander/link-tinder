/*
  Appends custom flag function to the console
 */
console = (function () {
    "use strict";
    //Grabs console for Web or Node
    var CONSOLE = console.prototype || console;

    /*
     Prints a star border around the specified text.
     There is an 80 character limit per line before it wraps.
     */
    function flag() {
        var me = this;
        var args = Array.prototype.slice.call(arguments);
        args.map(function (arg) {
            arg = arg.toString();
            var message = "";
            var length = ((arg.length < 80) ? arg.length : 80) + 4;
            for (var i = 0; i < length; i++) message += "*";
            var sections = arg.match(/.{1,80}/g);
            sections.map(function (section) {
                message += "\n*";
                var minlen = (length - section.length) - 2;
                for (var i = 0; i < minlen / 2; i++) message += " ";
                message += section;
                for (var i = 0; i < (minlen / 2) - minlen % 2; i++) message += " ";
                message += "*";
            });
            message += "\n";
            for (var i = 0; i < length; i++) message += "*";
            me.log(message);
        });
    }
    CONSOLE.flag = flag;
    return CONSOLE;
}());


var LinkValidator =     
(function(){
    "use strict"
var fs = require("fs");
var LinkValidator = function (file) {
    this.file = file;
    this.fileName = "";
    this.invalidLinks = [];
    this.unsure = [];
    this.valid = [];
    this.blackList = JSON.parse(fs.readFileSync("./_js/properties.json").toString()).blacklist;
    this.org = "12345";
    //console.flag("Blacklist\n"+this.blackList);
}
var $async = require("async");
var cheerio = require("cheerio")
var linkValidator = LinkValidator.prototype;
    
/*
 * Finds invalid links from document
 */
linkValidator.getLinksFromXML = function (org) {
    this.ou = org;
    var xml = this.file;
    var $ = cheerio.load(xml);
    var html = $("mattext[texttype='text/html']");
    var htmlDocument = "";
    for (var i = 0; i < html.length; i++) {
        var document = html.eq(i).html();
        document = document.replace(/&lt;/g, "<");
        document = document.replace(/&gt;/g, ">");
        document = document.replace(/&quot;/g, "\"");
        document = document.replace(/&amp;/g, "&");
        document = document.replace(/&amp;/g, "&");
        htmlDocument += document;
    }
        
    var links = cheerio.load(htmlDocument)("a, img");
    if(org)
    for(var i in links){
        var current = links.eq(i);
        if(current.attr("src"))
            current.attr("src", current.attr("src").replace(/(\{orgUnitId\})/g, org))
        if(current.attr("href"))
            current.attr("href", current.attr("href").replace(/(\{orgUnitId\})/g, org))
    }    
    
    return links; 
};
    
linkValidator.getLinks = function(org){
    this.ou = org;
    var links = cheerio.load(this.file)("a, img");
    if(org)
    for(var i = 0; i < links.length; i++){
        var current = links.eq(i);
        if(current.attr("src"))
            current.attr("src", current.attr("src").replace(/(\{orgUnitId\})/g, org))
        if(current.attr("href"))
            current.attr("href", current.attr("href").replace(/(\{orgUnitId\})/g, org))
    }
    return links;
};
    
//links is a cheerio object
linkValidator.validateLinks = function (links, runNext) {
    var me  = this;
 
    
    /*
     * Looks through the blacklist and flags the associated links
     */
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
                // DEGUBBING STUFF
                //console.log(`${current} was not found in ${url}`, current);
            }
        }
        
        return broken;
    }
    
    /*
     * The Map Function for Checking the Existance of a Link
     */
    function exists(link, nextPhase) {
      
        var completed = false,
            url = (link.attr("href") || link.attr("src")),
            parser = require("url"),
            stringer = require("querystring");
        
        if(url)
            url = url.trim();
        
        
        
        //calls callback for map function
        function complete(){
            if(completed) return;
            completed = true;
            nextPhase(null, link);
        }
        
        
        // ends the process if anchor or image has no link
        if(!url || url.substr(0,7) === "mailto:"){
          complete();
          return;
        } 
            
        
        //http request setup
        var options = {
            method:"head",
            host: parser.parse(url, true).hostname,
            path: parser.parse(url, true).pathname +"?"+stringer.stringify(parser.parse(url, true).query)
        }
        
        // there is no specified domain, so it is an internal link.
        if (!options.host){
            if(options.path.substr(0,4).toLowerCase() !== "/d2l"){
                // preforms a search for the file locally
                if(me.currentPath){
                    console.log("Searching Local Tree For: ", me.currentPath);
                    fs.stat("./temp/"+me.currentPath, function(err, data){
                        //determines if link is broken
                        if(err){
                            me.invalidLinks.push(link);
                            complete();
                            return;
                        }
                        
                        // the link is valid
                        me.valid.push(link);
                        complete();
                    });
                    
                    //exits the scan. There is no need to continue.
                    return;
                }
            }else{
                // checks for an internal path
                console.log("Internal Path: ",options.path);
                // checks if the links goes to the same orgUnit
                if(url.match(/ou=+\d*/g) && url.match(/ou=+\d*/g)[0].split("=")[1] !== me.ou){
                    console.flag("He is not one of us! He will be executed at once.");
                    // the link is broken. Log it...
                    me.invalidLinks.push(link);
                    complete();
                    return;
                }
            }
            
            // Append the domain to scan internally
            options.host = "byui.brightspace.com";
        } 
        
        // if the link goes nowhere, end the process
        // undetermined
        if(url === "#"){
            me.valid.push(link);
            complete();
            return;
        }
        
        // Server Verification
        var callback = function (response) {
            // this page is obviously not there. Flag it!
            if(response.statusCode == 404){
                me.invalidLinks.push(link);
                complete();
                return;
            }else if(response.statusCode == 403){
                // We cant see, but it exists.
                // The OU checker should handle this
//                if(!url.match(/(byui\.brightspace\.com)/))
//                    me.unsure.push(link);
                complete();
                return;
            }else if(isBroken(url)){
                // the dictionary says no bueno. Flag it!
                //Move to begenning
                console.log("Response: ",response.statusCode, ", URL: ", response.responseUrl);
                console.log("OOPS! This durn broken!", url);
                me.invalidLinks.push(link);
                complete();
                return;
            }
                
            // it has passed all the tests! You are good to go...for now that is...
            me.valid.push(link);
            complete();
            return;
        }
        
        if(completed) return;
        console.log("starting");
        // follows redirects to prevent incorrect flagging.
        var http = require("follow-redirects").http;
        // inits the http request.
        
        function linkCrashed(){
            if(completed) return;
            // somthing went wrong. Flag as broken.
            me.invalidLinks.push(link);
            console.log("Oops. Err.", url);
            complete();
        }
        var req = http.request(options, callback)
        .on("error", linkCrashed)
        .on("aborted", linkCrashed);
        
        setTimeout(function(){
            if(completed)return;
            console.log("Should have ended by now");
            req.abort();
        },10*1000);

        req.end();
        
    }
    
    
    /*
     * Loops through all of the links
     */
    var linkArray = [];
    for(var i = 0; i < links.length; i ++)
        linkArray.push(links.eq(i));
    $async.map(linkArray, exists, function(err, results){
        if(err) console.flag("There was an err");
        runNext();
    });
    
}

linkValidator.removeDuplicates = function(){
    var me = this;
    var hrefs = [];
    this.invalidLinks = this.invalidLinks.filter(function(item, pos){
        var url = item.attr("href") || item.attr("src");
        if(hrefs.indexOf(url) < 0){
            hrefs.push(url)
            return true;
        }else {
            console.log(hrefs[hrefs.indexOf(url)], url);
        }
        return false;
    });
}
    return LinkValidator;
}());


module.exports = LinkValidator;