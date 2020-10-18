var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var hands = [];
var topCard = 0;
var numPerHand = 3;
var messages = [];
var oopses = 0;

function emitGame() {
	var cardsInPlay = 0;
	for (var id in hands) {
		cardsInPlay += hands[id].length;
	}

	io.clients((error, clients) => {
		for (var clientID in hands) {
			io.to(clientID).emit("gameState", {
				"hand": hands[clientID],
				"topCard": topCard,
				"messages": messages,
				"cardsInPlay": cardsInPlay,
				"numPlayers": clients.length,
				"oopses": oopses
			});
		}
	});
}

function resetGame() {
	io.clients(function(error, clients) {
		oopses = 0;
	
		while (messages.length > 0) {
			messages.pop();
		}
	
		var numPerHandTooHigh = false;
		while (numPerHand * clients.length > 50) {
			numPerHand--;
			numPerHandTooHigh = true;
		}
		if (numPerHandTooHigh) {
			messages.unshift("Adjusted difficulty to " + numPerHand + " - there's a maximum of 50 cards!");
		}
		
		if (numPerHand <= 0) {
			numPerHand = 1;
		}
		
		topCard = 0;
		for (var id in hands) { 
			if (hands.hasOwnProperty(id)) { 
				delete hands[id];
			}
		}
		
		var numbers = [];
		for (var i = 1; i <= 100; i++) {
			numbers.push(i);
		}
		numbers = shuffle(numbers);
		
		for (var i in clients) {
			var clientName = clients[i];
			
			var hand = [];
			for (var j = 0; j < numPerHand; j++) {
				hand.push(numbers.pop());
			}
			hands[clientName] = hand;
		}
		
		messages.unshift("New game started!");
		
		emitGame();
	});
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function playCard(playedCard) {
	topCard = playedCard;
	
	var discards = [];
	
	for (var id in hands) {
		var hand = hands[id];
		var newHand = [];
		
		for (var i in hand) {
			var card = hand[i];
			if (card > playedCard) {
				newHand.push(card);
			} else if (card < playedCard) {
				discards.push(card);
			}
		}
		
		while (hand.length > 0) {
			hand.pop();
		}
		
		for (var i in newHand) {
			hand.push(newHand[i]);
		}
	}
	
	if (discards.length > 0) {
		oopses++;
	
		discards = discards.sort((a, b) => a - b);
	
		var wrongPlayMessage = "Wrong play! Discarded ";
		if (discards.length == 1) {
		  wrongPlayMessage += "card " + discards[0];
		} else {
		  wrongPlayMessage += "cards ";
		  for (var i = 0; i < discards.length - 2; i++) {
			wrongPlayMessage += discards[i] + ", "
		  }
		  wrongPlayMessage += discards[discards.length - 2] + " and " + discards[discards.length - 1];
		}
		
		messages.unshift(wrongPlayMessage)
	} else {
		messages.unshift("Correctly played card " + playedCard + ".");
	}
	
	emitGame();
}

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/themind.js', function(req, res){
	res.sendFile(__dirname + '/themind.js');
});

app.get('/style.css', function(req, res){
	res.sendFile(__dirname + '/style.css');
});

app.get('/wood.jpg', function(req, res){
	res.sendFile(__dirname + '/wood.jpg');
});

app.get('/mindugh.mp3', function(req, res){
	res.sendFile(__dirname + '/mindugh.mp3');
});

io.on('connection', function(socket) {
	resetGame();
	
	socket.on('disconnect', function() {
		resetGame();
	});
	
	socket.on('play card', function(card) {
		playCard(card);
	});
	
	socket.on('reset', function() {
		resetGame();
	});
	
	socket.on('add difficulty', function() {
		numPerHand++;
		resetGame();
	});
	
	socket.on('subtract difficulty', function() {
		numPerHand--;
		resetGame();
	});
	
	/* corner cases for inc/decrementing numPerHand are fixed inside resetGame */
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});