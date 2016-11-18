function printFlag(){
    var args = Array.prototype.slice.call(arguments);
    args.map(function(arg){
        var message = "";
        for(var i = 0; i < arg.toString().length+6; i++)
            message += "*"; 
        message += "\n*  "+arg+"  *\n";
        for(var i = 0; i < arg.toString().length+6; i++)
            message += "*"; 
        console.log(message);
    });
}


(function(){

var LinkValidator = function (file) {
    this.file = file;
    this.invalidLinks = [];
    this.unsure = [];
}
var cheerio = require("cheerio")
var linkValidator = LinkValidator.prototype;
    
/*
 * Finds invalid links from document
 */
linkValidator.getLinksFromXML = function () {
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
        return cheerio.load(htmlDocument)("a, img");
    }
linkValidator.getLinks = function(){
    return cheerio.load(this.file)("a, img");
}
//links is a cheerio object
linkValidator.validateLinks = function (links, runNext) {
    var me  = this;
    var waiting = [];
    function exists(link, index, next) {
        waiting.push(index);
        var url = link.attr("href") || link.attr("src");
        var parser = require("url");
        var stringer = require("querystring");
        var options = {
            method:"head",
            host: parser.parse(url, true).hostname
            ,path: parser.parse(url, true).pathname +"?"+stringer.stringify(parser.parse(url, true).query)
        }
        var done = false;
        if (!options.host) options.host = "byui.brightspace.com";
        var red = "";
        var callback = function (response) {
            
            if(response.statusCode == 404)
                me.invalidLinks.push(link);
            else
            if(response.statusCode == 403){
                me.unsure.push(link);
            }else{
                if(response.responseUrl != url && ! link.attr("src")){
                    console.log("Response: ",response.statusCode, ", URL: ", response.responseUrl);
                    me.unsure.push(link);
                }
                
            }
            done = true;
            next();
        }
        
        var http = require("follow-redirects").http;
        var req = http.request(options, callback).on("error", function(){
            me.invalidLinks.push(link);
            console.log("Oops. Err.", url);
            done = true;
            next();

        }).end();
        
        setTimeout(function(){
           // console.log("Triggered", url);
            if(!done){
                console.log("Abort Mission!");
                this.unsure.push(link);
                next();
                console.log(me.unsure);
            }
            waiting.splice(0,1);
    //        printFlag(waiting.length);
            if(waiting.length <= 0)
                next();
        },2500);
        
    }
    
    function checkNext(){
        if(links.length <= 0){
      //      printFlag("FIN")
            if(waiting.length > 0) return;
            printFlag("Finished Processing!")
            runNext();
            return;
        }
        var currentAnchor = links.eq(0);
        exists(currentAnchor, 0, checkNext);
        links.splice(0,1);
    }
    checkNext();
}

linkValidator.getBroken = function (links) {
    
    function isBroken(url){
        var urls = ["brainhoney.com",  "box.com"];
        var broken = false;
        for(var i in urls){
            var current = urls[i];
            if(url.match(new RegExp(current, "g"))){
                broken = true;
                break;
            }
        }
        
        return broken;
    }
    
    for(var i = 0; i < links.length; i ++){
        var current = links.eq(i);
        var broken = isBroken(current.attr("href") || current.attr("src"));
        if(broken)
            this.invalidLinks.push(current);
    }
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


var lv = new LinkValidator("");
var fs = require("fs");
var fileReader = fs.createReadStream("./tests.html");

fileReader.on("data", function (chunk) {
    lv.file += chunk.toString("utf8");
});
fileReader.on("end", function () {
    var anchors = lv.getLinks();
    var doc = "";
    for (var i = 0; i < anchors.length; i++) {
        var currentAnchor = anchors.eq(i).attr("href") || anchors.eq(i).attr("src");
        doc += currentAnchor + "\n-------------------------------------------------\n";
    }
    fs.writeFile("./test.html", doc, function (err) {
        if (err) throw err;
    });
    lv.validateLinks(anchors, function(){
       
        console.log("Done Validating Links!\nLinks Found:", lv.invalidLinks.length);
        lv.removeDuplicates();
        for(var i = 0; i < lv.invalidLinks.length; i ++){
            console.log(lv.invalidLinks[i].attr("href") || lv.invalidLinks[i].attr("src"));
        }
    });
    lv.getBroken(anchors);

});
     console.log("OOPS!");
    return LinkValidator;
}());