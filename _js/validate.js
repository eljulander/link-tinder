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
    function printFlag() {
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
    CONSOLE.printFlag = printFlag;
    return CONSOLE;
}());


var LinkValidator =     
(function(){

var LinkValidator = function (file) {
    this.file = file;
    this.invalidLinks = [];
    this.unsure = [];
    this.valid = [];
}
var $async = require("async");
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
};
    
linkValidator.getLinks = function(){
        return cheerio.load(this.file)("a, img");
};
    
//links is a cheerio object
linkValidator.validateLinks = function (links, runNext) {
    var me  = this;
 
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
    
    function exists(link, nextPhase) {
      
        var url = link.attr("href") || link.attr("src");
        var parser = require("url");
        var stringer = require("querystring");
        var options = {
            method:"head",
            host: parser.parse(url, true).hostname,
            path: parser.parse(url, true).pathname +"?"+stringer.stringify(parser.parse(url, true).query)
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
                }else{
                    if(isBroken(url))
                        me.invalidLinks.push(link);
                    else
                        me.valid.push(link);
                }
                
            }
            done = true;
            nextPhase(null, link);
        }
        
        var http = require("follow-redirects").http;
        var req = http.request(options, callback).on("error", function(){
            me.invalidLinks.push(link);
            console.log("Oops. Err.", url);
            done = true;
             nextPhase(null, link);
        }).end();
        
        setTimeout(function(){
           // console.log("Triggered", url);
            if(!done){
                console.log("Abort Mission!");
                this.unsure.push(link);
                nextPhase(null, link);
                //console.log(me.unsure);
            }
           
        },2500);
        
    }
    
    var linkArray = [];
    for(var i = 0; i < links.length; i ++)
        linkArray.push(links.eq(i));

    $async.map(linkArray, exists, function(err, results){
        if(err) console.printFlag("There was an err");
        runNext();
    });
    
}

linkValidator.getBroken = function (links) {
    
    return;
    
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
    return LinkValidator;
}());

if (process.argv[2] === "--test")
    (function () {
        var lv = new LinkValidator("");
        var fs = require("fs");
        var fileReader = fs.createReadStream(process.argv[3]);
        fileReader.on("data", function (chunk) {
            lv.file += chunk.toString("utf8");
        });
        fileReader.on("end", function () {
            var anchors = (process.argv[4] === "-xml") ? lv.getLinksFromXML() : lv.getLinks();
            // writes all links found to a document
            var doc = "";
            for (var i = 0; i < anchors.length; i++) {
                var currentAnchor = anchors.eq(i).attr("href") || anchors.eq(i).attr("src");
                doc += currentAnchor + "\n-------------------------------------------------\n";
            }
            fs.writeFile("./test.html", doc, function (err) {
                if (err) throw err;
            });
            // prints results of links
            lv.validateLinks(anchors, function () {
                console.printFlag("Done Validating Links!\nBroken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length + "\nCorrect: " + (anchors.length - lv.invalidLinks.length - lv.unsure.length));
                lv.removeDuplicates();
                if (lv.invalidLinks.length > 0) {
                    console.log("\n");
                    console.printFlag("Broken: ");
                    for (var i = 0; i < lv.invalidLinks.length; i++) {
                        console.log(lv.invalidLinks[i].attr("href") || lv.invalidLinks[i].attr("src"));
                    }
                }
                if (lv.unsure.length > 0) {
                    console.log("\n");
                    console.printFlag("Unsure:");
                    for (var i = 0; i < lv.unsure.length; i++) {
                        console.log(lv.unsure[i].attr("href") || lv.unsure[i].attr("src"));
                    }
                }
                if (lv.valid.length > 0) {
                    console.log("\n");
                    console.printFlag("Valid: ");
                    for (var i in lv.valid) console.log(lv.valid[i].attr("src") || lv.valid[i].attr("src"));
                }
            });
        });
    }());