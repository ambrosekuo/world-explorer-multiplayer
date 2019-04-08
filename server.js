var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

var mongoose = require("mongoose");
var db = mongoose.connection;
var bodyParser = require("body-parser");
var User = require('/user');

// Current worlds: 'lobby', 'mutli-race', 'single-mode'
//add levels at the end

// Register/ Log in,


// Keeps track of all players and information
// gameInfo in databse is equivalent to player
class Player { 
  constructor(username, startX, startY, 
    playerType, gold, equips, experience, level, room) {
    this.username = username;
    this.playerType = playerType;
    this.gold = gold;
    this.equips = {...equips};
    this.experience = experience;
    this.level = level ;
    this.room = room;
    this.x = startX;
    this.y = startY;
  }
}

var allPlayers = {
  'lobby': {
    'players' : [],
    'mapInfo' : {
    }
  },
  // Can nest multi-race to another depth if wanting to add levels
  'multi-race':  {
    'players' : [],
    'mapInfo' : {
    }
  },
  'single-mode': {
    'players' : [],
    'mapInfo' : {
    }
  }
};

const connectionString =
  "mongodb+srv://ambrosek:oRVSzAjpaT0VKFYG@cluster0-foe98.azure.mongodb.net/userBase?retryWrites=true";
connections = [];

app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(connectionString, { useNewUrlParser: true }); // connect to mongodb database
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log(" we're connected to data base!");
});


// Pretend you're at login screen, Make player
// Check for playerType to see if exists, if n


//Register

// So you access this part when logged in, if not logged in, ask to log in via redirection
// Either logged in and can get data in session
//        Logged in:  Either already a player and info in session, or not and not in session

//Log in 
if (req.body.use)
User.comparePassword(req.body.password);


//Logged in
app.get('/WorldExplorer', function(req, res, next) {
    if (JSON.parse(window.localStorage.getItem('loggedIn'))) {
      if (JSON.parse(window.localStorage.getItem("player")) === null) {
        // Create a new player with username and adds to the username, and uploads to database.
        const newPlayer = createDefaultPlayer(JSON.parse(window.localStorage.getItem("username")));
        window.localStorage.setItem('player', JSON.stringify(newPlayer));
        const id =  JSON.parse(window.localStorage.getItem("id"));
        User.where({_id: id }).update({
          $set: {player: newPlayer}
        });
      }
      res.sendFile(__dirname + "/myGame.html");
  }
  else {
    console.log("Not logged in");
    res.sendFile(__dirname + "/index.html");
  }
});

function createDefaultPlayer(username) {
  // Initiate startY at 300 for drop effect
  let equips = {'mask': 'none'}; // So far just have mask in equips
  let gold = 100; // starting at 0 is just sad 
  return new Player(username, 0, 300, 'Female', gold, equips, 0, 0, 'lobby');
}

app.use("/assets", express.static(__dirname + "/assets"));
app.use("/myGameJs", express.static(__dirname + "/myGame.js"));


app.get("/", function(req, res) {
  // Have to send info here maybe? lol..
  res.sendFile(__dirname + "/myGame.html");
});





io.on("connection", function(socket) {
  connections.push(socket);
  console.log("Connected: %s sockets connected", connections.length);
  //players.push(new Player(socket.id, Math.floor(Math.random() * 400) + 200));
  allPlayers.lobby(new Player(socket.id, 0));
  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players);

  socket.on("disconnecting", function(data) {
    for (let i = 0; i < players.length; i++) {
      if (socket.id == players[i].id) {
        console.log(players[i].id);
        io.emit("deletePlayer", players[i].id);
        players.splice(i, 1);
      }
    }
    players.splice(connections.indexOf(socket, 1));
    console.log("Disconnected: %s sockets connected", connections.length);
  });
  socket.on("playerMovement", function(movementData) {
    let index = getIndexFromSocketId(players, socket.id);
    console.log(index);
    players[index].x = movementData.x;
    players[index].y = movementData.y;
    socket.broadcast.emit("playerMoved", players[index]);
  });
});

function getIndexFromSocketId(players, socketId) {
  for (let i = 0; i < players.length; i++) {
    if (socketId == players[i].id) {
      return i;
    }
  }
}

server.listen(port, function() {
  console.log(`Listening on ${server.address().port}`);
});
