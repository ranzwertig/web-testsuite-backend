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
    fs = require('fs'),
    util = require('util');
 
exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/simplestats/data' || reqUrl.pathname === '/simplestats/data/'){
        fs.readdir(config.outputPath, function(err, files){
            if(!err){
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
      
                var parserFail = [];
                var useragentParserFails = 0;
                
                var browserStats = [];
                var deviceStats = [];
                var testsetsTotal = 0;
                var devicesTotal = 0;
                var browsersTotal = 0;
                var browsersVersionsTotal = 0;
                
                var barrier = new Barrier(files.length, function() {
                    // output browser stats
                    res.write(JSON.stringify({
                        status: 200,
                        error: false,
                        message: 'OK',
                        action: 'GET /simplestats/data',
                        testsetstotal: testsetsTotal,
                        diffbrowsers: browsersTotal,
                        diffdevices: devicesTotal,
                        useragentparserfails: useragentParserFails,
                        faileduas: parserFail,
                        diffbrowserversions: browsersVersionsTotal,
                        devices: deviceStats,
                        browsers: browserStats
                    }));
                    res.end();
                });
                
                
                var processFile = function (err, data) {
                    var test = JSON.parse(data);
                    var info = test.info;
                    var uaString = info["window.navigator.userAgent"];
                    
                    testsetsTotal += 1;
                    
                    var ua = UserAgentParser.parse(info["window.navigator.userAgent"]);
                    
                    if (typeof ua === 'undefined') {
                        if(parserFail.indexOf(uaString) === -1){
                            parserFail.push(uaString);
                            useragentParserFails += 1;
                        }
                    }    
                    else {
                        // browser stats
                        if(typeof browserStats[ua.browser.name] === 'undefined'){
                            browserStats[ua.browser.name] = [];
                            browsersTotal += 1;
                        }
                        if(browserStats[ua.browser.name].indexOf(ua.browser.version) === -1){
                            browserStats[ua.browser.name].push(ua.browser.version);
                            browsersVersionsTotal += 1;
                        }
                        browserStats[ua.browser.name][ua.browser.version] += 1;
                        // device stats
                        if(typeof ua.hardware.name === 'undefined'){
                            ua.hardware.name = 'Other'
                        }
                        if(deviceStats.indexOf(ua.hardware.name) === -1){
                            deviceStats.push(ua.hardware.name);
                            devicesTotal += 1;
                        }
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
    // output the simpleStats html
    else if(reqUrl.pathname === '/simplestats' || reqUrl.pathname === '/simplestats/'){
        var readStream = fs.createReadStream('./modules/simpleStats/simpleStats.html');
        util.pump(readStream, res, function(){
            res.writeHead(500);    
            res.end();
            return;
        });
        readStream.on('end', function(){
            res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
            res.end();
        });
    }
    else{
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
        res.end();
    }
};