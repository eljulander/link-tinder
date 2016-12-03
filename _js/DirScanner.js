var inProgress = {};
var Scanner = (function () {
    "use strict";
    var admZip = require("adm-zip");
    var LinkScanner = require("./validate");
    var $async = require("async");
    var Scanner = function (dir) {
        this.dir = dir;
        if (this.dir.indexOf(".zip") < 0) console.flag("Opps. The zip file Specified is invlaid!");
        this.zip = new admZip(this.dir);
        this.entries = this.zip.getEntries();
        this.filesToValidate = [];
    }
    var proto = Scanner.prototype;
    proto.scanZip = function () {
        var me = this;
        this.entries.forEach(function (entry) {
            if (entry.entryName.indexOf(".html") > 0 || entry.entryName.indexOf(".xml") > 0) me.filesToValidate.push(entry.entryName);
        });
        
    };
    proto.validateFiles = function (nextStep) {
        var fs = require('fs');
        var me = this;
        fs.mkdirSync("./temp", function(err){if(err) throw err;})
        this.zip.extractAllTo("./temp")
        var deleteFolderRecursive = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    }
                    else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        

        var index = 0;
        function getValidatedLinks(path, callback) {
            console.log("Index:",index, path);
            inProgress[index] = path;
            function currIndex(i){
                return function(){
                    delete inProgress[i];
                    console.log("Finished", i, path);
                    console.log("Finished Scanning...");
                    validator.removeDuplicates();
                    callback(null, validator);
                    console.log(inProgress);
                };
            }
            var validator = new LinkScanner(fs.readFileSync("./temp/"+path).toString());
            validator.fileName = path;
            var ou;
            try{
              ou = me.dir.split("\\").reverse()[0].match(/_+.+_/g)[0].replace(/[_]/g, "");
            }catch(e){
              ou = me.dir.split("/").reverse()[0].match(/_+.+_/g)[0].replace(/[_]/g, "");
            }
            //console.log("OU: "+ou);
            var links = (path.indexOf(".xml") >= 0) ? validator.getLinksFromXML(ou) : validator.getLinks(ou);
            //used for relative links
            validator.currentPath = path;//.match(/.*\//g)[0];
            validator.validateLinks(links, currIndex(index));
            index++;
        }
        
        $async.map(this.filesToValidate, getValidatedLinks, function (err, links) {
            if(err) throw err;
            console.flag("Finished Scanning Directory");
            deleteFolderRecursive("./temp");
            nextStep(links);
        });
    };
    
    return Scanner;
}());

module.exports = Scanner;
