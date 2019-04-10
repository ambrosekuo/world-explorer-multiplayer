var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

var mongoose = require("mongoose").set("debug", true);
var db = mongoose.connection;
var bodyParser = require("body-parser");
var User = require("./user");

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
  "mongodb+srv://ambrosek:y5Wi4JbTI0LdPDTE@cluster0-emvsh.azure.mongodb.net/World-explorer?retryWrites=true";
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

app.get("/", function(req, res) {
  // Have to send info here maybe? lol..
  res.sendFile(__dirname + "/login.html");
});

app.use(express.static(__dirname));
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/myGame", express.static(__dirname + "/myGame.html"));
app.use("/login", express.static(__dirname + "/login.html"));

app.post("/loggedIn", (req, res) => {
  User.findOne({ username: req.body.username })
    .select("player username password")
    .exec(function(err, user) {
      if (user) {
        if (user.player.loggedIn) {
          res.json({ success: false, message: "Already Logged in" });
        } else {
          res.redirect("myGame");
        }
      }
    });
});

app.post("/logOut", (req, res) => {
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
  User.updateMany(
    { username: req.body.username },
    {
      $set: {
        "player.socketId": "",
        "player.loggedIn": "false"
      }
    }
  ).exec();
  // Disconnect socket emitter should handle the removal of allPlayers/update database.logi

  res.redirect("/login");
});

app.post("/login", (req, res) => {
  User.findOne({ username: req.body.username })
    .select("player username password")
    .exec(function(err, user) {
      console.log(req.body);
      if (err) throw err;
      if (!user) {
        res.json({ success: false, message: "Could not Authenticate User" });
      } else if (user) {
        if (req.body.password) {
          let validPassword = user.comparePassword(req.body.password);
          console.log(user.password + "  " + req.body.password);
          console.log(validPassword);
          if (!validPassword) {
            res.json({
              success: false,
              message: "Could not validate Password"
            });
          } else {
            if (user.player.loggedIn) {
              res.json({ success: false, message: "Already Logged in" });
            } else {
              let username = encodeURIComponent(req.body.username);
              res.redirect(`myGame/?user=${username}`);
            }
            //res.json({ success: true, message: 'User Authenticate', user: user});
          }
        } else {
          res.json({ success: false, message: "No password provided" });
        }
      }
    });
});

app.post("/register", (req, res) => {
  var user = new User();
  user.username = req.body.username;
  user.password = req.body.password;
  user.player = { ...createDefaultPlayer(req.body.username) };
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
        res.json({ success: false, message: "User name already exist" });
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
    User.where({ username: user["username"] })
      .updateMany({
        $set: { "player.socketId": socket.id, "player.loggedIn": "true" }
      })
      .then(data => {
        User.findOne({ username: user["username"] })
          .select("player username password")
          .exec(function(err, user) {
            newPlayer = new Player(user.player);
            allPlayers[newPlayer.info.room].players.push(newPlayer);
            console.log(allPlayers[newPlayer.info.room].players);
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

              User.updateMany(
                { username: userInfo["username"] },
                {
                  $set: {
                    "player.socketId": "",
                    "player.loggedIn": "false"
                  }
                }
              ).exec();
            });
            socket.on("playerMovement", function(player) {
              const room = player.info.room;
              for (let i = 0; i < allPlayers[room]["players"].length; i++) {
                if (
                  allPlayers[room]["players"][i].info.socketId ==
                  player.info.socketId
                ) {
                  allPlayers[room]["players"][i].info.x = player.info.x;
                  allPlayers[room]["players"][i].info.y = player.info.y;
                  allPlayers[room]["players"][i].info.facing =
                    player.info.facing;
                }
              }
              socket.broadcast.emit("playerMoved", player);
            });
          });
      });
  });
});

server.listen(port, function() {
  console.log(`Listening on ${server.address().port}`);
});
