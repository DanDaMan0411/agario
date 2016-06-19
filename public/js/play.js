var maxFoodAmount = 100;
var worldDimension = 3000;

var BLOB_ID;
var foodPos;
var colorPos = [];

var enemies;

var foodAmount = 0;

var foods;

//This is for the blob
var startDim = 100;
//This is the max height and width for a blob that eats food
var maxEatFoodSize = 400;

var foodColors = [
	"greenFood",
	"purpleFood",
	"blueFood",
	"orangeFood",
	"redFood",
]

var blobTypes = [
	"uruguayBlob",
]

function getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var playerBlobType = blobTypes[getRandomInt(0, blobTypes.length-1)]

var socket = io();

var playerAlive;

//Gives the blob the socket id it has
socket.on("assignId", function(newPlayerId){
	BLOB_ID = newPlayerId;
	
	console.log("My ID: " + BLOB_ID);
})

//This runs when player first connects, it initializes all the food positions
socket.on("makeFood", function(foodPositions){
	foodPos = foodPositions;
});



//These are queues for when food nneds to be either generated or removed from clients world
var removeQueue = [];
var addQueue = [];

socket.on("removeFood", function(eatenPosition){
	removeQueue.push(eatenPosition);
})

socket.on("addFood", function(newFoodPosition){
	addQueue.push(newFoodPosition);
})

//Queues for player adding and removing
addPlayerQueue = [];
removePlayerQueue = [];

//This updates other players position for client
updatePosQueue = [];
updateMassQueue = [];

socket.on("playerDisconnect", function(playerId){
	if(enemies != undefined){
		for (var i = 0; i < enemies.children.length; i++){
			if(playerId == enemies.children[i].id){
				removePlayerQueue.push(i);
			};
		};
	};
	
	if(playerId == BLOB_ID){
		playerAlive = false;
	};
});

//This creates pre existing players when you join the lobby
socket.on("makePlayers", function(players){
	for (player in players){
		if (player != BLOB_ID){
			addPlayerQueue.push(players[player])
		}
	}
});

socket.on("playerAdded", function(newPlayerInfo){
	addPlayerQueue.push(newPlayerInfo);
});

//This finds the position of the enemy in enemy group by matching the id
function findEnemyPosition(id){
	if (enemies != undefined){
		for (var i = 0; i < enemies.children.length; i ++){
			if (enemies.children[i].id == id){
				return i;
			}
		}
	}
	return null	
}

//This is event handler for if another player in the game has moved.
//This sends new players position to updatePosQueue to be updated in update function of play state
socket.on("playerMoved", function(moveInfo){
	var enemyPosition = findEnemyPosition(moveInfo.id);
	if (enemyPosition != null){
		updatePosQueue[0] = ({id: enemyPosition, position: moveInfo.position});	
	}
});

//Event handler for if another player's mass has changed
//Sends new mass to updateMassQueue to be updated in update function.
socket.on("massChanged", function(massInfo){
	var enemyPosition = findEnemyPosition(massInfo.id);
	
	updateMassQueue.push({id: enemyPosition, height: massInfo.height, width: massInfo.width, mass: massInfo.mass})
});

