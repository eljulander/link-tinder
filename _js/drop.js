var DirScanner = require("./_js/DirScanner");
var ReportGenerator = require("./_js/ReportGenerator");
var fs = require("fs");
var context = JSON.parse(fs.readFileSync("_js/properties.json").toString());
var Redirect = require("./PageDirector");
var redirect = new Redirect();
console.log(redirect.applicationRoot);
console.log(context);

$("#filepath").html(context.csvPath);

function writePreferences(){
    fs.writeFile("_js/properties.json", JSON.stringify(context), function(err){
        if(err) throw err;
    });
}

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
        var report = new ReportGenerator(links);
        report.toCSV(context.csvPath+"\\"+context.csvName+".csv");
    });
}

function openDialog(){
    var {dialog} = require('electron').remote
    context.csvPath = (dialog.showOpenDialog({properties:["openDirectory"]}))[0];
    $("#filepath").html(context.csvPath);
    writePreferences();
}

$("#csvName").val(context.csvName);
$("#csvName").keyup(function(evt){
        var val = $(this).val();
        console.log(val);
        if(val){
            context.csvName = val;
            writePreferences();
        }
        if(evt.key == "Enter")
        {
            if(!val)
            alert("You must provide a name for the CSV file!");
        }
});

function openSearchParameters(){
    win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}
$("#preferences").click(function(){
    redirect.goToPage("search/search.html");
});
