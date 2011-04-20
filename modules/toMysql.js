/**
 *  Collect data from the web-testsuite and store it inside a mysql database.
 * 
 *  @dependencies
 *  https://github.com/felixge/node-mysql
 *  npm install mysql
 * 
 *  @version 0.0.1
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
 
var config = {
    database: 'results',
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: '3306',
    debug:  false,
    TABLE_NAME: 'results'
};


var url = require('url'),
    qs = require('querystring');
    Client = require("mysql").Client,
    db = new Client(config);

db.connect();

exports.onpost = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/results' || reqUrl.pathname === '/results/'){
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
            db.query("INSERT into "+config.TABLE_NAME+" (info, tests, useragent) VALUES ('"+infoRaw+"', '"+testsRaw+"', '"+userAgent+"');",function(err,results,fields){
                res.write(error);    
            });
            res.end();
        });
    }
    else{
        res.end();
    }
};

exports.onget = function(req, res){
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    console.log('dpp');
    res.write('hello');
    res.end();
};