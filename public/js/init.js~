function init(){
	window.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, '', {});
	game.state.add('boot', bootState);
	game.state.add('load', loadState);
	game.state.add('menu', menuState);
	game.state.add('play', playState);
	game.state.add('end', endState);

	game.state.start('boot');
}
