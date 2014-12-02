// app.js
var express = require('express');
var path = require('path');
var app = module.exports.app = exports.app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "../client/dist")));

// Run server
var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Perceptron server listening at http://%s:%s', host, port);

});