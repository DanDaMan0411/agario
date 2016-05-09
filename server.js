var express = require('express')
var app = express()

var fs = require('fs')
var path = require('path')

var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/views/index.html')
})

http.listen(4000, function(){
	console.log('listening on localhost:4000')
})
