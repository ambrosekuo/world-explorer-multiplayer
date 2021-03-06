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
  constructor(playerInfo) {
    this.username = playerInfo.username;
    this.info = { ...playerInfo };
    this.parts = {
      container: "",
      mask: "",
      body: ""
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

function loadMainMap() {}

function loadMultiGame() {}

function loadPractice() {}

var game = new Phaser.Game(config);
console.log(game);
//game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
var platforms;
var player;
var playerOffset;
var background;
// Other players in same room
var otherPlayers = [];

var groupOfOtherPlayers; //Otherplayers in same room, stores an array of containers as a group.

let touchInput = false;

function loadInfo(otherPlayer) {
  // Adds to corresponding rooms
  const { players } = otherPlayers[otherPlayers.room];
  if (!players.hasOwnProperty(otherPlayer.id)) {
    //Check if id is part of room
    players[otherPlayer.id] = {};
  }
  let info = { ...otherPlayer };
  let parts = { container: "", mask: "", body: "" }; // Empty since has not been created in game
  players[otherPlayer.id].info = info;
  players[otherPlayer.id].parts = parts;
}

// Gets a platform group an adds more platforma
const typeOfChars = ["Adventurer", "Female", "Player", "Soldier", "Zombie"];

function preload() {
  this.load.image(
    "desert",
    "assets/Background/Backgrounds/backgroundColorDesert.png"
  );
  this.load.image(
    "grass",
    "assets/Background/Backgrounds/backgroundColorGrass.png"
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

function createLevel(self, type, platforms) {
  if (tpe == "lobby") {
    background = self.add.tileSprite(0, 0, 10000, 800, "grass");
    platforms
      .create(400, 400, "ground")
      .setScale(100, 1)
      .refreshBody();
  } else if (type == "multi-race") {
    background = self.add.tileSprite(0, 0, 10000, 800, "desert");
    platforms
      .create(400, 400, "ground")
      .setScale(100, 1)
      .refreshBody();
    platforms
      .create(20, 300, "house")
      .setScale(0.5)
      .refreshBody();
    createBlocks(platforms);
  }
}

function addControls(self) {
  let left, jump, right;

  left = self.add
    .tileSprite(window.innerWidth / 10, 350, 80, 80, "leftControlUp")
    .setScrollFactor(0)
    .setDepth(1);
  left.setInteractive();
  left.on("pointerdown", function(pointer, localX, localY, event) {
    left.setAlpha(0.5);
    if (player != null) {
      touchInput = true;
      player.flipX = true;
      container.body.setVelocityX(-160);
      player.anims.play(`${player.playerType}-left`, true);
    }
  });

  left.on("pointerup", function(pointer, event) {
    left.setAlpha(1);
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
      right.setAlpha(0.5);
      touchInput = true;
      player.flipX = false;
      container.body.setVelocityX(160);
      player.anims.play(`${player.playerType}-right`, true);
    }
  });

  right.on("pointerup", function(pointer, event) {
    right.setAlpha(1);
    container.body.setVelocityX(0);
    player.anims.play(`${player.playerType}-turn`);
  });

  jump = self.add
    .tileSprite((window.innerWidth * 5) / 10, 350, 190, 45, "jumpControlUp")
    .setScrollFactor(0)
    .setDepth(1)
    .setScale(1.5, 1.5);
  jump.setInteractive();
  jump.on("pointerdown", function(pointer, localX, localY, event) {
    jump.setAlpha(0.5);
    if (player != null && container.body.touching.down) {
      touchInput = true;
      container.body.setVelocityY(-330);
    }
  });
  jump.on("pointerup", function(pointer, event) {
    jump.setAlpha(1);
  });
}

//returns room and index in room
function findPlayer(self, allPlayers) {
  allPlayers["lobby"]["players"].forEach((player, index) => {
    if (player.info.socketId === self.socket.id) {
      return { room: player.info.room, index: index };
    }
  });
  allPlayers["multi-race"]["players"].forEach((player, index) => {
    if (player.info.socketId === self.socket.id) {
      return { room: player.info.room, index: index };
    }
  });
}

const gameSizeX = 10000;
const gameSizeY = 1100;

function create() {
  //this.cameras.main.setBounds(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  this.cameras.main.setBounds(0, 0, 4000, 400);

  this.cameras.main.setZoom(1);

  var self = this;

  this.input.addPointer(1);

  addControls(self);
  groupOfOtherPlayers = this.physics.add.group();
  platforms = this.physics.add.staticGroup();

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

  this.socket.emit("senderUserInfo", {
    user: JSON.stringify(window.localStorage.getItem("user"))
  });
  //Don't really have to update other values besides current room....

  this.socket.on("currentPlayers", allPlayers => {
    playerOffset = { ...findPlayer(self, allPlayers) };

    allPlayers[playerOffset.room]["players"].forEach(player => {
      if (player.info.socketId === self.socket.id) {
        createLevel(self, player.Offsert.room, platforms);
        addPlayer(self, player);
        this.cameras.main.startFollow(player.parts.container);
      } else {
        addOtherPlayer(self, player);
      }
    });
  });

  this.socket.on("newPlayer", newPlayer => {
    addNewPlayer(self, newPlayer);
  });

  this.socket.on("deletePlayer", data => {
    if (playerOffset.room === data.room) {
      const removingIndex;
      
      // Adjust data.index by offset since otherPlayers array does not include player itself
      /* E.g. 
      1, 2, 3 in allPlayers
      1, 3 in otherPlayers,
      want to remove 3 in allPlayers, so index 2, have to -1 since we took player 2 out
      and playerOffset = index 1 <index 2. Now at just 1, playerOffset does not change
      */
     // Indexes never be equal since socket is gone/page is closed
      if (playerOffset.index < data.index) {
        removingIndex = data.index-1;
      }
      // Have to decremenet offset since missing index now
      else if (playerOffset > data.index) {
        removingIndex = data.index;
        playerOffset.index--;
      }
      otherPlayers.splice(removingIndex, 1);
      groupOfOtherPlayers.getChildren()[removingIndex].destory();
    }
  });

  this.socket.on("playerMoved", player => {
    if (playerOffset.room === data.room) {
      updateInfo(otherPlayer);
    }
    
    otherPlayers.getChildren().forEach(otherPlayer => {
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
    this.physics.add.collider(otherPlayers, platforms);
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

function addNewPlayer(self, otherPlayer) {
  addOtherPlayer(self, otherPlayer);
}

function addOtherPlayer(self, player) {
  otherPlayer = { ...player };

  otherPlayer.parts.container = self.add.container(
    otherPlayer.info.x,
    otherPlayer.info.y
  );

  otherPlayer.parts.body = self.add
    .sprite(otherPlayer.info.x, otherPlayer.info.y, otherPlayer.info.playerType)
    .setScale(0.5, 0.5);
  otherPlayer.parts.container.setSize(
    otherPlayer.parts.body.width / 2,
    otherPlayer.parts.body.width / 2
  );
  otherPlayer.parts.container.add(otherPlayer.parts.body);
  otherPlayer.parts.mask = self.add
    .sprite(
      otherPlayer.info.x,
      otherPlayer.info.y,
      otherPlayer.info.equips.mask
    )
    .setScale(0.2, 0.2);
  otherPlayer.parts.container.add(otherPlayer.parts.mask);

  self.physics.world.enable(otherPlayer.parts.container);
  otherPlayer.parts.container.body.setBounce(0.2).setCollideWorldBounds(true);
  groupOfOtherPlayers.add(otherPlayer.parts.container);
}

function addPlayer(self, thisPlayer, cameras) {
  player = { ...thisPlayer };

  player.parts.container = self.add.container(player.info.x, player.info.y);

  player.parts.body = self.add
    .sprite(player.info.x, player.info.y, player.info.playerType)
    .setScale(0.5, 0.5);
  player.parts.container.setSize(
    player.parts.body.width / 2,
    player.parts.body.width / 2
  );
  player.parts.container.add(player.parts.body);
  player.parts.mask = self.add
    .sprite(player.info.x, player.info.y, player.info.equips.mask)
    .setScale(0.2, 0.2);
  player.parts.container.add(player.parts.mask);

  self.physics.world.enable(player.parts.container);
  player.parts.container.body.setBounce(0.2).setCollideWorldBounds(true);
  self.physics.add.collider(player.parts.container, platforms);
}

function onConnect() {}
