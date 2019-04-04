var express = require("express");
var app = express();
var port = 8080 || process.env.PORT;
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

class Player {
  constructor(username) {
    this.id = username;
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
  socket.broadcast.emit("newPlayer", players);
  userCount++;
  connections.push(socket);
  console.log("Connected: %s sockets connected", connections.length);
  players.push(new Player(socket.id));
  socket.emit("currentPlayers", players);

  socket.on("disconnect", function(data) {
    connections.splice(connections.indexOf(socket, 1));
    for (let i  = 0 ; i < players.length; i++) {
      if (socket.id == players[i].id) {
        players.splice(i,1);
      }
    }
    players.splice(connections.indexOf(socket, 1));
    console.log("Disconnected: %s sockets connected", connections.length);
    socket.disconnect();
  });
});  


server.listen(port, function() {
  console.log(`Listening on ${server.address().port}`);
});
