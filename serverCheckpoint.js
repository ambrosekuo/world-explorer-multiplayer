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
  constructor(playerInfo) {
    this.username = playerInfo.username;
    this.info = {...playerInfo};
    this.parts = {
      container: "",
      mask: "",
      body: "",
    }
  }
}

class PlayerInfo { 
  constructor(username, startX, startY, 
    playerType, gold, equips, experience, level, room) {
    this.databaseId = '';
    this.socketId = '';
    this.loggedIn = false;
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

// Still have to deal with post/get

function createDefaultPlayer(username) {
  // Initiate startY at 300 for drop effect
  let equips = {'mask': 'none'}; // So far just have mask in equips
  let gold = 100; // starting at 0 is just sad 
  return new PlayerInfo(username, 0, 300, 'Female', gold, equips, 0, 0, 'lobby');
}

app.use("/assets", express.static(__dirname + "/assets"));
app.use("/myGameJs", express.static(__dirname + "/myGame.js"));


app.get("/", function(req, res) {
  // Have to send info here maybe? lol..
  res.sendFile(__dirname + "/myGame.html");
});




// Reminder
// Have session info and can access database via User schema
io.on("connection", function(socket) {
  
  connections.push(socket);

  //******** */
  // Maybe add in connected/logged in as a server message
  // Implement chatbox, I swear you can make it in like 1hour, but leave it later
  console.log("Connected: %s sockets connected", connections.length);

  let userInfo;
  let newPlayer;

  // Gets user info from game's localstorage being emitted in myGame.js
  //   then updates the database's user with socket.id to connect the html page to info
  socket.on("sendUserInfo", function(user) {
    userInfo = {...user};
    User.where({_id: userInfo['_id'] }).update({
      $set: {"player.socketId": socket.id}
    });
  });

  // Cheks if player exists and adds to allPlayers if so.
  User.findById(userInfo['_id'], (err, doc) => {
    if (err)  {
      console.log('User not in database');
    }
    else {
      const newPlayerInfo;
      // Create new player or load exiting player info from database 
      if (doc.player == null) {
        newPlayerInfo = createDefaultPlayer(userInfo.username);
        newPlayerInfo.socketId = socket.id;
        newPlayerInfo.databaseId = userInfo['_id'];
        User.where({_id: userInfo['_id'] }).update({
          $set: {player: {...newPlayerInfo}}
        });
        // Adding new player to array.
      }
      else { // Not really a new player, but will see it as it is anyways.
        newPlayerInfo = {...doc.player};
      }
      newPlayer = new Player(newPlayerInfo);
      allPlayers[newPlayer.info.room].players.push(newPlayer);
    }
  });

  socket.emit("currentPlayers", allPlayers);

  //Just have to change step by step now
  socket.broadcast.emit("newPlayer", newPlayer);

  socket.on("disconnecting", function(data) {
    let room = newPlayer.info.room;

    for (let i = 0; i < allPlayers[room]['players'][i]; i++) {
      if (socket.id == allPlayers[room]['players'][i].info.socketId) {
        io.emit("deletePlayer", { socketId : socket.id, room: room, index: i});
        allPlayers[room]['players'].splice(i,1);
        User.findById(userInfo['_id'], (err, doc) => { //removes socket
          doc.player.info.socketId = '';
          doc.save();
      })
      break;
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
