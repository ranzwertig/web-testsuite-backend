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
                res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                
                var barrier = new Barrier(files.length, function() {
                    res.end();
                });
                
                var processFile = function (err, data) {
                    var test = JSON.parse(data);
                    var info = test.info;
                    var ua = UserAgentParser.parse(info["window.navigator.userAgent"]);
                    console.log(info["window.navigator.userAgent"]);
                    
                    //res.write(ua.os.name+'\n');
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
        res.end();
    }
};