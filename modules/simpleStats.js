/**
 *  The Module SimpleStats provides some very simple statistics about the submitted tests
 */
 
// config section
var config = {
    // define the Path where the logs were saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '/var/web-testsuite-results',
};
// config section end
 
var url = require('url'),
    UserAgentParser = require('./simpleStats/parser').UserAgentParser,
    Barrier = require('../lib/barrier').Barrier,
    fs = require('fs');
 
exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/simplestats' || reqUrl.pathname === '/simplestats/'){
        fs.readdir(config.outputPath, function(err, files){
            if(!err){
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
      
                var parserFail = [];
                
                var browserStats = [];
                var deviceStats = [];
      
                var barrier = new Barrier(files.length, function() {
                    // output browser stats
                    res.write('Browser Statistics:\n------------------\n\n');
                    for(var key in browserStats){
                        var versionStats = browserStats[key];
                        res.write(key+':\n');
                        var total = 0;
                        for(var version in versionStats){
                            res.write('\t'+version+':\t'+versionStats[version]+'\n');
                            total += versionStats[version];
                        }
                        res.write('\ttotal:\t'+total+'\n\n');
                    }
                    
                    // output device stats
                    res.write('\n\n\nDevice Statistics:\n------------------n\n');
                    for(var deviceKey in deviceStats){
                        var browser = deviceStats[deviceKey];
                        res.write(deviceKey+':\n');
                        for(var browserKey in browser){
                            var version = browser[browserKey];
                            res.write('\t'+browserKey+':\n');
                            for(var versionKey in version){
                                res.write('\t\t'+versionKey+':\t'+version[versionKey]+'\n');
                            }
                        }
                    }
                    
                    res.write('\n\n\nParser Errors:\n--------------\n\n');
                    for(var err in parserFail){
                        res.write(' '+parserFail[err]+'\t'+err+'\n');
                    }
                    res.end();
                });
                
                
                var processFile = function (err, data) {
                    var test = JSON.parse(data);
                    var info = test.info;
                    var uaString = info["window.navigator.userAgent"];
                    
                    var ua = UserAgentParser.parse(info["window.navigator.userAgent"]);
                    
                    if (typeof ua === 'undefined') {
                        if(typeof parserFail[uaString] === 'undefined'){
                            parserFail[uaString] = 0;
                        }
                        parserFail[uaString] += 1;
                    }    
                    else {
                        // browser stats
                        if(typeof browserStats[ua.browser.name] === 'undefined'){
                            browserStats[ua.browser.name] = [];
                        }
                        if(typeof browserStats[ua.browser.name][ua.browser.version] === 'undefined'){
                            browserStats[ua.browser.name][ua.browser.version] = 0;
                        }
                        browserStats[ua.browser.name][ua.browser.version] += 1;
                        // device stats
                        if(typeof ua.hardware.name === 'undefined'){
                            ua.hardware.name = 'Other'
                        }
                        if(typeof deviceStats[ua.hardware.name] === 'undefined'){
                            deviceStats[ua.hardware.name] = [];
                        }
                        if(typeof deviceStats[ua.hardware.name][ua.browser.name] === 'undefined'){
                            deviceStats[ua.hardware.name][ua.browser.name] = [];
                        }
                        if(typeof deviceStats[ua.hardware.name][ua.browser.name][ua.browser.version] === 'undefined'){
                            deviceStats[ua.hardware.name][ua.browser.name][ua.browser.version] = 0;
                        }
                        deviceStats[ua.hardware.name][ua.browser.name][ua.browser.version] += 1;
                    }
                    barrier.commit();
                };
                
                for(var i = 0; i < files.length; i += 1){
                    var file = files[i];
                    fs.readFile(config.outputPath+'/'+file, processFile);
                }
            }
            else{
                res.writeHead(500, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                var responseJson = {
                    status: 500,
                    error: true,
                    message: 'ERROR',
                    action: 'GET /simplestats/',
                    files: []
                };
                res.write(JSON.stringify(responseJson));
                res.end();
            }
            
        });
    }
    else{
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
        res.end();
    }
};