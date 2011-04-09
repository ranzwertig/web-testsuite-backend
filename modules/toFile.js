// config section
var config = {
    // define the Path where the logs should be saved
    // e.g. '.', '../foo', '/var/log'
    outputPath: '.',
    
    // Mocrotime: %microtime%
    // Date UTC String: %dateUTC%
    // feel free to add more
    fileName: 'log-%microtime%-%dateUTC%.json'
};

// Do NOT touch anything below this!!!
var fs = require('fs'),
    util = require('util'),
    url = require('url');

// the post request handler
exports.onpost = function(req, res){
    var microtime = new Date().getTime(),
        dateUTC = new Date().toUTCString();
    var fileName = config.fileName;
    fileName = fileName.replace(/%microtime%/g, microtime);
    fileName = fileName.replace(/%dateUTC%/g, dateUTC);
    fileName = fileName.replace(/ /g, '_');
    fileName = fileName.replace(/\//g, '');
    fileName = fileName.replace(/,/g, '');
    fileName = fileName.replace(/:/g, '-');
    
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
        // on outputStream error
    });
    
    // no more data
    req.on('end', function(){
        outputStream.end();
        
        res.writeHead(200, {'Content-Type': 'application/json'});
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
};

exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && reqUrl.query.file === 'list'){
        fs.readdir(config.outputPath, function(err, files){
            res.writeHead(200, {'Content-Type': 'application/json'});
            if(!err){
                var responseJson = {
                    status: 200,
                    error: false,
                    message: 'OK',
                    action: 'GET /results/?file=list',
                    files: files
                };
            }
            else{
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
    else if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && reqUrl.query.file !== 'list'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        var readStream = fs.createReadStream(config.outputPath+'/'+reqUrl.query.file);
        util.pump(readStream, res);
        readStream.on('end', function(){
            res.end();
        });
    }
    else{
        res.end();
    }
};
