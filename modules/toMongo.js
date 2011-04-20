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

var Db = require('mongodb').Db;

var db = new Db(config.db, new Server(config.host, config.port, {}), {native_parser:config.native_parser});
 
// please do NOT edit anything below here
exports.onpost = function(req,res){
    if(reqUrl.pathname === '/results' || reqUrl.pathname === '/results/'){
        res.writeHead(200, {'Content-Type': 'application/json'});
        var data = '';
        req.on('data',function(chunk){
            data += chunk.toString();
        });
        req.on('end',function(){
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
                if(error){
                    
                }
                else{
                    db.collection(config.collection, function(err, collection){
                        collection.insert(result);
                        res.end();
                    });
                    db.close();
                }
            });
        });
    }
    else{
        res.writeHead(404);
        res.end();
    }
};

exports.onpost = function(req,res){
    res.end();
};