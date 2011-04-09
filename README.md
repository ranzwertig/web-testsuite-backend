web-testsuite-backend
=====================

This is a backend http server to collect results of the web-testsuite (https://github.com/vf/web-testsuite) written in node.js.
This project is in a very early state of development. If there are any questions, design issues or bugs, file them on github or
contact me (info@browserlove.org, @browserlove or @ranzwertig).

Requirements
------------

- Node 0.4+

How to install and run
----------------------

1. Download and compile nodejs (http://nodejs.org/).
2. Clone or Download the web-testsuite-backend source from Github.
3. Modify the config.js file.
4. do sth, like 

        $ node backend.js

Configuration
-------------

Modify the config.js file to set the port and host you server should run.
Therefore edit following section:

        exports.httpSettings = {
            port: 8080,
            host: '127.0.0.1'
        };

Modules
-------

The web-testsuite-backend is designed to support multiple modules where the requests are processed. All modules are stored in the *modules* folder. 
To enable a module, just go to the *config.js* File and add the module to the following section:

    exports.modulesEnabled = [
        'toFile',
        'toMongo'
    ];

The request handlers inside the modules are called in the order they are enabled. 

A module for example looks like:

    exports.onpost = function(req, res){
        res.write('hello from post handler');
        res.end();
    };
    
    exports.onget = function(req, res){
        res.write('hello from get handler');
        res.end();  
    };

In this example a handler for *GET* and *POST* requests is defined. Possible handlers are:

    exports.onget = function(request, response) { ...; response.end(); };
    exports.onpost = function(request, response) { ...; response.end(); };
    exports.onput = function(request, response) { ...; response.end(); };
    exports.ondelete = function(request, response) { ...; response.end(); };

When the function *response.end()* is called inside a module request handler, the response isn't ended!
It just sends a signal to the backend which ends the response after all modules finished.
So it is necessary to call *response.end()* inside a module after all the processing happened!

**If you really need to end the response inside a module handler use *response.seriouslyEnd()*. But be
careful with this, the following modules might fail!!!**

Todos
-----

- handle exceptions!!!
- secure toFile module
- make backend.js configurable by commandline args
- ...

any suggestions? Please contact me ... (info@browserlove.org, @browserlove or @ranzwertig)



