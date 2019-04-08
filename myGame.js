const animalArray = [
  "bear.png",
  "buffalo.png",
  "chick.png",
  "chicken.png",
  "cow.png",
  "crocodile.png",
  "dog.png",
  "duck.png",
  "elephant.png",
  "frog.png",
  "giraffe.png",
  "goat.png",
  "gorilla.png",
  "hippo.png",
  "horse.png",
  "monkey.png",
  "moose.png",
  "narwhal.png",
  "owl.png",
  "panda.png",
  "parrot.png",
  "penguin.png",
  "pig.png",
  "rabbit.png",
  "rhino.png",
  "sloth.png",
  "snake.png",
  "walrus.png",
  "whale.png",
  "zebra.png"
];

class Player {
  constructor(username, startX) {
    this.id = username;
    this.playerType = "female";
    this.x = startX;
  }
}

const mapHeight = 400;

var config = {
  type: Phaser.canvas,
  width: window.innerWidth,
  height: mapHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1100 },
      debug: false,
      width: 4000,
      height: mapHeight
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
console.log(game);
//game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
var platforms;
var player;
let touchInput = false;
// Gets a platform group an adds more platforma
const typeOfChars = ["Adventurer", "Female", "Player", "Soldier", "Zombie"];

function preload() {
  this.load.image(
    "desert",
    "assets/Background/Backgrounds/backgroundColorDesert.png"
  );
  this.load.image("ground", "assets/platform.png");
  this.load.image("sky", "assets/sky.png");
  this.load.image("house", "assets/Background/PNG/Retina/houseSmall1.png");

  this.load.image(
    "leftControlUp",
    "assets/Controls/Sprites/shadedDark/shadedDark24.png"
  );
  this.load.image(
    "jumpControlUp",
    "assets/Controls/PNG/buttonLong_blue_pressed.png"
  );
  this.load.image(
    "rightControlUp",
    "assets/Controls/Sprites/shadedDark/shadedDark25.png"
  );

  animalArray.forEach(animal => {
    this.load.image(
      animal.substring(0, animal.indexOf(".")),
      `assets/Animals/PNG/Square (outline)/${animal}`
    );
  });

  typeOfChars.forEach(type => {
    this.load.spritesheet(
      type,
      `assets/Characters/PNG/${type}/${type.toLowerCase()}_tilesheet.png`,
      {
        frameWidth: 80,
        frameHeight: 110
      }
    );
  });
}

function createBlocks(platforms) {
  let lastY = 300;
  for (let i = 1; i < 50; i++) {
    const addY = Math.floor(Math.random() * 30); // Vertical space between blocks
    platforms
      .create(i * 100, lastY - addY, "house")
      .setScale(0.3, 0.3)
      .refreshBody();
    lastY -= addY;
    if (lastY <= 150) {
      lastY = 350;
    }
  }
}

function createLevel(platforms) {
  platforms
    .create(400, 400, "ground")
    .setScale(100, 1)
    .refreshBody();

  platforms
    .create(20, 300, "house")
    .setScale(0.5)
    .refreshBody();
  createBlocks(platforms);

  console.log(
    platforms.getChildren()[1].width +
      "   " +
      platforms.getChildren()[1].height +
      "||| " +
      platforms.getChildren()[1].body.height +
      "   " +
      platforms.getChildren()[1].body.height
  );

  /*
  platforms
    .getChildren()[1]
    .setScale(0.333,0.5, true);

    platforms
    .getChildren()[1]
    .body
    .setSize(50,50).
      .refreshBody();

    */
}

function addControls(self) {
  let left, jump, right;

  left = self.add
    .tileSprite(window.innerWidth / 10, 350, 80, 80, "leftControlUp")
    .setScrollFactor(0)
    .setDepth(1);
  left.setInteractive();
  left.on("pointerdown", function(pointer, localX, localY, event) {
    if (player != null) {
      touchInput = true;
      player.flipX = true;
      container.body.setVelocityX(-160);
      player.anims.play(`${player.playerType}-left`, true);
    }
  });
  left.on("pointerup", function(pointer, event) {
    container.body.setVelocityX(0);
    player.anims.play(`${player.playerType}-turn`);
  });

  right = self.add
    .tileSprite((window.innerWidth * 9) / 10, 350, 80, 80, "rightControlUp")
    .setScrollFactor(0)
    .setDepth(1);
  right.setInteractive();
  right.on("pointerdown", function(pointer, localX, localY, event) {
    if (player != null) {
      touchInput = true;
      player.flipX = false;
      container.body.setVelocityX(160);
      player.anims.play(`${player.playerType}-right`, true);
    }
  });

  right.on("pointerup", function(pointer, event) {
    container.body.setVelocityX(0);
    player.anims.play(`${player.playerType}-turn`);
  });

  jump = self.add
    .tileSprite((window.innerWidth * 5) / 10, 350, 190, 45, "jumpControlUp")
    .setScrollFactor(0)
    .setDepth(1).setScale(1.5,1.5);
  jump.setInteractive();
  jump.on("pointerdown", function(pointer, localX, localY, event) {
    if (player != null && container.body.touching.down) {
      touchInput = true;
      container.body.setVelocityY(-330);
    }
  });
  jump.on("pointerup", function(pointer, event) {});
}

