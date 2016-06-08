//This runs the game after the font has either loaded or failed to load
var wfconfig = {
	active: function() { 
		console.log("font loaded");
		init()
	},
	inactive: function() {
		console.log("fonts could not be loaded!");
		init()
	},
	google: {
	  families: ['Questrial',
				 'Orbitron',
				 'Russo One']
	}
};

function loadFont() {
	//Web font comes from the js file at this link
	//https://ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js
	WebFont.load(wfconfig);
};

window.onload = function(){
	loadFont();
};
