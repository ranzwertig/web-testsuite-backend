/**
 *  This Module defines routes like '/' which can be used to display some 
 *  server information and howtos.
 */
 
var url = require('url');
 
exports.onget = function(req, res){
    var reqUrl = url.parse(req.url, true);
    if(reqUrl.pathname === '/' || reqUrl.pathname === ''){
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
        res.write('Welcome to the web-testsuite-backend');
        res.end();
    }
};