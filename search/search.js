var fs = require("fs");
var context = JSON.parse(fs.readFileSync("_js/properties.json").toString());

function writePreferences(){
    fs.writeFile("_js/properties.json", JSON.stringify(context), function(err){
        if(err) throw err;
    });
}

function addItem() {
    console.log("Thinggy!");
    var newItem = $("#new").val().trim();
    if (newItem) {
        context.blacklist.push(newItem);
        loadFromSource();
        writePreferences();
    }
    else {
        alert("The \"Add Item\" field cannot be blank.");
    }
}

function removeItem() {
    var index = ($(this).prev().val());
    context.blacklist.splice(context.blacklist.indexOf(index), 1);
    loadFromSource();
    writePreferences();
}


function loadFromSource() {
    var source = $("#entry-template").html();
    var template = Handlebars.compile(source);
    console.log(context);
    var html = template(context);
    $("#entry").html(html);
    $(".remove").on("click", removeItem);
    $("input").keydown(function (key) {
        if (key.key == "Enter") addItem();
    });
}
loadFromSource();
$("#back").click(function(){
    win.loadURL(url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  }))
});