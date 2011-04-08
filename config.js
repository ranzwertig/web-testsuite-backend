exports.modulesEnabled = [
    'toFile',
    'toMongo'
];

exports.httpSettings = {
    port: process.env.C9_PORT,
    host: '0.0.0.0'
};