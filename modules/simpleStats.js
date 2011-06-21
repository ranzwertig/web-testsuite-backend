/**
 *  The Module SimpleStats provides some very simple statistics about the submitted tests
 */
 
// config section
var config = {
    // define the Path where the logs were saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '/var/web-testsuite-results',
    
    // configure the cron cycle in seconds
    cronCycle: 10
};
// config section end
 
var url = require('url'),
    UserAgentParser = require('./simpleStats/parser').UserAgentParser,
    Barrier = require('../lib/barrier').Barrier,
    fs = require('fs'),
    util = require('util');

// cache for stats
var cache = JSON.stringify({
    status: 204,
    error: true,
    message: 'EMPTY STATS',
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
// generate stats every x seconds
setInterval(function(){
	fs.readdir(config.outputPath, function(err, files){
        if(!err){    
            var parserFail = [];
            var userAgents = {};
            var useragentParserFails = 0;
            
            var browserStats = {};
            var deviceStats = [];
            var testsetsTotal = 0;
            var devicesTotal = 0;
            var browsersTotal = 0;
            var browsersVersionsTotal = 0;
            var failedTests = 0;
            var succeededTests = 0;
            var errorTests = 0;
            var notAppTests = 0;
            var browserRanking = {};
            
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
                    browsers: browserStats,
                    succeededtests: succeededTests,
                    failedtests: failedTests,
                    errortests: errorTests,
                    notapptests: notAppTests,
                    totaltests: succeededTests + failedTests + errorTests + notAppTests,
                    browserranking: browserRanking,
                    useragents: userAgents
                });
            });
            
            
            var processFile = function (err, data) {
            	try{
                    var test = JSON.parse(data);
                    var info = test.info;
                    var tests = test.tests;
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
                    	// useragent list
                    	if(typeof userAgents[uaString] === 'undefined'){
                    	    userAgents[uaString] = {
                    	    	'browser.name': ua.browser.name,
                    	    	'browser.version': ua.browser.version,
                    	    	'hardware.name': ua.hardware.name,
                    	    	'os.name': ua.os.name,
                    	    	'security': ua.security,
                    	    	'locale': ua.locale,
                    	    	'engine.name': ua.engine.name,
                    	    	'engine.version': ua.engine.version
                    	    };    
                    	}
                    
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
                        
                        // process tests
                    	if(typeof browserRanking[ua.browser.name] === 'undefined'){
                    		browserRanking[ua.browser.name] = {
                    			failed: 0,
                    			success: 0,
                    			error: 0,
                    			notapp: 0,
                    			total: 0
                    		};
                    	}
                    	
                    	for(var index = 0; index < tests.length; index += 1){
                    		var singleTest = tests[index];
                    		browserRanking[ua.browser.name].total += 1;
                    		if(singleTest.result === 'success'){
								succeededTests += 1;
								browserRanking[ua.browser.name].success += 1;
							}
							else if(singleTest.result === 'failure'){
								failedTests += 1;
								browserRanking[ua.browser.name].failed += 1;
							}
							else if(singleTest.result === 'not applicable'){
								notAppTests += 1;
								browserRanking[ua.browser.name].notapp += 1;
							}
                    		else{
                    			errorTests += 1;
                    			browserRanking[ua.browser.name].error += 1;
                    		}
                    	}
                    }
                    barrier.commit();
                }catch(error){
                	// error processing file
                }
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
    	res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    	// send stats from cache to client
    	res.write(cache);
    	res.end();
    }
    // output the simpleStats html
    else if(reqUrl.pathname === '/simplestats' || reqUrl.pathname === '/simplestats/'){
        res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
        var readStream = fs.createReadStream('./modules/simpleStats/simpleStats.html');
        util.pump(readStream, res, function(){
            res.writeHead(500);    
            res.end();
            return;
        });
        readStream.on('end', function(){
            res.end();
        });
    }
    else{
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
        res.end();
    }
};