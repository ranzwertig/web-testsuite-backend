exports.onpost = function(req, res){
    res.end();
};

exports.onget = function(req, res){
    res.write('hello from toMongo module');
    res.end();
};