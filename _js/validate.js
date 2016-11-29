/*
  Appends custom flag function to the console
 */
console = (function () {
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
var fs = require("fs");
var LinkValidator = function (file) {
    this.file = file;
    this.fileName = "";
    this.invalidLinks = [];
    this.unsure = [];
    this.valid = [];
    this.blackList = JSON.parse(fs.readFileSync("./_js/properties.json").toString()).blacklist;
    //console.flag("Blacklist\n"+this.blackList);
}
var $async = require("async");
var cheerio = require("cheerio")
var linkValidator = LinkValidator.prototype;
    
/*
 * Finds invalid links from document
 */
linkValidator.getLinksFromXML = function (org) {
    var xml = this.file;
    var $ = cheerio.load(xml);
    var html = $("mattext[texttype='text/html']");
    var htmlDocument = "";
    for (var i = 0; i < html.length; i++) {
        var document = html.eq(i).html();
        document = decodeURI(document);
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
        var options = {
            method:"head",
            host: parser.parse(url, true).hostname,
            path: parser.parse(url, true).pathname +"?"+stringer.stringify(parser.parse(url, true).query)
        }
        var done = false;
        if (!options.host){
            options.host = "byui.brightspace.com";
        } 
            
        var red = "";
        var called = false;
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
                nextPhase(null, link);
                called = true;
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