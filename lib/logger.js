var util = require('util');

var Logger = function(settings) {
    if(typeof settings.level !== 'undefined'){
        this.level = 0;
    }
    else{
        this.level = settings.level;    
    }
};

Logger.prototype.error = function(message){
    util.log('ERROR   '+message);
};

Logger.prototype.warning = function(message){
    util.log('WARNING '+message);
};

Logger.prototype.log = function(message){
    util.log('LOG     '+message);
};

Logger.prototype.log = function(message){
    util.log('DEBUG   '+message);
};

exports.Logger = Logger;