var util = require('util'),
    events = require('events');
    
/**
 * The Messenger class just wrapps a EventEmitter to support communication 
 * between the modules.
 */
var Messenger = function(){ 
	this.type = 'messenger'; 
};

util.inherits(Messenger, events.EventEmitter);

exports.Messenger = Messenger;