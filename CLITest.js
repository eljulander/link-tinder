/*************
 * CLI TESTS *
 *************/
(function () {
    "use strict";
    var LinkValidator = require("./_js/validate");
    var Scanner = require("./_js/DirScanner");
    var ReportGenerator = require("./_js/ReportGenerator");
    //link validator
    if ((process.argv[2] == "validate" || process.argv[2] == "validate.js"))
        (function () {
            var lv = new LinkValidator("");
            var fs = require("fs");
            var fileReader = fs.createReadStream(process.argv[3]);
            fileReader.on("data", function (chunk) {
                lv.file += chunk.toString("utf8");
            });
            fileReader.on("end", function () {
                var anchors = (process.argv[4] === "-xml") ? lv.getLinksFromXML("55363") : lv.getLinks("55363");
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
                    console.flag("Done Validating Links!\nBroken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length + "\nCorrect: " + (anchors.length - lv.invalidLinks.length - lv.unsure.length,lv.valid.length));
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
                        for (var i in lv.valid){
                            console.log(i);
                            console.log(lv.valid[i].attr("src") || lv.valid[i].attr("href"));
                        } 
                            
                    }
                    console.flag("Links Recieved");
                    for(var i = 0; i < anchors.length; i++)
                        console.log(anchors.eq(i).attr("src") || anchors.eq(i).attr("href"));
                });
            });
        }());
    //dir scanner
    if ((process.argv[2] == "DirScanner" || process.argv[2] == "DirScanner.js"))
        (function () {
            var scanner = new Scanner("tests.zip");
            scanner.scanZip();
            scanner.validateFiles(function (links) {
                for (var i in links) {
                    var lv = links[i];
                    console.log(lv.fileName);
                    console.flag("Broken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length);
                }
            });
        }());
    // report generator
    if ((process.argv[2] == "ReportGenerator" || process.argv[2] == "ReportGenerator.js"))
        (function () {
            var scanner = new Scanner("./_js/tests.zip");
            scanner.scanZip();
            scanner.validateFiles(function (links) {
                var report = new ReportGenerator(links);
                report.toCSV("./test.csv");
            });
        }());
}());