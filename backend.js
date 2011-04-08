var http = require('http'),
    server = require('./lib/httpserver'),
    config = require('./config'),
    Barrier = require('./lib/barrier').Barrier;

var backend = new server.HttpServer(config.httpSettings);

//  load all enabled modules
var mods = [];
for(var i = 0; i < config.modulesEnabled.length; i +=1){
    //  load all enabled modules
    var mod = require('./modules/'+config.modulesEnabled[i]);
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
    for(var i = 0; i < mods.length; i += 1) {
        var mod = mods[i];
        if (typeof mod.onget === 'function'){
            //  id the module has a handler for this http method
            //  call the handler with the modified response object
            mod.onget(req, res);
        }
        else {
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
    for(var i = 0; i < mods.length; i += 1) {
        var mod = mods[i];
        if (typeof mod.onpost === 'function'){
            mod.onpost(req, res);
        }
        else {
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
    for(var i = 0; i < mods.length; i += 1) {
        var mod = mods[i];
        if (typeof mod.onput === 'function'){
            mod.onput(req, res);
        }
        else {
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
    for(var i = 0; i < mods.length; i += 1) {
        var mod = mods[i];
        if (typeof mod.ondelete === 'function'){
            mod.ondelete(req, res);
        }
        else {
            barrier.commit();
        }
    }
});

backend.start();