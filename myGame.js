class Player {
  constructor(username, startX) {
    this.id = username;
    this.type = "dude";
    this.x = startX;
  }
}

var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
var platforms;
var player;

// Gets a platform group an adds more platforma
function createLevel(platforms) {
  platforms
  .create(400, 568, "ground")
  .setScale(2)
  .refreshBody();

  platforms
  .create(200, 500, "ground")
}

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("sky", "assets/sky.png");

  this.load.spritesheet("dude", "assets/Characters/PNG/Zombie/zombie_tilesheet.png", {
    frameWidth: 80,
    frameHeight: 110
  });
}

function create() {
  var self = this;
  this.otherPlayers = this.physics.add.group();

  this.add.image(400, 300, "sky");
  platforms = this.physics.add.staticGroup();
  createLevel(platforms);
  this.anims.create({
    key: "left",
    frames: [{ key: "dude", frame: 2},{ key: "dude", frame: 16}, { key: "dude", frame: 10}],
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 23 }],
    frameRate: 3
  });
  
  this.anims.create({
    key: "right",
    frames: [{ key: "dude", frame: 2},{ key: "dude", frame: 16}, { key: "dude", frame: 10}],
    frameRate: 10,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  this.socket = io();

  this.socket.on("currentPlayers", players => {
    players.forEach(player => {
      if (player.id === self.socket.id) {
        addPlayer(self, player);
      } else {
        addOtherPlayer(self, player);
      }
    });
  });

  this.socket.on("newPlayer", players => {
    console.log(players);
    addNewPlayer(self, players[players.length - 1]);
  });

  this.socket.on("deletePlayer", id => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (id === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on("playerMoved", player => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (player.id === otherPlayer.playerId) {
        otherPlayer.setPosition(player.x, player.y);
      }
    });
  });
}

function update() {
  if (player) {
    if (cursors.left.isDown) {
      player.flipX = true;
      player.setVelocityX(-160);
      player.anims.play("left", true);
    } else if (cursors.right.isDown) {
      player.flipX = false;
      player.setVelocityX(160);

      player.anims.play("right", true);
    } else {
      player.setVelocityX(0);

      player.anims.play("turn");
    }

    if (cursors.space.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
    this.physics.add.collider(this.otherPlayers, platforms);
    // emit player movement
    let x = player.x;
    let y = player.y
    if (player.oldPosition == null) {
        player.oldPosition = {x: player.x, y: player.y};
    }
    if (x !== player.oldPosition.x) {
      this.socket.emit("playerMovement", {
        x: player.x,
        y: player.y
      });
      player.oldPosition = {
        x: player.x,
        y: player.y
      };
    }
  }
}

function addNewPlayer(self, otherPlayer) {
  addOtherPlayer(self, otherPlayer);
}

function addOtherPlayer(self, playerInfo) {
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, playerInfo.type);
  otherPlayer.setBounce(0.2);
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.playerId = playerInfo.id;
  self.otherPlayers.add(otherPlayer);
}

function addPlayer(self, thisPlayer) {
  player = self.physics.add.sprite(thisPlayer.x, thisPlayer.y, thisPlayer.type);
  player.id = thisPlayer.id;
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  self.physics.add.collider(player, platforms);
}

function onConnect() {

}
