exports.onpost = function(req, res){
    res.end();
};

exports.onget = function(req, res){
    res.write('hello from toFile module');
    res.end();  
};