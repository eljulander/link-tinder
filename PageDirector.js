var Director = (function () {
    var DIR = function(){
        this.applicationRoot = __dirname;
    }
    DIR.prototype.goToPage = function (page) {
        const ipc = require('electron').ipcRenderer;
        ipc.send('load-page', 'file://' + this.applicationRoot + "/" + page);
    }
    
    return DIR;
}());
module.exports = Director;