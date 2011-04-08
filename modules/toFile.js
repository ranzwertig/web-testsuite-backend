exports.onpost = function(req, res){
    console.log('post');
    res.end();
};

exports.onget = function(req, res){
    res.write('hello from toFile module');
    res.end();  
};