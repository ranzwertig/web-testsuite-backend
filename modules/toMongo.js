/**
 *  This module stores the data sent from the web-testsuite inside a mongodb
 *  datastore.
 * 
 *  @dependency https://github.com/christkv/node-mongodb-native
 * 
 *  @version 0.0.1
 *  @author Christian Ranz
 *  @licence MIT
 */
 
// config section
var config = {
    host: '127.0.0.1',
    port: 27017,
    db: 'web-testsuite',
    collection: 'results',
    native_parser: true
};
// end config section

var url = require('url'),
    qs = require('querystring'),
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

var db = new Db(config.db, new Server(config.host, config.port, {}), {native_parser:config.native_parser});
 
// please do NOT edit anything below here
exports.onpost = function(req, res){
    var reqUrl = url.parse(req.url, true);
    console.log('post');
    if(reqUrl.pathname === '/results' || reqUrl.pathname === '/results/'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        var data = '';
        req.on('data',function(chunk){
            data += chunk.toString();
        });
        req.on('end',function(){
            console.log('data');
            var theData = qs.parse(data),
                infoRaw = theData.info,
                testsRaw = theData.test_data,
                info = JSON.parse(infoRaw),
                tests = JSON.parse(testsRaw);
                
            var result = {
                created: new Date(),
                info: info,
                tests: tests
            };
            db.open(function(error, db){
                console.log('open');
                if(error){
                    console.log(error);
                    res.write(JSON.stringify({
                        status: 500,
                        error: false,
                        message: err,
                        action: 'post'
                    }));
                    res.seriouslyEnd();
                    return;
                }
                else{
                    db.collection(config.collection, function(err, collection){
                        collection.insert(result);
                    });
                    db.close();
                }
                res.write(JSON.stringify({
                    status: 200,
                    error: false,
                    message: 'OK',
                    action: 'post'
                }));
                res.end();
            });
        });
    }
    else{
        res.writeHead(404);
        res.end();
    }
};

exports.onget = function(req,res){
    res.write('hello');
    res.end();
};