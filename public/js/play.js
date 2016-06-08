var maxFoodAmount = 500
var foodColors = [
	"greenFood",
	"purpleFood",
	"blueFood",
	"orangeFood",
	"redFood",
]

var startDim = 100;

var playState = {
	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	initFood: function(){
		foods = game.add.group();
		
		foods.enableBody = true;
		foods.physicsBodyType = true;
		foods.physicsBodyType = Phaser.Physics.P2JS;
		
		for (var i = 0; i < maxFoodAmount; i ++){
			
			
			var food = foods.create(this.getRandomInt(0, game.world.width), this.getRandomInt(0, game.world.height), foodColors[this.getRandomInt(0, foodColors.length-1)]);
			food.body.setCircle(10);
			
			food.body.velocity = (0, 0)
			
			food.body.setCollisionGroup(foodCollisionGroup);
			
			food.body.collides([foodCollisionGroup, playerCollisionGroup])
		}
	},
	
	initPlayer: function(posX, posY){
		blob = game.add.sprite(posX, posY, 'uruguayBlob');
		
		game.physics.p2.enable(blob, false);
		
		blob.body.setCircle(blob.width/2);
		
		blob.body.fixedRotation = true;
		
		blob.body.setCollisionGroup(playerCollisionGroup);
		
		blob.body.collides(foodCollisionGroup, this.eatFood, this);
		blob.body.collides(playerCollisionGroup, this.hitPlayer, this);
		
		game.camera.follow(blob);
		
		//Start Mass
		blob.body.data.mass = 25;
		
		blob.name = "player"
		
		cursors = game.input.keyboard.createCursorKeys();
	},
	
	hitPlayer: function(playerBody, enemyBody){
		//enemyBody.sprite.body.clearCollision(true);
	},
	
	eatFood: function(blobBody, foodBody){		
		blob.body.data.mass ++;
		
		console.log(blob.body.data.mass);
		
		foodBody.sprite.kill();
			
		blobBody.sprite.height ++
		blobBody.sprite.width ++
		
		blobBody.sprite.body.setCircle(blobBody.sprite.width/2);
		blobBody.sprite.body.setCollisionGroup(playerCollisionGroup);
		blobBody.sprite.body.collides(foodCollisionGroup, this.eatFood, this);
	},

	create: function(){
		game.physics.startSystem(Phaser.Physics.P2JS);
		
		game.physics.p2.setImpactEvents(true);
		
		game.physics.p2.restitution = 0.8;
		
		game.world.setBounds(0, 0, 3000, 3000)
		
		//This repeats the grid background to fit the whole bounds
		game.add.tileSprite(0, 0, game.world.bounds.height, game.world.bounds.width, 'grid')
		
		game.physics.p2.setPostBroadphaseCallback(this.checkSprite, this);
		
		playerCollisionGroup = game.physics.p2.createCollisionGroup();
		foodCollisionGroup = game.physics.p2.createCollisionGroup();
		
		game.physics.p2.updateBoundsCollisionGroup();

		this.initFood();
		
		this.initPlayer(game.world.centerX, game.world.centerY);
	},
	
	checkSprite: function(body1, body2) {
		//  To explain - the post broadphase event has collected together all potential collision pairs in the world
		//  It doesn't mean they WILL collide, just that they might do.

		//  This callback is sent each collision pair of bodies. It's up to you how you compare them.
		//  If you return true then the pair will carry on into the narrow phase, potentially colliding.
		//  If you return false they will be removed from the narrow phase check all together.

		//  In this simple example if one of the bodies is our space ship, 
		//  and the other body is the green pepper sprite (frame ID 4) then we DON'T allow the collision to happen.
		//  Usually you would use a collision mask for something this simple, but it demonstates use.
		
		if ((body1.sprite.name == 'enemy' && body2.sprite.name == 'player') || (body2.sprite.name == 'player' && body1.sprite.name == "enemy")){			
			return false;
		}else{
			console.log(body1.sprite.name)	
			console.log(body2.sprite.name)	
		}

		return true;
	},
	
	update: function(){	
		blob.body.setZeroVelocity();
		
		if (Phaser.Rectangle.contains(blob.body, game.input.x, game.input.y)){
			blob.body.velocity.setTo(0, 0);
		}else{
			game.physics.arcade.moveToPointer(blob, 200);
		}
	},
}
