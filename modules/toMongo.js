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
                                /*windowHTMLAudioElement: info['window.HTMLAudioElement'],
                                windowHTMLCanvasElement: info['window.HTMLCanvasElement'],
                                windowHTMLMediaElement: info['window.HTMLMediaElement'],
                                windowHTMLMeterElement: info['window.HTMLMeterElement'],
                                windowHTMLVideoElement: info['window.HTMLVideoElement'],
                                windowJSONparse: info['window.JSON.parse'],
                                window.JSON.stringify: info[''],
                                window.NodeList: info[''],
                                window.SVGDocument: info[''],
                                window.WebGLRenderingContext: info[''],
                                window.Worker: info[''],
                                window.applicationCache: info[''],
                                window.localStorage: info[''],
                                window.navigator.appCodeName: info[''],
                                window.navigator.appMinorVersio: info[''],
                                window.navigator.appName: info[''],
                                window.navigator.appVersion: info[''],
                                window.navigator.cookieEnabled: info[''],
                                window.navigator.geolocation: info[''],
                                indow.navigator.getStorageUpdates: info[''],
                                window.navigator.javaEnabled: info[''],
                                window.navigator.language: info[''],
                                window.navigator.mimeTypes: info[''],
                                window.navigator.onLine: info[''],
                                window.navigator.platform: info[''],
                                window.navigator.plugins: info[''],
                                window.navigator.product: info[''],
                                window.navigator.productSub: info[''],
                                window.navigator.taintEnabled: info[''],
                                window.navigator.userAgent: info[''],
                                window.navigator.userLanguage: info[''],
                                window.navigator.vendor: info[''],
                                window.navigator.vendorSub: info[''],
                                window.screen.availHeight: info[''],
                                window.screen.availLeft: info[''],
                                window.screen.availTop: info[''],
                                window.screen.availWidth: info[''],
                                window.screen.height: info[''],
                                window.screen.left: info[''],
                                window.screen.top: info[''],
                                window.screen.width: info[''],     */                           
                                tests: tests
                            });
                            collection.count(function(err, count) {
                                console.log(count);
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
        res.writeHead(404);
        res.end();
    }
};

exports.onget = function(req,res){
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    res.write('hello');
    res.end();
};