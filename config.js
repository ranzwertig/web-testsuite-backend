/**
 *  modulesEnabled
 *  enable or disable modules just by adding or removing them from the 
 *  js array.
 *  
 *  The modules are executed in the same order they are defined.
 */
exports.modulesEnabled = [
    // 'toMysql'
    //,'toFile'
       'toMongo'
];

/**
 *  httpSettings
 *  configure the port and the host the http server should listen on.
 */
exports.httpSettings = {
    port: process.env.C9_PORT,
    host: '0.0.0.0'
};