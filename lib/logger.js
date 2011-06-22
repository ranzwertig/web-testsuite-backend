var util = require('util');

var Logger = function(settings) {
    this.level = typeof settings.level === 'undefined' ? 0 : settings.level;
    this.module = typeof settings.module === 'undefined' ? 'NONE' : settings.module;
};

var writeLog = function(type, message, module) {
	var tmodule = typeof module === 'undefined' ? this.module : module;
    util.log(type+' '+'MODULE/'+tmodule+' MESSAGE: '+message);
};

Logger.prototype.critical = function(message, module){
	writeLog('CRITICAL', message, module);
};

Logger.prototype.error = function(message, module){
	writeLog('ERROR', message, module);
};

Logger.prototype.warning = function(message, module){
	writeLog('WARNING', message, module);
};

Logger.prototype.log = function(message, module){
	writeLog('LOG', message, module);
};

Logger.prototype.system = function(message, module){
	writeLog('SYSTEM', message, module);
};

exports.Logger = Logger;