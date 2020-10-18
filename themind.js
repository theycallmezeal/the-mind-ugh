var socket = io();
var audio = new Audio("mindugh.mp3");

socket.on('gameState', function(gameState) {
	var hand = gameState["hand"];
	var topCard = gameState["topCard"];
	var messages = gameState["messages"];
	var cardsInPlay = gameState["cardsInPlay"];
	var numPlayers = gameState["numPlayers"];
	var oopses = gameState["oopses"];
	
	while (app._data.cards.length > 0) {
		app._data.cards.pop();
	}
	for (var i in hand) {
		app._data.cards.push(hand[i]);
	}
	
	while (app._data.messages.length > 0) {
		app._data.messages.pop();
	}
	for (var i in messages) {
		app._data.messages.push(messages[i]);
	}
	
	app._data.topCard = topCard;
	app._data.cardsInPlay = cardsInPlay;
	app._data.numPlayers = numPlayers;
	app._data.oopses = oopses;
});

var app = new Vue({
	el: "#app",
	data:  {
		numPlayers: 0,
		cards: [],
		topCard: 0,
		messages: [],
		cardsInPlay: 0,
		oopses: 0
	},
	methods: {
		playCard: function(card) {
			socket.emit('play card', card);
		},
		
		resetGame: function() {
			socket.emit('reset');
		},
		
		addDifficulty: function () {
			socket.emit('add difficulty');
		},
		
		subtractDifficulty: function () {
			socket.emit('subtract difficulty');
		},
		
		playSound: function () {
			audio.play();
		}
	}
});