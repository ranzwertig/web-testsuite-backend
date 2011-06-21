/**
 *  The Module SimpleStats provides some very simple statistics about the submitted tests
 * 
 *  @version 0.9.1
 *  @author Christian Ranz <info@christianranz.com>
 *  @see https://github.com/ranzwertig/web-testsuite-backend/wiki/Tofile
 *  @license MIT
 */
 
// config section
var config = {
    // define the Path where the logs were saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '/var/web-testsuite-results',
    
    // configure the cron cycle in seconds
    cronCycle: 10,
    
    // realtime updates using socket.io
    realtime: true
};
// config section end
 
var url = require('url'),
    UserAgentParser = require('./simpleStats/parser').UserAgentParser,
    Barrier = require('../lib/barrier').Barrier,
    fs = require('fs'),
    util = require('util'),
    sio = require('socket.io');
    
// cache for stats
var cache = {
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
    devices: {},
    browsers: {},
    succeededtests: 0,
    failedtests: 0,
    errortests: 0,
    notapptests: 0,
    totaltests: 0,
    browserranking: {},
    useragents: {}
};
  
// process realtime results to stats
var processRealtimeResult = function(test){
	try{
        var info = test.info;
        var tests = test.tests;
        var uaString = info["window.navigator.userAgent"];
        
        cache.testsetstotal += 1;
        var ua = UserAgentParser.parse(info["window.navigator.userAgent"]);
        
        if (typeof ua === 'undefined') {
            if(cache.faileduas.indexOf(uaString) === -1){
                cache.faileduas.push(uaString);
                cache.useragentparserfails += 1;
            }
        }    
        else {
        	// useragent list
            if(typeof cache.useragents[uaString] === 'undefined'){
                cache.useragents[uaString] = {
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
            if(typeof cache.browsers[ua.browser.name] === 'undefined'){
                cache.browsers[ua.browser.name] = [];
                cache.diffbrowsers += 1;
            }
            if(cache.browsers[ua.browser.name].indexOf(ua.browser.version) === -1){
                cache.browsers[ua.browser.name].push(ua.browser.version);
                cache.diffbrowserversions += 1;
            }
            cache.browsers[ua.browser.name][ua.browser.version] += 1;
            // device stats
            if(typeof ua.hardware.name === 'undefined'){
                ua.hardware.name = 'Other'
            }
            if(cache.devices.indexOf(ua.hardware.name) === -1){
                cache.devices.push(ua.hardware.name);
                cache.diffdevices += 1;
            }
            
            // process tests
            if(typeof cache.browserranking[ua.browser.name] === 'undefined'){
                cache.browserranking[ua.browser.name] = {
                	failed: 0,
                	success: 0,
                	error: 0,
                	notapp: 0,
                	total: 0
                };
            }
            
            for(var index = 0; index < tests.length; index += 1){
                var singleTest = tests[index];
                cache.browserranking[ua.browser.name].total += 1;
                if(singleTest.result === 'success'){
			    	cache.succeededtests += 1;
			    	cache.browserranking[ua.browser.name].success += 1;
			    }
			    else if(singleTest.result === 'failure'){
			    	cache.failedtests += 1;
			    	cache.browserranking[ua.browser.name].failed += 1;
			    }
			    else if(singleTest.result === 'not applicable'){
			    	cache.notapptests += 1;
			    	cache.browserranking[ua.browser.name].notapp += 1;
			    }
                else{
                	cache.errortests += 1;
                	cache.browserranking[ua.browser.name].error += 1;
                }
            }
            cache.totaltests = cache.succeededtests+cache.failedtests+cache.notapptests+cache.errortests;
        }
	}catch(error){
		console.log(error);
	}
};
    
// init function called by the loader
var modulMessenger = {};
var socket;
exports.init = function(settings){
	console.log('init simpleSatts');
	if(typeof settings.messenger !== 'undefined'){
		modulMessenger = settings.messenger;
		// listen for jsonresult event and add stats
		modulMessenger.on('jsonresult',function(result){
			// process the realtime result
			processRealtimeResult(result);
			// if realtime is enabled broadcast cache
			if(typeof socket !== 'undefined' && config.realtime === true){
				socket.broadcast(cache);
			}
		});
		
		// listen on the event for started server
		modulMessenger.on('serverstarted',function(backend){
			// open the socket if the realtime feature is enabled
			if(config.realtime === true){
				socket = sio.listen(backend.server);
				socket.on('connection', function(client){
					client.on('message', function(data){
 				 	});
 				 	client.on('disconnect', function(data){
 				 	});
				});
			}
		});
	}
};

// generate stats every x seconds
var processFileResults = function(){
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
                cache = {
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
                };
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
                    console.log(error);
                }
            };
            
            for(var i = 0; i < files.length; i += 1){
                var file = files[i];
                fs.readFile(config.outputPath+'/'+file, processFile);
            }
        }
        else{
            cache = {
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
    			devices: {},
    			browsers: {},
    			succeededtests: 0,
    			failedtests: 0,
    			errortests: 0,
    			notapptests: 0,
    			totaltests: 0,
    			browserranking: {},
    			useragents: {}
            };
        }  
    });   
};
// set cron to update the files when realtime feature is disabled
if(config.cronCycle > 0 && config.realtime == false){
	setInterval(processFileResults, config.cronCycle * 1000);
}
else{
	processFileResults();
}
 
exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/simplestats/data' || reqUrl.pathname === '/simplestats/data/'){
    	res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    	// send stats from cache to client
    	res.write(JSON.stringify(cache));
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