var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

var mongoose = require("mongoose").set("debug", true);
var db = mongoose.connection;
var bodyParser = require("body-parser");
var User = require("./user");
var bcrypt = require("bcrypt");

// Current worlds: 'lobby', 'mutli-race', 'single-mode'
//add levels at the end

// Register/ Log in,

// Keeps track of all players and information
// gameInfo in databse is equivalent to player

class Player {
  constructor(playerInfo) {
    this.username = playerInfo.username;
    this.info = { ...playerInfo };
    this.parts = {
      container: {},
      mask: {},
      body: {}
    };
  }
}

class PlayerInfo {
  constructor(
    username,
    startX,
    startY,
    playerType,
    gold,
    equips,
    experience,
    level,
    room
  ) {
    this.databaseId = "";
    this.socketId = "";
    this.loggedIn = false;
    this.facing = "right";
    this.username = username;
    this.playerType = playerType;
    this.gold = gold;
    this.equips = { ...equips };
    this.experience = experience;
    this.level = level;
    this.room = room;
    this.x = startX;
    this.y = startY;
  }
}

var allPlayers = {
  lobby: {
    players: [],
    mapInfo: {}
  },
  // Can nest multi-race to another depth if wanting to add levels
  "multi-race": {
    players: [],
    mapInfo: {}
  },
  "single-mode": {
    players: [],
    mapInfo: {}
  }
};

const connectionString =
  "mongodb+srv://ambrosek:oRVSzAjpaT0VKFYG@cluster0-foe98.azure.mongodb.net/playerBase?retryWrites=true";
connections = [];

app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(connectionString, { useNewUrlParser: true }); // connect to mongodb database
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log(" we're connected to data base!");
});

function createDefaultPlayer(username) {
  // Initiate startY at 300 for drop effect
  let equips = { mask: "none" }; // So far just have mask in equips
  let gold = 100; // starting at 0 is just sad
  return new PlayerInfo(username, 0, 0, "Female", gold, equips, 0, 0, "lobby");
}
app.use(express.static(__dirname));
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/myGame", express.static(__dirname + "/myGame.html"));
app.use("/login", express.static(__dirname + "/login.html"));

app.get("/", function(req, res) {
  // Have to send info here maybe? lol..
  res.sendFile(__dirname + "/login.html");
});

app.post("/loggedIn", (req, res) => {
  console.log("hihi");
  res.redirect("myGame");
});

app.post('/login', (req, res) => {
  User.findOne({username:req.body.username}).select('username password')

});

app.post("/register", (req, res) => {
  var user = new User();
  user.username = req.body.username;
  user.password = req.body.password;
  user.player = {...createDefaultPlayer(username)};
  if (
    req.body.username == null ||
    req.body.username == "" ||
    req.body.password == null ||
    req.body.password == ""
  ) {
    res.json({
      success: false,
      message: "Please enter your username and password"
    });
  } else {
    user.save(function(err) {
      if (err) {
        console.log(err);
        res.json({ success: false, message: "User name already exitst" });
      } else {
        res.json({ success: true, message: "User registered" });
      }
    });
  }
});

app.get("/game", function(req, res) {
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
    userInfo = { ...user };
    User.where({ username: user["username"] }).update({
      $set: { "player.socketId": socket.id }
    });

    

    // Checks if player exists and adds to allPlayers if so.
    User.findOne({ username: user["username"] }, (err, doc) => {
      console.log(doc.player.info);
      if (err) {
        console.log("User not in database");
      } else {
        let newPlayerInfo;
        // Create new player or load exiting player info from database
        if (doc.player.info == null) {
          newPlayerInfo = { ...createDefaultPlayer(userInfo.username) };
          console.log(newPlayerInfo);
          newPlayerInfo.socketId = socket.id;
          newPlayerInfo.databaseId = userInfo["_id"];
          doc.player = { ...newPlayerInfo };
          // Adding new player to array.
        } else {
          // Not really a new player, but will see it as it is anyways.
          newPlayerInfo = { ...doc.player };
        }
        newPlayer = new Player(newPlayerInfo);
        console.log(newPlayer);
        allPlayers[newPlayer.info.room].players.push(newPlayer);
      }
      console.log("save");
      doc.save();
    }).then(doc => {
      console.log(allPlayers);
      socket.emit("currentPlayers", allPlayers);

      //Just have to change step by step now
      socket.broadcast.emit("newPlayer", newPlayer);

      socket.on("disconnecting", function(data) {
        let room = newPlayer.info.room;
        let deleteInfo = {};
        for (let i = 0; i < allPlayers[room]["players"].length; i++) {
          if (socket.id == allPlayers[room]["players"][i].info.socketId) {
            deleteInfo = {
              socketId: socket.id,
              room: room,
              index: i
            };
          }
          io.emit("deletePlayer", deleteInfo);
          allPlayers[room]["players"].splice(deleteInfo.i, 1);
        }

        User.findOne({ username: userInfo["username"] }, async (err, doc) => {
          doc.player.socketId = "";
          await doc.save();
        }).then(data => {});
      });
      socket.on("playerMovement", function(movementData) {
        const room = movementData.playerOffset.room;
        const index = movementData.playerOffset.index;

        allPlayers[room]["players"][index].info.x = movementData.x;
        allPlayers[room]["players"][index].info.y = movementData.y;
        allPlayers[room]["players"][index].info.facing = movementData.facing;
        socket.broadcast.emit("playerMoved", movementData);
      });
    });
  });
});

server.listen(port, function() {
  console.log(`Listening on ${server.address().port}`);
});
