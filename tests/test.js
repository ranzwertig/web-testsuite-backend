var Cache = require('../lib/datastore').DataStore;

var ds = new Cache();

var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
  
    console.time('read 1');
    ds.file('./modules/simpleStats/simpleStats.html', function(err, cacheElement){
        res.write(cacheElement.data);
    });
  
}).listen(process.env.C9_PORT, "0.0.0.0");


