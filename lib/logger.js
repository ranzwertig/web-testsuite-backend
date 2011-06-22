var util = require('util');

/**
 *	Logger writing to stdout
 *	Levels;
 *		0: SYSTEM / CRITICAL
 * 		1: SYSTEM / CRITICAL / ERROR
 * 		2: SYSTEM / CRITICAL / ERROR/ WARNING
 * 		3: SYSTEM / CRITICAL / ERROR/ WARNING / LOG
 *
 */

var Logger = function(settings) {
    this.level = typeof settings.level === 'undefined' ? 3 : settings.level;
    this.module = typeof settings.module === 'undefined' ? 'NONE' : settings.module;
};

var writeLog = function(type, message, module) {
	var tmodule = typeof module === 'undefined' ? this.module : module;
    util.log(type+' '+'MODULE/'+tmodule+' MESSAGE: '+message);
};

Logger.prototype.critical = function(message, module){
	if(this.level >= 0) writeLog('CRITICAL', message, module);
};

Logger.prototype.error = function(message, module){
	if(this.level >= 1) writeLog('ERROR', message, module);
};

Logger.prototype.warning = function(message, module){
	if(this.level >= 2) writeLog('WARNING', message, module);
};

Logger.prototype.log = function(message, module){
	if(this.level >= 3) writeLog('LOG', message, module);
};

Logger.prototype.system = function(message, module){
	if(this.level >= 0) writeLog('SYSTEM', message, module);
};

exports.Logger = Logger;