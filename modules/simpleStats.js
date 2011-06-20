/**
 *  The Module SimpleStats provides some very simple statistics about the submitted tests
 */
 
// config section
var config = {
    // define the Path where the logs were saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '/var/web-testsuite-results',
    
    // configure the cron cycle in seconds
    cronCycle: 3
};
// config section end
 
var url = require('url'),
    UserAgentParser = require('./simpleStats/parser').UserAgentParser,
    Barrier = require('../lib/barrier').Barrier,
    fs = require('fs'),
    util = require('util');

// generate stats every x seconds
var cache = '';

setInterval(function(){
	console.log('generate stats');
	fs.readdir(config.outputPath, function(err, files){
        if(!err){    
            var parserFail = [];
            var useragentParserFails = 0;
            
            var browserStats = {};
            var deviceStats = [];
            var testsetsTotal = 0;
            var devicesTotal = 0;
            var browsersTotal = 0;
            var browsersVersionsTotal = 0;
            
            var barrier = new Barrier(files.length, function() {
                // cache the stats
                cache = JSON.stringify({
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
                });
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
            cache = JSON.stringify({
                status: 500,
                error: true,
                message: 'ERROR',
                action: 'GET /simplestats/data',
                testsetstotal: 0,
                diffbrowsers: 0,
                diffdevices: 0,
                useragentparserfails: 0,
                faileduas: [],
                diffbrowserversions: 0,
                devices: [],
                browsers: []
            });
        }  
    });   
},config.cronCycle * 1000);
 
exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/simplestats/data' || reqUrl.pathname === '/simplestats/data/'){
    	console.log('from cache');
    	res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    	res.write(cache);
    	res.end();
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