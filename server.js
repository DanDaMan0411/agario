var express = require('express')
var app = express()

var fs = require('fs')
var path = require('path')

var http = require('http').Server(app)
var io = require('socket.io')(http)

function getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/views/index.html');
})

gameBlobs = {};

var maxFoodAmount = 10;
var worldDimension = 500;

//Sets the foodPositions for the world. Produces the max amount of food for the world.
function makeFoodPositions(){
	foodList = []
	for (var i = 0; i < maxFoodAmount; i++){
		var xPos = getRandomInt(0, worldDimension)
		var yPos = getRandomInt(0, worldDimension)
		
		var position = [xPos, yPos]
		
		foodList.push(position)
	}
	return foodList
}

//This returns one coordinate for food to be made
function generateNewFood(){
	var xPos = getRandomInt(0, worldDimension)
	var yPos = getRandomInt(0, worldDimension)
	
	var position = [xPos, yPos]
	
	return position
}

//This is the variable that contains the food positions for food for all players
var gameFoodPositions = makeFoodPositions()

io.on("connection", function(socket){
	console.log("Connection");
			
	socket.emit("makeFood", gameFoodPositions);
	
	socket.emit("assignId", socket.id);
	socket.on("newPlayer", function(blobInfo){
		makeFoodPositions();
		
		gameBlobs[socket.id] = blobInfo;
		
		console.log(blobInfo)
				
		socket.broadcast.emit("playerAdded", blobInfo)
				
		socket.emit("makePlayers", gameBlobs);
	});
	
	socket.on("posUpdated", function(playerPos){
		gameBlobs[socket.id].x = playerPos.x
		gameBlobs[socket.id].y = playerPos.y
			
		socket.broadcast.emit("playerMoved", {id: socket.id, position: playerPos})
	});
	
	socket.on("foodEaten", function(eatenPosition){		
		gameFoodPositions[eatenPosition] = generateNewFood();
		socket.broadcast.emit("removeFood", eatenPosition);
		
		//This updates the food list held by all clients
		io.sockets.emit("makeFood", gameFoodPositions);
		
		//This tells clients to make the new food that replaced the eaten one
		io.sockets.emit("addFood", eatenPosition);
	})
	
	socket.on("updateBlob", function(newInfo){
		gameBlobs[socket.id] = newInfo
	});
	
	socket.on("disconnect", function(){
		var playerId = socket.id;
		console.log(playerId + " Disconnected");
		
		socket.broadcast.emit("playerDisconnect", playerId);
		
		delete gameBlobs[socket.id]
	});
})

http.listen(4000, function(){
	console.log('listening on localhost:4000')
})
