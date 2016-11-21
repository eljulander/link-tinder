var LinkValidator = require("./_js/validate");
var Scanner = require("./_js/DirScanner");
/*************
 * CLI TESTS *
 *************/

//link validator
if ( (process.argv[2] == "validate" || process.argv[2] == "validate.js"))
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
                console.flag("Done Validating Links!\nBroken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length + "\nCorrect: " + (anchors.length - lv.invalidLinks.length - lv.unsure.length));
                lv.removeDuplicates();
                if (lv.invalidLinks.length > 0) {
                    console.log("\n");
                    console.flag("Broken: ");
                    for (var i = 0; i < lv.invalidLinks.length; i++) {
                        console.log(lv.invalidLinks[i].attr("href") || lv.invalidLinks[i].attr("src"));
                    }
                }
                if (lv.unsure.length > 0) {
                    console.log("\n");
                    console.flag("Unsure:");
                    for (var i = 0; i < lv.unsure.length; i++) {
                        console.log(lv.unsure[i].attr("href") || lv.unsure[i].attr("src"));
                    }
                }
                if (lv.valid.length > 0) {
                    console.log("\n");
                    console.flag("Valid: ");
                    for (var i in lv.valid) console.log(lv.valid[i].attr("src") || lv.valid[i].attr("src"));
                }
            });
        });
    }());

//dir scanner
if ((process.argv[2] == "DirScanner" || process.argv[2] == "DirScanner.js"))
    (function () {
        var scanner = new Scanner("tests.zip");
        scanner.scanZip();
        scanner.validateFiles(function(links){
            for(var i in links){
                var lv = links[i];
                console.log(lv.fileName);
                console.flag("Broken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length);
            }
        });
    }());