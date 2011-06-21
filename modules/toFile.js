/**
 *  The module toFile listens for POST data and saves it to a File. It will
 *  return a JSON Object containing some information about the request and success
 *  and the name of the added file.
 *  By performing a GET request to /results/?file=list you will get a JSON Object
 *  containing some information about the request and a list of all files posted
 *  before.
 *  A GET request to /results/?file=[filename] returns the selected file.
 * 
 *  To configure this module please change the config section below.
 * 
 *  @version 0.9.3
 *  @author Christian Ranz <info@christianranz.com>
 *  @see https://github.com/ranzwertig/web-testsuite-backend/wiki/Tofile
 *  @license MIT
 */

// config section
var config = {
    // define the Path where the logs should be saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '/var/web-testsuite-results',
    
    // Microtime: %microtime%
    // Date UTC String: %dateUTC%
    // feel free to add more
    fileName: 'log-%microtime%-%dateUTC%.json',
    
    // parse the results into JSON
    saveAsJson: true
};
// config section end




// Do NOT touch anything below this!!!
var fs = require('fs'),
    util = require('util'),
    qs = require('querystring'),
    url = require('url');
    
// init function called by the loader
var modulMessenger = {};
exports.init = function(settings){
	if(typeof settings.messenger !== 'undefined'){
		modulMessenger = settings.messenger;
	}
};

// the post request handler
exports.onpost = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/results' || reqUrl.pathname === '/results/'){
        var microtime = new Date().getTime(),
            dateUTC = new Date().toUTCString();
        var fileName = config.fileName;
        fileName = fileName.replace(/%microtime%/g, microtime);
        fileName = fileName.replace(/%dateUTC%/g, dateUTC);
        fileName = fileName.replace(/ /g, '_');
        fileName = fileName.replace(/\//g, '');
        fileName = fileName.replace(/,/g, '');
        fileName = fileName.replace(/:/g, '-');
        
        if(config.saveAsJson === true){ // parse the request and store json data
            var data = '';
            req.on('data',function(chunk){
                data += chunk.toString();
            });
            req.on('end',function(){
                try {
                    var theData = qs.parse(data),
                        infoRaw = theData.info,
                        testsRaw = theData.test_data,
                        info = JSON.parse(infoRaw),
                        tests = JSON.parse(testsRaw),
                        result = {
                            info: info,
                            tests: tests
                        };
                        
                        modulMessenger.emit('jsonresult', result);
                                 
                    fs.writeFile(config.outputPath+'/'+fileName, JSON.stringify(result), function (error) {
                        if(error){
                            throw error;
                        }
                        else{
                            res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                            // build response object
                            var responseJson = {
                                status: 200,
                                error: false,
                                message: 'OK',
                                action: 'post',
                                generatedfile: fileName
                            };
                            
                            // send response data
                            res.write(JSON.stringify(responseJson));
                            // send signal module finished
                            res.end();
                        }
                    });
                } catch(error) {
                    res.writeHead(500);
                    res.write(JSON.stringify({
                        status: 500,
                        error: false,
                        message: error,
                        action: 'post'
                    }));
                    return;
                }
            });
        }
        else{ // use streaming and just store unparsed request data
            // init output stream
            var outputStream = fs.createWriteStream(
                config.outputPath+'/'+fileName,
                { 
                    flags: 'w',
                    encoding: null,
                    mode: 0666 
                }
            );
            
            // pump data from request to output
            util.pump(req, outputStream, function(error){
                res.writeHead(500);
                res.end();
                return;
            });
            
            // no more data
            req.on('end', function(){
                outputStream.end();
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                // build response object
                var responseJson = {
                    status: 200,
                    error: false,
                    message: 'OK',
                    action: 'post',
                    generatedfile: fileName
                };
                
                // send response data
                res.write(JSON.stringify(responseJson));
                // send signal module finished
                res.end();
            });
        }
    }
    else{
        res.end();
    }
};

exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    // handle request to list files
    if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && reqUrl.query.file === 'list'){
        // open output dir and list files
        fs.readdir(config.outputPath, function(err, files){
            if(!err){
                res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                var responseJson = {
                    status: 200,
                    error: false,
                    message: 'OK',
                    action: 'GET /results/?file=list',
                    files: files
                };
            }
            else{
                res.writeHead(500, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                var responseJson = {
                    status: 500,
                    error: true,
                    message: 'ERROR',
                    action: 'GET /results/?file=list',
                    files: []
                };
            }
            res.write(JSON.stringify(responseJson));
            res.end();
        });
    }
    // handle single file request
    else if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && typeof reqUrl.query.file !== 'undefined' && reqUrl.query.file !== 'list'){
        // check if file exists
        var file = reqUrl.query.file.replace(/\//g, '');
        fs.stat(config.outputPath+'/'+file, function(err, stat){
            if(err){
                res.writeHead(404);
                res.end();
                return;
            }
        });
        // return the file content
        var readStream = fs.createReadStream(config.outputPath+'/'+file);
        util.pump(readStream, res, function(){
            res.writeHead(500);    
            res.end();
            return;
        });
        readStream.on('end', function(){
            res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
            res.end();
        });
    }
    else{
        res.end();
    }
};
