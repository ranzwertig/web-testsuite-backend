/**
 *  This module stores the data sent from the web-testsuite inside a mongodb
 *  datastore.
 * 
 *  A result posted to 
 *  POST /results/
 *  is stored in a mongodb database and collection configured in the config 
 *  section.
 *  The object keys have to be modified becaus mongodb does not support '.' in
 *  object keys. They are replaced with '-'.
 *  e.g. 'window.navigator.userAgent' => 'window-navigator-userAgent'
 * 
 *  You can retrieve a list of all results by performing a request like
 *  GET /results/?result=list
 *  This list can be filtered using query parameters like
 *  max=[\d*]                   // list [\d*] results 
 *  offset=[\d*]                // list results ignoring the first [\d*] results
 *  or select a single result 
 *  /results/?result=[id]       // fetch the result with the id [id]
 * 
 *  @dependency https://github.com/christkv/node-mongodb-native
 * 
 *  @version 0.0.2
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
    if(reqUrl.pathname === '/results' || reqUrl.pathname === '/results/'){
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
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
            
            //  clean up the info object (remove '.' in keys)
            var cleanInfo = {}; 
            for(var key in info){
                if(info.hasOwnProperty(key)){ 
                    var tkey = key.replace(/\./g,'-'); 
                    cleanInfo[tkey] = info[key]; 
                } 
            }
            
            db.open(function(error, db){
                if(error){
                    console.log(error);
                    res.write(JSON.stringify({
                        status: 500,
                        error: false,
                        message: error,
                        action: 'post'
                    }));
                    res.end();
                    db.close();
                    return;
                }
                else{
                    db.collection(config.collection, function(error, collection){
                        if(error){
                            console.log(error);
                            res.write(JSON.stringify({
                                status: 500,
                                error: false,
                                message: error,
                                action: 'post'
                            }));
                            res.end();
                            db.close();
                            return;
                        }
                        else{
                            collection.insert({
                                created: new Date(),
                                info: cleanInfo,                      
                                tests: tests
                            });
                            res.write(JSON.stringify({
                                status: 200,
                                error: false,
                                message: 'OK',
                                action: 'post'
                            }));
                            res.end();
                            db.close();
                        }
                    });     
                }
            });
        });
    }
    else{
        res.end();
    }
};

exports.onget = function(req,res){
    var reqUrl = url.parse(req.url, true);
    if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && reqUrl.query.result === 'list'){
        db.open(function(error, db){
            if(error){
                res.writeHead(500);
                console.log(error.message);
                db.close();
                res.end();
                return;
            }
            else{
                db.collection(config.collection, function(error, collection){
                    if(error){
                        res.writeHead(500);
                        console.log(error);
                        db.close();
                        res.end();
                        return;
                    }
                    else{
                        var processResult = function(error, results){
                            if(error){
                                res.writeHead(500);
                                console.log(error);
                                db.close();
                                res.end();
                                return; 
                            }
                            else{
                                res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                                res.write(JSON.stringify(results));
                                res.end();
                                db.close(); 
                            }
                        };
                        if(typeof reqUrl.query.max !== 'undefined' && /\d*/.test(reqUrl.query.max) && typeof reqUrl.query.offset !== 'undefined' && /\d*/.test(reqUrl.query.offset)){
                            collection.find({}, {'_id': 1},{skip:reqUrl.query.offset,limit:reqUrl.query.max}).toArray(processResult);    
                        }
                        else if(typeof reqUrl.query.max !== 'undefined' && /\d*/.test(reqUrl.query.max)){
                            collection.find({}, {'_id': 1},{limit:reqUrl.query.max}).toArray(processResult);
                        }
                        else if(typeof reqUrl.query.offset !== 'undefined' && /\d*/.test(reqUrl.query.offset)){
                            collection.find({}, {'_id': 1},{skip:reqUrl.query.offset}).toArray(processResult);
                        }
                        else{
                            collection.find({}, {'_id': 1}).toArray(processResult);
                        }
                    }
                });
            }
        });
    }
    else if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && typeof reqUrl.query.result !== 'undefined' && reqUrl.query.result !== 'list'){
        db.open(function(error, db){
            if(error){
                res.writeHead(500);
                console.log(error.message);
                db.close();
                res.end();
                return;
            }
            else{
                db.collection(config.collection, function(error, collection){
                    if(error){
                        res.writeHead(500);
                        console.log(error);
                        db.close();
                        res.end();
                        return;
                    }
                    else{
                        collection.find({'_id':new db.bson_serializer.ObjectID(reqUrl.query.result)}).toArray(function(error, results){
                            if(error){
                                res.writeHead(500);
                                console.log(error);
                                db.close();
                                res.end();
                                return; 
                            }
                            else{
                                res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
                                res.write(JSON.stringify(results));
                                res.end();
                                db.close(); 
                            }
                        });
                    }
                });
            }
        });
    }
    else{
        res.end();
    }
};