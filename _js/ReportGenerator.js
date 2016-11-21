var ReportGenerator = (function () {
    var fs = require("fs");
    // takes an array of validator objects
    var ReportGenerator = function (links) {
        this.links = links;
    };
    var proto = ReportGenerator.prototype;
    proto.toCSV = function (path) {
        var csv = "Path, Broken, Unsure\n";
        for (var i in this.links) {
            var cl = this.links[i];
            if (!(cl.unsure.length <= 0 && cl.invalidLinks.length <= 0)) {
                csv += `${cl.fileName},${cl.invalidLinks.length}, ${cl.unsure.length}\n`;
                var greatest = [cl.unsure.length, cl.invalidLinks.length].sort().reverse()[0];
                for (var j = 0; j < greatest; j++) {
                    var invalid = cl.invalidLinks[j] || "-";
                    if(invalid.attr)
                        invalid = (invalid.attr("href") || invalid.attr("src"));
                    
                    var unsure = cl.unsure[j] || "-";
                    if(unsure.attr)
                        unsure = (unsure.attr("href") || unsure.attr("src"));
                    csv += `${" "},${invalid}, ${unsure}," "\n`;
                }
            }
            fs.writeFile(path, csv, function (err) {
                if (err) throw err;
            });
        }
    }
    return ReportGenerator;
}());

module.exports = ReportGenerator;