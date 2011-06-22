/**
 *  backend.js is a lightweight http server to collect the results of the 
 *  web-testsuite (https://github.com/vf/web-testsuite) and proceed them.
 * 
 *  @author Christian Ranz
 *  @license MIT
 *  @version 0.2.1
 */

var http = require('http'),
    server = require('./lib/httpserver'),
    config = require('./config'),
    Barrier = require('./lib/barrier').Barrier,
    Messenger = require('./lib/messenger').Messenger,
    Logger = require('./lib/logger').Logger;
    
//  get arguments from comman line
process.argv.forEach(function (val, index, array) {
    if((/port=/).test(val)){
        val = val.split('=');
        config.httpSettings.port = val[1];
    }
    else if((/host=/).test(val)){
        val = val.split('=');
        config.httpSettings.host = val[1];
    }
});

//  start the http server
var backend = new server.HttpServer(config.httpSettings);

/**
 * the Messenger allows a communication between the modules 
 * using events. A module can listen on the Messenger to
 * recieve messages and events.
 */
var moduleMessenger = new Messenger();

// init logger
var moduleLogger = new Logger({
    level: 1  
});

//  load all enabled modules
var mods = [];
for(var i = 0; i < config.modulesEnabled.length; i +=1){
    //  load all enabled modules
    var mod = require('./modules/'+config.modulesEnabled[i]);
    // pass the moduleMessenger to the module if it supports it
    if(typeof mod.init === 'function'){
    	mod.init({
    		messenger: moduleMessenger,
            logger: moduleLogger
    	});
    }
    mods.push(mod);
}

//  add the http method listeners
backend.on('get',function(req, res){
    var barrier = new Barrier(mods.length, function(){
        //  after all modules comitted seariouslyEnd the res
        res.seriouslyEnd();
    });
    //  prevent a module ending the response
    res.seriouslyEnd = res.end;
    //  the new res.end is the commit of the barrier
    res.end = function(){
        barrier.commit();
    };
    for(var i = 0; i < mods.length; i += 1){
        var mod = mods[i];
        if(typeof mod.onget === 'function'){
            //  id the module has a handler for this http method
            //  call the handler with the modified response object
            mod.onget(req, res);
        }
        else{
            //  if there is no handler commit and skip this module
            barrier.commit();
        }
    }
});

backend.on('post',function(req, res){
    var barrier = new Barrier(mods.length, function(){
        res.seriouslyEnd();
    });
    res.seriouslyEnd = res.end;
    res.end = function(){
        barrier.commit();
    };
    for(var i = 0; i < mods.length; i += 1){
        var mod = mods[i];
        if(typeof mod.onpost === 'function'){
            mod.onpost(req, res);
        }
        else{
            barrier.commit();
        }
    }
});

backend.on('put',function(req, res){
    var barrier = new Barrier(mods.length, function(){
        res.seriouslyEnd();
    });
    res.seriouslyEnd = res.end;
    res.end = function(){
        barrier.commit();
    };
    for(var i = 0; i < mods.length; i += 1){
        var mod = mods[i];
        if(typeof mod.onput === 'function'){
            mod.onput(req, res);
        }
        else{
            barrier.commit();
        }
    }
});

backend.on('delete',function(req, res){
    var barrier = new Barrier(mods.length, function(){
        res.seriouslyEnd();
    });
    res.seriouslyEnd = res.end;
    res.end = function(){
        barrier.commit();
    };
    for(var i = 0; i < mods.length; i += 1){
        var mod = mods[i];
        if(typeof mod.ondelete === 'function'){
            mod.ondelete(req, res);
        }
        else{
            barrier.commit();
        }
    }
});

backend.start();
// give the server to all modules which needs it
moduleMessenger.emit('serverstarted', backend);