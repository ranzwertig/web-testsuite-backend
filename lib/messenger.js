var util = require('util'),
    events = require('events');
    
var Messenger = function(){ 
	this.type = 'messenger'; 
};

util.inherits(Messenger, events.EventEmitter);

exports.Messenger = Messenger;