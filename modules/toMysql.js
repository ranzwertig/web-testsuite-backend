/**
 *  Collect data from the web-testsuite and stores it inside a mysql database.
 * 
 *  After posting a result to [host]/results/ it will return a JSON object 
 *  containing the id of the inserted result.
 * 
 *  You can retrieve a list of all results by performing a request like
 *  GET /results/?result=list
 *  This list can be filtered using query parameters like
 *  since=[YYYY-mm-dd hh:MM:ss] // list all results since this timestamp (including)
 *  max=[\d*]                   // list [\d*] results 
 *  offset=[\d*]                // list results ignoring the first [\d*] results
 *  or select a single result 
 *  /results/?result=[id]       // fetch the result with the id [id]
 * 
 *  @dependencie https://github.com/felixge/node-mysql
 * 
 *  @version 0.0.4
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
        res.end();
    }
};

exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && reqUrl.query.result === 'list'){
        var query = "SELECT id FROM "+config.TABLE_NAME;
        if(typeof reqUrl.query.since !== 'undefined' && /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(reqUrl.query.since)){
            query += " WHERE created >= '"+reqUrl.query.since+"'";
        }
        if(typeof reqUrl.query.max !== 'undefined' && /\d*/.test(reqUrl.query.max)){
            if(typeof reqUrl.query.offset !== 'undefined' && /\d*/.test(reqUrl.query.offset)){
                query += " LIMIT "+reqUrl.query.offset+", "+reqUrl.query.max;
            }
            else{
                query += " LIMIT "+reqUrl.query.max;
            }
        }
        db.query(query,function(error,results,fields){
            if(error){
                console.log(error);
                res.writeHead(500);
            }
            else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(results));
            }
            res.end();
        });
    }
    else if((reqUrl.pathname === '/results/' || reqUrl.pathname === '/results') && typeof reqUrl.query.result !== 'undefined' && reqUrl.query.result !== 'list' && /\d*/.test(reqUrl.query.result)){
        db.query("SELECT id, info, tests, useragent, created FROM "+config.TABLE_NAME+" WHERE id = "+reqUrl.query.result,function(error,results,fields){
            if(error){
                console.log(error);
                res.writeHead(500);
            }
            else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(results));
            }
            res.end();
        });
    }
    else{
        res.end();
    }
};