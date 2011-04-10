var http = require('http'),
    util = require('util'),
    events = require('events');

var HttpServer = function(settings){
    events.EventEmitter.call(this);
    this.port = settings.port;
    this.host = settings.host;
};

util.inherits(HttpServer, events.EventEmitter);

HttpServer.prototype.start = function(){
    var that = this;
    var requestCallback = function(req, res){
        var data;
        that.emit('request', req, res);
        
        if(req.method === 'GET'){
            that.emit('get', req, res);
        }
        else if(req.method === 'POST'){
            that.emit('post', req, res);
        }
        else if(req.method === 'PUT'){
            that.emit('put', req, res);
        }
        else if(req.method === 'DELETE'){                
            that.emit('delete', req, res);
        }
            
        req.on('data', function(chunk){
            data += chunk;
        });
        req.on('end', function(){
            that.emit('data', req, res, data);
        });
    };
    this.server = http.createServer(requestCallback);
    this.server.listen(this.port, this.host);
    console.log('server listening on '+this.host+' on port '+this.port);
};

exports.HttpServer = HttpServer;