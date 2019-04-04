class Player {
  constructor(username, startX) {
    this.id = username;
    this.type = "dude";
    this.x = startX;
  }
}

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
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

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("sky", "assets/sky.png");
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });
}

function create() {
  var self = this;
  this.otherPlayers = this.physics.add.group();

  this.add.image(400, 300, "sky");
  platforms = this.physics.add.staticGroup();
  platforms
    .create(400, 568, "ground")
    .setScale(2)
    .refreshBody();

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
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
        console.log(otherPlayer.y);
        otherPlayer.setPosition(player.x, otherPlayer.y);
      }
    });
  });
}

function update() {
  if (player) {
    if (cursors.left.isDown) {
      player.setVelocityX(-160);

      player.anims.play("left", true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);

      player.anims.play("right", true);
    } else {
      player.setVelocityX(0);

      player.anims.play("turn");
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
    this.physics.add.collider(this.otherPlayers, platforms);
    // emit player movement
    let x = player.x;
    if (player.oldPosition == null) {
        player.oldPosition = {x: player.x};
    }
    if (x !== player.oldPosition.x) {
      this.socket.emit("playerMovement", {
        x: player.x
      });
      player.oldPosition = {
        x: player.x
      };
    }
  }
}

function addNewPlayer(self, otherPlayer) {
  addOtherPlayer(self, otherPlayer);
}

function addOtherPlayer(self, playerInfo) {
  const otherPlayer = self.physics.add.sprite(playerInfo.x, 450, "dude");
  otherPlayer.setBounce(0.2);
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.playerId = playerInfo.id;
  self.otherPlayers.add(otherPlayer);
}

function addPlayer(self, thisPlayer) {
  player = self.physics.add.sprite(thisPlayer.x, 450, "dude");
  player.id = thisPlayer.id;
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  self.physics.add.collider(player, platforms);
}

function onConnect() {
  player = this.physics.add.sprite(300, 450, "dude");
}
