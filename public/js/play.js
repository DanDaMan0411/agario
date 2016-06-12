var maxFoodAmount = 10
var BLOB_ID;
var foodPos;

//This is for the blob
var startDim = 100;

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

//Gives the blob the socket id it has
socket.on("assignId", function(newPlayerId){
	BLOB_ID = newPlayerId;
})

//This runs when player first connects, it initializes all the food positions
socket.on("makeFood", function(foodPositions){
	foodPos = foodPositions;
})

//These are queues for when food nneds to be either generated or removed from clients world
var removeQueue = []
var addQueue = []

socket.on("removeFood", function(eatenPosition){
	removeQueue.push(eatenPosition);
})

socket.on("addFood", function(newFoodPosition){
	addQueue.push(newFoodPosition);
})

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
			blobType: playerBlobType,
			x: blob.x,
			y: blob.y,
			mass: blob.body.data.mass,
			width: blob.width,
			height: blob.height,
		}
		return blobInfo
	},
	
	initFood: function(){
		foods = game.add.group();
		
		foods.enableBody = true;
		foods.physicsBodyType = true;
		foods.physicsBodyType = Phaser.Physics.P2JS;
		
		for (var i = 0; i < maxFoodAmount; i ++){			
			if (foodPos[i] != undefined){
				var food = foods.create(foodPos[i][0], foodPos[i][1], foodColors[this.getRandomInt(0, foodColors.length-1)]);
				
				food.id = i;
				
				food.body.setCircle(10);
				
				food.body.velocity = (0, 0)
				
				food.body.setCollisionGroup(foodCollisionGroup);
				
				food.body.collides([foodCollisionGroup, playerCollisionGroup])
			}
		}
	},
	
	initPlayer: function(xPos, yPos, blobType){
		blob = game.add.sprite(xPos, yPos, blobType);
		
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
		blob.body.data.mass ++;
		
		var foodBodyPosition = foodBody.sprite.id
		
		socket.emit("foodEaten", foodBodyPosition)	
				
		foodBody.sprite.kill();
			
		blobBody.sprite.height ++
		blobBody.sprite.width ++
		
		this.updateBlob();
		
		blobBody.sprite.body.setCircle(blobBody.sprite.width/2);
		blobBody.sprite.body.setCollisionGroup(playerCollisionGroup);
		blobBody.sprite.body.collides(foodCollisionGroup, this.eatFood, this);
	},

	create: function(){
		game.physics.startSystem(Phaser.Physics.P2JS);
		
		game.physics.p2.setImpactEvents(true);
		
		game.physics.p2.restitution = 0.8;
		
		game.world.setBounds(0, 0, 500, 500)
		
		//This repeats the grid background to fit the whole bounds
		game.add.tileSprite(0, 0, game.world.bounds.height, game.world.bounds.width, 'grid')
		
		game.physics.p2.setPostBroadphaseCallback(this.checkSprite, this);
		
		playerCollisionGroup = game.physics.p2.createCollisionGroup();
		foodCollisionGroup = game.physics.p2.createCollisionGroup();
		
		game.physics.p2.updateBoundsCollisionGroup();
		
		this.initFood();
		
		this.initPlayer(this.getRandomInt(startDim, game.world.width - startDim), this.getRandomInt(startDim, game.world.width - startDim), playerBlobType);
		
		socket.on("playerAdded", function(newPlayerInfo){
			//This function should be out on the top layer but it doesn't work out there. Try to get a fix at some point
			function spawnEnemy(xPos, yPos, blobType, mass, width, height){
				var enemy = game.add.sprite(xPos, yPos, blobType);
				
				game.physics.p2.enable(enemy, false);
				
				enemy.width = width;
				enemy.height = height;
				
				enemy.body.setCircle(enemy.width/2);
				
				enemy.body.fixedRotation = true;
				
				enemy.body.setCollisionGroup(playerCollisionGroup);
				
				enemy.body.collides(foodCollisionGroup, this.eatFood, this);
				enemy.body.collides(playerCollisionGroup, this.hitPlayer, this);
						
				//Start Mass
				enemy.body.data.mass = mass;
				
				enemy.name = "enemy"
			}
			
			spawnEnemy(newPlayerInfo.x, newPlayerInfo.y, newPlayerInfo.blobType, newPlayerInfo.mass, newPlayerInfo.width, newPlayerInfo.height)
			console.log("enemy spawned")
		})
	},
	
	checkSprite: function(body1, body2) {
		if ((body1.sprite.name == 'enemy' && body2.sprite.name == 'player') || (body2.sprite.name == 'player' && body1.sprite.name == "enemy")){			
			return false;
		}

		return true;
	},
	
	addFood: function(position){
		var food = foods.create(foodPos[position][0], foodPos[position][1], foodColors[this.getRandomInt(0, foodColors.length-1)]);
		
		food.id = position;
		
		food.body.setCircle(10);
		
		food.body.velocity = (0, 0)
		
		food.body.setCollisionGroup(foodCollisionGroup);
		
		food.body.collides([foodCollisionGroup, playerCollisionGroup])
		
		return food
	},
	
	update: function(){
		blob.body.setZeroVelocity();
		
		if (Phaser.Rectangle.contains(blob.body, game.input.x, game.input.y)){
			blob.body.velocity.setTo(0, 0);
		}else{
			game.physics.arcade.moveToPointer(blob, 200);
		}
						
		if (removeQueue.length > 0){
			foods.children[removeQueue[0]].kill();
			removeQueue.shift();
		}
		
		if (addQueue.length > 0){
			foods.children[addQueue[0]] = this.addFood(addQueue[0]);
			addQueue.shift();
		}
	},
}
