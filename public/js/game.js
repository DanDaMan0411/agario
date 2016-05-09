var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, '', {
	preload: preload,
	create: create,
	update: update,
	render: render,
})

function preload(){
	game.load.image('grid', 'assets/background.png')
}

var circle;
var floor;

var playerBlob = function(color, xCor, yCor, diameter){
	circle = game.add.graphics(0, 0);
	circle.beginFill(color);
	circle.drawCircle(0, 0, diameter);
		
	sprite = game.add.sprite(xCor, yCor);
	sprite.addChild(circle);
	
	
	game.physics.enable(sprite, Phaser.Physics.ARCADE);
	
	sprite.body.height = circleDiameter*2
	sprite.body.width = circleDiameter*2
	sprite.inputEnabled = true;
	
	sprite.body.collideWorldBounds = true;
	
	//This helps prevent ball from jiggling
	sprite.anchor.setTo(.5);
	
	game.camera.follow(sprite);
}

var circleDiameter = 25
var circleStomach = circleDiameter*0.75
var circleSpeed = 200

function create(){
	game.physics.startSystem(Phaser.Physics.ARCADE);
	
	game.world.setBounds(0, 0, 3000, 3000)
	
	//This repeats the grid background to fit the whole bounds
	game.add.tileSprite(0, 0, game.world.bounds.height, game.world.bounds.width, 'grid')	
	
	var player = new playerBlob("#666", game.world.centerX, game.world.centerY, circleDiameter)
}

function update(){	
	cursors = game.input.keyboard.createCursorKeys();
	
	if (sprite.input.pointerOver()){
		sprite.body.velocity.setTo(1, 1);
	}else{
		game.physics.arcade.moveToPointer(sprite, circleSpeed);
	}

}

function render(){
	game.debug.cameraInfo(game.camera, 32, 32);
	game.debug.pointer(game.input.activePointer);
}
