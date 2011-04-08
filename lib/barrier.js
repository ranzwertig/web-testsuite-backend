var Barrier = function(watchFunctions, callback){
    this.count = 0;
    this.total = watchFunctions;
    
    this.commit = function(){
        this.count += 1;
        if (this.count === this.total){
            return callback();
        }
    };
};

exports.Barrier = Barrier;