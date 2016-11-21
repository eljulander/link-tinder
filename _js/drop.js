var DirScanner = require("./_js/DirScanner")
window.addEventListener("dragover", function (e) {
    e = e || event;
    e.preventDefault();
}, false);
window.addEventListener("drop", function (e) {
    e = e || event;
    e.preventDefault();
}, false);
document.getElementById("dropper").ondrop = function (ev) {
    console.log("Incoming!!!");
    var filePath = (ev.dataTransfer.files[0].path);
    if (filePath.split(".")[1] != "zip") {
        alert("Please place a ZIP file on the flashing platform!");
        return;
    }
    var scanner = new DirScanner(filePath);
    scanner.scanZip();
    scanner.validateFiles(function (links) {
        for (var i in links) {
            var lv = links[i];
            console.log(lv.fileName);
            console.flag("Broken Links Found: " + lv.invalidLinks.length + "\n" + "Unsure Links: " + lv.unsure.length);
        }
    });
}