var playState = {
	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	
	//This runs whenever one of the elements in blobInfo has been changed on the client
	updateBlob: function(){
		var blobInfo = this.makeBlobInfo();
		
		socket.emit("updateBlob", blobInfo);
	},
	
	makeBlobInfo: function(){
		//All of the blobs important information for storage on main server		
		var blobInfo = {
			id: BLOB_ID,
			blobType: playerBlobType,
			x: blob.x,
			y: blob.y,
			mass: blob.body.data.mass,
			width: blob.width,
			height: blob.height,
		}
		return blobInfo
	},
	
	//This initializes the colors of each food at each position of foodPos
	initColorPos: function(){
		for (var i = 0; i < maxFoodAmount; i ++){
			var color = foodColors[this.getRandomInt(0, foodColors.length-1)]
			colorPos.push(color)
		}
	},
	
	initFood: function(){
		foods = game.add.group();
		
		foods.enableBody = true;
		foods.physicsBodyType = true;
		foods.physicsBodyType = Phaser.Physics.P2JS;
				
		for (var i = 0; i < maxFoodAmount; i ++){			
			if (foodPos[i] != undefined){
				var food = foods.create(foodPos[i][0], foodPos[i][1], colorPos[i]);
				
				food.id = i;
				
				food.name = "food";
				
				food.body.setCircle(10);
				
				food.body.velocity = (0, 0)
				
				food.body.setCollisionGroup(foodCollisionGroup);
				
				food.body.collides([foodCollisionGroup, playerCollisionGroup])
			
				foodAmount ++;
			}
		}
	},
	
	initPlayer: function(xPos, yPos, blobType){
		blob = game.add.sprite(xPos, yPos, blobType);
		
		playerAlive = true;
		
		blob.id = BLOB_ID;
		
		game.physics.p2.enable(blob, false);
		
		blob.body.setCircle(blob.width/2);
		
		blob.body.fixedRotation = true;
		
		blob.body.setCollisionGroup(playerCollisionGroup);
		
		blob.body.collides(foodCollisionGroup, this.eatFood, this);
		
		game.camera.follow(blob);
				
		//Start Mass
		blob.body.data.mass = 25;
		
		blob.name = "blob"
		
		cursors = game.input.keyboard.createCursorKeys();
		
		var blobInfo = this.makeBlobInfo();
		
		socket.emit("newPlayer", blobInfo)
	},
	
	eatFood: function(blobBody, foodBody){
		foodBody.sprite.kill();
		
		//This exists because the enemy blobs collide like the player is supposed to
		//This isn't suppposed to happen and I couldn't figure out how to get rid of it
		//The if statement is a semi fix for this problem, but it may cause problems in other areas
		if (blobBody.sprite.name != "enemy"){
			foodAmount --;
			
			if(foodAmount <= maxFoodAmount){
				blob.body.data.mass ++;
				
				console.log("Food eaten")
						
				var foodBodyPosition = foodBody.sprite.id;
							
				socket.emit("foodEaten", foodBodyPosition);	
				
				if (blobBody.sprite.height < maxEatFoodSize && blobBody.sprite.width < maxEatFoodSize){		
					blobBody.sprite.height ++;
					blobBody.sprite.width ++;
								
					socket.emit("massChanged", {id: BLOB_ID, height: blobBody.sprite.height, width: blobBody.sprite.width, mass: blob.body.data.mass})
					
					this.updateBlob();
					
					blobBody.sprite.body.setCircle(blobBody.sprite.width/2);
					blobBody.sprite.body.setCollisionGroup(playerCollisionGroup);
					blobBody.sprite.body.collides(foodCollisionGroup, this.eatFood, this);
				}
			}
		}
	},
	
	initEnemies: function(){
		enemies = game.add.group();
		
		enemies.enableBody = true;
		enemies.physicsBodyType = true;
		enemies.physicsBodyType = Phaser.Physics.P2JS;
	},
	
	spawnEnemy: function(xPos, yPos, blobType, mass, width, height, id){
		var enemy = game.add.sprite(xPos, yPos, blobType);
							
		game.physics.p2.enable(enemy, false);
		
		enemy.width = width;
		enemy.height = height;
		
		enemy.body.setCircle(enemy.width/2);
		
		enemy.body.fixedRotation = true;
		
		enemy.body.data.mass = mass;
		
		enemy.id = id;
		
		enemy.name = "enemy";
						
		enemies.add(enemy);
	},
	
	create: function(){
		game.physics.startSystem(Phaser.Physics.P2JS);
		
		game.physics.p2.setImpactEvents(true);
		
		game.physics.p2.restitution = 0.8;
		
		game.world.setBounds(0, 0, worldDimension, worldDimension);
		
		game.stage.disableVisibilityChange = true;
		
		//This repeats the grid background to fit the whole bounds
		//var background = game.add.tileSprite(0, 0, game.world.bounds.height, game.world.bounds.width, 'grid');
		//background.name = "background";
		
		game.physics.p2.setPostBroadphaseCallback(this.checkSprite, this);
		
		playerCollisionGroup = game.physics.p2.createCollisionGroup();
		foodCollisionGroup = game.physics.p2.createCollisionGroup();
		
		game.physics.p2.updateBoundsCollisionGroup();
		
		this.initColorPos();
		this.initFood();
		this.initEnemies();
		this.initPlayer(this.getRandomInt(startDim, game.world.width - startDim), this.getRandomInt(startDim, game.world.width - startDim), playerBlobType);
	},
	
	
	//This handles collision between sprites
	checkSprite: function(body1, body2){
		//This runs when two players collide 
		if ((body1.sprite.name == 'enemy' && body2.sprite.name == 'blob') || (body2.sprite.name == 'blob' && body1.sprite.name == "enemy")){			
			console.log("\n\n\n++++PLAYER COLLISION++++\n\n\n")
			var collidedSprites = [{id: body1.sprite.id, height: body1.sprite.height}, {id: body2.sprite.id, height: body2.sprite.height}]
			socket.emit("playerCollision", collidedSprites)
			return false;
		}
		return true;			
	},
	
	addFood: function(position){		
		var food = foods.create(foodPos[position][0], foodPos[position][1], colorPos[position]);
		
		food.id = position;
		
		food.name = "food";
		
		food.body.setCircle(10);
		
		food.body.velocity = (0, 0);
		
		food.body.setCollisionGroup(foodCollisionGroup);
		
		food.body.collides([foodCollisionGroup, playerCollisionGroup]);
		
		foodAmount ++;
	},
	
	update: function(){
		
		
		
		if (foods != undefined){
			if (foods.children.length > 15){
				foods.forEach(function(food){food.kill();});
				foodAmount = 0;
				this.initFood();
			};
		}
		
		blob.body.setZeroVelocity();
		
		
		if (Phaser.Rectangle.contains(blob.body, game.input.x, game.input.y)){
			blob.body.velocity.setTo(0, 0);
		}else{
			game.physics.arcade.moveToPointer(blob, 200);
			
			socket.emit("posUpdated", blob.position);
		};
		
		
		if (removeQueue.length > 0){
			foods.children[removeQueue[0]].kill();
			foodAmount --;
			
			removeQueue.shift();
		};
		
		if (addQueue.length > 0){
			foods.children[addQueue[0]].body.setZeroVelocity();
			this.addFood(addQueue[0]);
			
			addQueue.shift();
		};
		
		if (addPlayerQueue.length > 0){
			this.spawnEnemy(addPlayerQueue[0].x, addPlayerQueue[0].y, addPlayerQueue[0].blobType, addPlayerQueue[0].mass, addPlayerQueue[0].width, addPlayerQueue[0].height, addPlayerQueue[0].id);
						
			addPlayerQueue.shift();
		};
		
		if (removePlayerQueue.length > 0){
			enemies.children[removePlayerQueue[0]].kill();
			
			removePlayerQueue.shift();
		};
		
		if (updatePosQueue.length > 0){
			enemies.children[updatePosQueue[0].id].body.x = updatePosQueue[0].position.x;
			enemies.children[updatePosQueue[0].id].body.y = updatePosQueue[0].position.y;
			enemies.children[updatePosQueue[0].id].body.setZeroVelocity();
			
			updatePosQueue.shift();
		};
		
		if (updateMassQueue.length > 0){			
			//This is to make sure enemies array is actually created
			if (enemies.children[updateMassQueue[0].id] != undefined){
				enemies.children[updateMassQueue[0].id].height = updateMassQueue[0].height;
				enemies.children[updateMassQueue[0].id].width = updateMassQueue[0].width;
				
				enemies.children[updateMassQueue[0].id].body.setCircle(enemies.children[updateMassQueue[0].id].width/2);
				enemies.children[updateMassQueue[0].id].body.setCollisionGroup(playerCollisionGroup);
				enemies.children[updateMassQueue[0].id].body.collides(foodCollisionGroup, this.eatFood, this);
				
				updateMassQueue.shift();
			}
		};
		
		//This triggers after the player has been collided with a bigger player
		if (!playerAlive){
			blob.kill();
		};
		
	},
}
