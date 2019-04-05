var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

class Player {
  constructor(username, startX) {
    this.id = username;
    this.type = "dude";
    this.x = startX;
    this.y = 450;
  }
}

players = [];
userCount = 0;
connections = [];

app.use("/assets", express.static(__dirname + "/assets"));
app.use("/myGameJs", express.static(__dirname + "/myGame.js"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/myGame.html");
});

io.on("connection", function(socket) {
  connections.push(socket);
  console.log("Connected: %s sockets connected", connections.length);
  players.push(new Player(socket.id, Math.floor(Math.random() * 400) + 200));
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
