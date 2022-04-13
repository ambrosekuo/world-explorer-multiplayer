var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

// var mongoose = require("mongoose").set("debug", true);
// var db = mongoose.connection;
var bodyParser = require("body-parser");
var User = require("./user");
var db = require("./database/queries");
var encrypt = require("./services/encryptionService");

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
      body: {},
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
    mapInfo: {},
  },
  // Can nest multi-race to another depth if wanting to add levels
  "multi-race": {
    players: [],
    mapInfo: {},
  },
  "single-mode": {
    players: [],
    mapInfo: {},
  },
};

// const connectionString =
//   "mongodb+srv://ambrosek:y5Wi4JbTI0LdPDTE@cluster0-emvsh.azure.mongodb.net/World-explorer?retryWrites=true";
connections = [];

app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
// mongoose.connect(connectionString, { useNewUrlParser: true }); // connect to mongodb database
// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", function() {
//   console.log(" we're connected to data base!");
// });

function createDefaultPlayer(username) {
  // Initiate startY at 300 for drop effect
  let equips = { mask: "none" }; // So far just have mask in equips
  let gold = 100; // starting at 0 is just sad
  return new PlayerInfo(username, 0, 0, "Female", gold, equips, 0, 0, "lobby");
}

app.get("/", function (req, res) {
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
    .exec(function (err, user) {
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
  let room = req.body.room;
  let deleteInfo = {};
  let playerLeaving;
  for (let i = 0; i < allPlayers[room]["players"].length; i++) {
    if (req.body.socketId == allPlayers[room]["players"][i].info.socketId) {
      playerLeaving = { ...allPlayers[room]["players"][i] };
      console.log({ ...allPlayers[room]["players"][i].info });
      deleteInfo = {
        socketId: req.body.id,
        room: room,
        index: i,
      };
    }
    allPlayers[room]["players"].splice(deleteInfo.i, 1);
  }
  console.log(req.body);
  User.updateMany(
    { username: req.body.username },
    {
      $set: {
        "player.socketId": "",
        "player.loggedIn": "false",
        "player.gold": req.body.gold,
        "player.experience": req.body.experience,
        "player.level": req.body.level,
        "player.equips.mask": req.body.mask,
        "player.x": req.body.x,
      },
    }
  ).exec((err, data) => {
    res.redirect("/login");
  });
  // Disconnect socket emitter should handle the removal of allPlayers/update database.logi
});

app.post("/login", async (req, res) => {
  if (
    req.body.username == null ||
    req.body.username == "" ||
    req.body.password == null ||
    req.body.password == ""
  ) {
    res.json({
      success: false,
      message: "Please enter your username and password",
    });
  } else {
    let user = await db.getUser(req.body.username, req.body.password);
    if (user) {
      if (user.loggedIn) {
        res.json({ success: false, message: "Already Logged in" });
      } else {
        let username = encodeURIComponent(req.body.username);
        db.logInUser(req.body.username);
        res.redirect(`myGame/?user=${username}`);
      }
    } else {
      res.json({
        success: false,
        message: "Username does not exist or password is unsuccessful",
      });
    }
  }
});

app.post("/register", async (req, res) => {
  if (
    req.body.username == null ||
    req.body.username == "" ||
    req.body.password == null ||
    req.body.password == ""
  ) {
    res.json({
      success: false,
      message: "Please enter your username and password",
    });
  } else {
    const username = req.body.username;
    console.log(username);
    const password = await encrypt.generateHashedPassword(req.body.password);
    console.log(password);
    await db.addUser(username, password);
    res.json({
      success: true,
      message: "Sucessfully registered",
    });
  }
});

app.get("/game", function (req, res) {
  // Have to send info here maybe? lol..
  res.sendFile(__dirname + "/myGame.html");
});

// Lazy way of updating, deleting whole thing and adding info all over again.
function updateDatabase(player) {
  User.findOne({ username: player.username })
    .select("player username password")
    .exec(function (err, user) {
      user.player.room = player.info.room;
    });
}

function updateAllPlayers(player) {
  for (let i = 0; i < allPlayers[player.info.room]["players"].length; i++) {
    if (
      allPlayers[player.info.room]["players"][i].username == player.username
    ) {
      allPlayers[player.info.room]["players"][i].info == { ...player.info };
    }
    break;
  }
}

// Reminder
// Have session info and can access database via User schema
io.on("connection", function (socket) {
  connections.push(socket);

  //******** */
  // Maybe add in connected/logged in as a server message
  // Implement chatbox, I swear you can make it in like 1hour, but leave it later
  console.log("Connected: %s sockets connected", connections.length);

  let userInfo;
  let newPlayer;

  socket.on("changeRoom", (playerWithOldRoom) => {
    console.log(
      playerWithOldRoom.oldRoom + "   " + playerWithOldRoom.info.room
    );
    //delete playerWithOldRoom.oldRoom;
    updateDatabase(playerWithOldRoom);
    updateAllPlayers(playerWithOldRoom);
    socket.broadcast.emit("deletePlayer", {
      socketId: playerWithOldRoom.socketId,
      room: playerWithOldRoom.oldRoom,
    });
    socket.emit("currentPlayers", allPlayers);
  });

  // logs in user if logged in else returns false
  async function checkLogIn(user) {
    User.findOne({ username: user["username"] }).exec((err, user) => {
      if (!user.player.loggedIn) {
        return new Promise((res, rej) => {
          User.where({ username: user["username"] })
            .updateMany({
              $set: { "player.socketId": socket.id, "player.loggedIn": "true" },
            })
            .then(() => {
              return true;
            });
        });
      } else {
        return new Promise((res, rej) => {
          resolve(false);
        });
      }
    });
  }

  // Gets user info from game's localstorage being emitted in myGame.js
  //   then updates the database's user with socket.id to connect the html page to info
  socket.on("sendUserInfo", async function (user) {
    userInfo = { ...user };

    const loggedIn = true;
    console.log("logged in");

    if (loggedIn) {
      //Sends all the current players plus itself to the initialized socket
      socket.emit("currentPlayers", allPlayers);
      User.findOne({ username: user["username"] })
        .select("player username password")
        .exec(function (err, user) {
          newPlayer = new Player(user.player);
          allPlayers[newPlayer.info.room].players.push(newPlayer);
          console.log(allPlayers[newPlayer.info.room].players);

          //Sends all the current players plus itself to the initialized socket
          socket.emit("currentPlayers", allPlayers);

          //Just have to change step by step now
          socket.broadcast.emit("newPlayer", newPlayer);

          let playerLeaving;
          socket.on("disconnecting", function (data) {
            let room = newPlayer.info.room;
            let deleteInfo = {};
            for (let i = 0; i < allPlayers[room]["players"].length; i++) {
              if (socket.id == allPlayers[room]["players"][i].info.socketId) {
                //playerLeaving = allPlayers[room]["players"][i];
                console.log(playerLeaving);
                deleteInfo = {
                  socketId: socket.id,
                  room: room,
                  index: i,
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
                  "player.loggedIn": "false",
                },
              }
            ).exec();
          });
          socket.on("playerMovement", function (player) {
            const room = player.info.room;
            for (let i = 0; i < allPlayers[room]["players"].length; i++) {
              if (
                allPlayers[room]["players"][i].info.socketId ==
                player.info.socketId
              ) {
                allPlayers[room]["players"][i].info.x = player.info.x;
                allPlayers[room]["players"][i].info.y = player.info.y;
                allPlayers[room]["players"][i].info.facing = player.info.facing;
              }
            }
            socket.broadcast.emit("playerMoved", player);
          });
        });
    }
  });
});

server.listen(port, function () {
  console.log(`Listening on ${server.address().port}`);
});