const gameSizeX = 10000;
const gameSizeY = 1100;

function create() {
  //this.cameras.main.setBounds(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  this.cameras.main.setBounds(0, 0, 4000, 400);

  this.cameras.main.setZoom(1);

  var background = this.add.tileSprite(0, 0, 10000, 800, "desert");

  var self = this;

  addControls(self);
  this.otherPlayers = this.physics.add.group();

  platforms = this.physics.add.staticGroup();
  //block = this.physics.add.staticImage(120, 300, 'house').setScale;
  createLevel(platforms);

  function charFactory(type) {
    this.anims.create({
      key: `${type}-left`,
      frames: [{ key: type, frame: 16 }, { key: type, frame: 17 }],
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: `${type}-turn`,
      frames: [{ key: type, frame: 23 }],
      frameRate: 3
    });

    this.anims.create({
      key: `${type}-right`,
      frames: [{ key: type, frame: 16 }, { key: type, frame: 17 }],
      frameRate: 15,
      repeat: -1
    });
  }

  typeOfChars.forEach(charFactory.bind(this));

  cursors = this.input.keyboard.createCursorKeys();

  this.socket = io();

  this.socket.on("currentPlayers", players => {
    players.forEach(player => {
      if (player.id === self.socket.id) {
        addPlayer(self, player, this.cameras);
      } else {
        addOtherPlayer(self, player);
        this.cameras.main.startFollow(player);
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
    if (container.y >= mapHeight - container.height) {
      container.setPosition(0, 0);
    }
    if (cursors.left.isDown) {
      touchInput = false;
      player.flipX = true;
      container.body.setVelocityX(-160);
      player.anims.play(`${player.playerType}-left`, true);
    } else if (cursors.right.isDown) {
      touchInput = false;
      player.flipX = false;
      container.body.setVelocityX(160);

      player.anims.play(`${player.playerType}-right`, true);
    } else {
      if (!touchInput) {
        container.body.setVelocityX(0);
        player.anims.play(`${player.playerType}-turn`);
        touchInput = false;
      }
    }

    if (cursors.space.isDown && container.body.touching.down) {
      container.body.setVelocityY(-330);
    }
    this.physics.add.collider(this.otherPlayers, platforms);
    // emit player movement
    let x = container.x;
    let y = container.y;
    if (container.oldPosition == null) {
      container.oldPosition = { x: container.x, y: container.y };
    }
    if (x !== container.oldPosition.x) {
      this.socket.emit("playerMovement", {
        x: container.x,
        y: container.y
      });
      container.oldPosition = {
        x: container.x,
        y: container.y
      };
    }
    //  Position the center of the camera on the player
    //  We -400 because the camera width is 800px and
    //  we want the center of the camera on the player, not the left-hand side of it

    this.cameras.main.scrollX = container.x - 400;
  }
}

function spawnRandomBlocks(platforms) {
  for (let i = 0; i < 50; i++) {}
}

function addNewPlayer(self, otherPlayer) {
  addOtherPlayer(self, otherPlayer);
}

function addOtherPlayer(self, playerInfo) {
  const otherPlayer = self.physics.add
    .sprite(playerInfo.x, playerInfo.y, playerInfo.playerType)
    .setScale(0.5, 0.5);
  otherPlayer.setBounce(0.2);
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.playerId = playerInfo.id;
  self.otherPlayers.add(otherPlayer);
}

var head;
var container;

function addPlayer(self, thisPlayer, cameras) {
  container = self.add.container(thisPlayer.x, thisPlayer.y);
  player = self.add
    .sprite(thisPlayer.x, thisPlayer.y, thisPlayer.playerType)
    .setScale(0.5, 0.5);
  console.log(player.width, player.height);
  container.setSize(player.width / 2, player.height / 2);
  container.add(player);
  const animal = self.add
    .sprite(thisPlayer.x, thisPlayer.y, "penguin")
    .setScale(0.2, 0.2);
  container.add(animal);

  player.id = thisPlayer.id;
  player.playerType = thisPlayer.playerType;

  self.physics.world.enable(container);
  container.body.setBounce(0.2).setCollideWorldBounds(true);
  self.physics.add.collider(container, platforms);
}

function onConnect() {}
