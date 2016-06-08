var loadState = {
	create: function(){
		game.state.start('menu');
	},
	
	preload: function(){
		game.load.image('grid', 'assets/background.png');
		game.load.image('uruguayBlob', 'assets/uruguayBlob.png', 100, 100);
		
		game.load.image('greenFood', 'assets/greenFood.png', 25, 25);
		game.load.image('purpleFood', 'assets/purpleFood.png', 25, 25);
		game.load.image('blueFood', 'assets/blueFood.png', 25, 25);
		game.load.image('orangeFood', 'assets/orangeFood.png', 25, 25);
		game.load.image('redFood', 'assets/redFood.png', 25, 25);
	},
}
