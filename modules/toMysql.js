/**
 *  Collect data from the web-testsuite and stores it inside a mysql database.
 * 
 *  After posting a result to [host]/results/ it will return a JSON object 
 *  containing the id of the inserted result.
 * 
 *  @dependencie https://github.com/felixge/node-mysql
 * 
 *  @version 0.0.3
 *  @author Christian Ranz
 *  @licence MIT
 * 
 */
 
 /* table definition:
 
 CREATE table results (
    id BIGINT NOT NULL AUTO_INCREMENT,
    info TEXT NOT NULL,
    tests TEXT NOT NULL,
    useragent VARCHAR(300) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
 );
 
 */
 
//  config section
var config = {
    database: 'results',
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: '3306',
    debug:  false,
    TABLE_NAME: 'results'
};
//  end of config section

//  please do NOT edit anything below here
var url = require('url'),
    qs = require('querystring'),
    Client = require("mysql").Client,
    db = new Client(config);

db.connect();

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
                
            var userAgent = info['window.navigator.userAgent'];
            db.query("INSERT into "+config.TABLE_NAME+" (info, tests, useragent) VALUES ( ? , ? , ? );",[infoRaw, testsRaw, userAgent],function(error,results,fields){
                if(error){
                    console.log(error);
                    res.write(JSON.stringify({
                        status: 500,
                        error: false,
                        message: err,
                        action: 'post'
                    }));
                }
                else {
                    res.write(JSON.stringify({
                        status: 200,
                        error: false,
                        message: 'OK',
                        action: 'post',
                        insertedId: results.insertId
                    })); 
                }
                res.end();
            });
        });
    }
    else{
        res.writeHead(404);
        res.end();
    }
};

exports.onget = function(req, res){
    res.writeHead(404);
    res.end();
};