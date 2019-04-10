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

var allRooms = ["lobby", "multi-race"];

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
  },
  parent: "grid-container"
};

function logOut() {
  console.log(player.info.level);
  fetch("/logOut", {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: player.username,
      socketId: socket.id,
      room: player.info.room,
      experience: player.info.experience,
      level: player.info.level,
      gold: player.info.gold,
      mask: player.info.equips.mask,
      x: player.parts.container.x,
    })
  }).then(res => {
    window.localStorage.removeItem("user");
    window.location.replace(res.url);
  });
}

function changeEquip() {
  const cost = 10;
  if (player) {
    if (player.info.gold > cost) {
      const randomAnimalPng = animalArray[Math.floor(Math.random() * (animalArray.length - 1))];
      player.info.equips.mask = randomAnimalPng.substring(0, randomAnimalPng.indexOf('.'));
      player.info.gold -= cost;
      console.log(player.info.equips.mask);
      player.parts.mask.setTexture(player.info.equips.mask);
      player.parts.mask.visible = true;
      updateHtmlValues();
    }
  }
}

function enterRace() {
  const oldRoom = player.info.room;
  player.info.room = 'multi-race';
  otherPlayers = [];
  groupOfOtherPlayers  = [];
  socket.emit("changeRoom", {...player, oldRoom: oldRoom});
}

let makeNewMask = false;

function loadMainMap() {}

function loadMultiGame() {}

function loadPractice() {}

var game = new Phaser.Game(config);
console.log(game);
//game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
var platforms;
var player;
var playerOffset;
var oldPlayerPosition;
var background;
// Other players in same room
var otherPlayers = [];

var socket = io();

var groupOfOtherPlayers; //Otherplayers in same room, stores an array of containers as a group.

let touchInput = false;

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
  if (type == "lobby") {
    background = self.add.tileSprite(0, 0, 10000, 800, "grass");
    platforms
      .create(400, 300, "ground")
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
      player.parts.body.flipX = true;
      player.parts.container.body.setVelocityX(-160);
      player.parts.body.anims.play(`${player.info.playerType}-left`, true);
    }
  });

  left.on("pointerup", function(pointer, event) {
    left.setAlpha(1);
    player.parts.container.body.setVelocityX(0);
    player.parts.body.anims.play(`${(player.info, playerType)}-turn`);
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
      player.parts.body.flipX = false;
      player.parts.container.body.setVelocityX(160);
      player.parts.body.anims.play(`${player.info.playerType}-right`, true);
    }
  });

  right.on("pointerup", function(pointer, event) {
    right.setAlpha(1);
    player.parts.container.body.setVelocityX(0);
    player.parts.body.anims.play(`${player.info.playerType}-turn`);
  });

  jump = self.add
    .tileSprite((window.innerWidth * 5) / 10, 350, 190, 45, "jumpControlUp")
    .setScrollFactor(0)
    .setDepth(1)
    .setScale(1.5, 1.5);
  jump.setInteractive();
  jump.on("pointerdown", function(pointer, localX, localY, event) {
    jump.setAlpha(0.5);
    if (player != null && player.parts.container.body.touching.down) {
      touchInput = true;
      player.parts.container.body.setVelocityY(-330);
    }
  });
  jump.on("pointerup", function(pointer, event) {
    jump.setAlpha(1);
  });
}

//returns room and index in room
function findPlayerRoom(allPlayers) {
  for (let i = 0; i < allRooms.length; i++) {
    for (let j = 0; j < allPlayers[allRooms[i]]["players"].length; j++) {
      if (allPlayers[allRooms[i]]["players"][j].info.socketId == socket.id) {
        return allRooms[i];
      }
    }
  }
}

function createInterface() {
  var quantitybar = new uiWidgets.QuantityBar(
    game,
    { x: 50, y: 10 },
    { startValue: 50, maxValue: 100 },
    false,
    false,
    trackImage,
    barImage,
    { duration: 400, ease: Phaser.Easing.Quadratic.Out }
  );
}

const gameSizeX = 10000;
const gameSizeY = 1100;

function updateHtmlValues() {
  document.getElementById("level").innerHTML = player.info.level;
  document.getElementById("exp").innerHTML = player.info.experience;

  document.getElementById("gold").innerHTML = player.info.gold;
}

var selfself;

function create() {
  //loadHtmlValues();

  document.getElementById("username").innerHTML =
    "   " + JSON.parse(window.localStorage.getItem("user")).username;

  //createInterface();
  //this.cameras.main.setBounds(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  this.cameras.main.setBounds(0, 0, 4000, 400);

  this.cameras.main.setZoom(1);

  var self = this;
  selfself = this;

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

  socket.emit("sendUserInfo", JSON.parse(window.localStorage.getItem("user")));
  //Don't really have to update other values befindPlasides current room....

  socket.on("currentPlayers", allPlayers => {
    // Need to find room first to find player
    const playerRoom = findPlayerRoom(allPlayers);
    console.log(playerRoom);
    createLevel(self, playerRoom, platforms);

    for (let i = 0; i < allPlayers[playerRoom]["players"].length; i++) {
      if (allPlayers[playerRoom]["players"][i].info.socketId == socket.id) {
        addPlayer(self, allPlayers[playerRoom]["players"][i]);
        updateHtmlValues();
      } else {
        addOtherPlayer(self, allPlayers[playerRoom]["players"][i]);
      }
    }
  });

  socket.on("newPlayer", newPlayer => {
    console.log(newPlayer);
    addNewPlayer(self, newPlayer);
  });

  socket.on("deletePlayer", data => {
    console.log("bye");
    if (player.info.room == data.room) {
      for (let i = 0; i < otherPlayers.length; i++) {
        if (data.socketId == otherPlayers[i].info.socketId) {
          groupOfOtherPlayers.getChildren[i].destroy();
          otherPlayers.splice(index, 1);
          break;
        }
      }
    }
  });

  // Same concept as deletePlayer
  socket.on("playerMoved", otherPlayer => {
    if (player.info.room == otherPlayer.info.room) {
      for (let i = 0; i < otherPlayers.length; i++) {
        if (otherPlayer.info.socketId == otherPlayers[i].info.socketId) {
          //console.log(groupOfOtherPlayers.getChildren());
          otherPlayers[i].info.x = otherPlayer.info.x;
          otherPlayers[i].info.y = otherPlayer.info.y;
          otherPlayers[i].info.facing = otherPlayer.info.facing;
          groupOfOtherPlayers
            .getChildren()
            [i].setPosition(otherPlayers[i].info.x, otherPlayers[i].info.y);

          // This is a next level update hahahaha
          otherPlayers[i].parts.body.anims.play(
            `${otherPlayers[i].info.playerType}-${otherPlayers[i].info.facing}`
          );
        }
      }
    }
  });
}

let arbTime = 0; //arbitrary time
function update() {
  if (player) {
    if (arbTime % 100 == 0) {
      player.info.experience++;
      document.getElementById("exp").innerHTML = player.info.experience;
      if (player.info.experience == 100) {
        player.info.level++;
        document.getElementById("level").innerHTML = player.info.level;
        player.info.experience = 0;
        document.getElementById("exp").innerHTML = player.info.experience;
      }
    }
    arbTime++;
    // This physics only in multi-race.
    if (
      player.info.room == "multi-race" &&
      player.parts.container.y >= mapHeight - player.parts.container.height
    ) {
      player.info.x = 0;
      player.info.y = 0;
      player.parts.container.setPosition(0, 0);
    }
    if (cursors.left.isDown) {
      touchInput = false;
      player.parts.body.flipX = true;
      player.parts.container.body.setVelocityX(-160);
      player.info.facing = "left";
      player.parts.body.anims.play(`${player.info.playerType}-left`, true);
    } else if (cursors.right.isDown) {
      touchInput = false;
      player.parts.body.flipX = false;
      player.parts.container.body.setVelocityX(160);
      player.info.facing = "right";
      player.parts.body.anims.play(`${player.info.playerType}-right`, true);
    } else {
      if (!touchInput) {
        player.parts.container.body.setVelocityX(0);
        player.info.facing = "turn";
        player.parts.body.anims.play(`${player.info.playerType}-turn`);
        touchInput = false;
      }
    }
    if (cursors.space.isDown && player.parts.container.body.touching.down) {
      player.parts.container.body.setVelocityY(-330);
    }
    this.physics.add.collider(groupOfOtherPlayers, platforms);

    // Updating player.info to container.x
    player.info.x = player.parts.container.x;
    player.info.y = player.parts.container.y;

    if (oldPlayerPosition == null) {
      oldPlayerPosition = {
        x: player.info.x,
        y: player.info.y,
        facing: player.info.facing
      };
    }

    if (
      player.info.x !== oldPlayerPosition.x ||
      player.info.y !== oldPlayerPosition.y
    ) {
      socket.emit("playerMovement", player);
      oldPlayerPosition.x = player.info.x;
      oldPlayerPosition.y = player.info.y;
      oldPlayerPosition.facing = player.info.facing;
    }
    //  Position the center of the camera on the player
    //  We -400 because the camera width is 800px and
    //  we want the center of the camera on the player, not the left-hand side of it

    this.cameras.main.scrollX = player.parts.container.x - 400;
  }
}

function addNewPlayer(self, otherPlayer) {
  addOtherPlayer(self, otherPlayer);
}

function addOtherPlayer(self, thisplayer) {
  console.log(thisplayer.info.y);
  otherPlayer = { ...thisplayer };

  //otherPlayers.parts = {};
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
  if (otherPlayer.info.equips.mask != "none") {
    otherPlayer.parts.mask = self.add
      .sprite(
        otherPlayer.info.x,
        otherPlayer.info.y,
        otherPlayer.info.equips.mask
      )
      .setScale(0.2, 0.2);
    otherPlayer.parts.container.add(otherPlayer.parts.mask);
  }

  self.physics.world.enable(otherPlayer.parts.container);
  otherPlayer.parts.container.body.setBounce(0.2).setCollideWorldBounds(true);
  otherPlayers.push(otherPlayer);
  console.log(otherPlayers);
  console.log(player);
  groupOfOtherPlayers.add(otherPlayer.parts.container);
  console.log(groupOfOtherPlayers.getChildren());
  groupOfOtherPlayers.setDepth(1);
}

function addPlayer(self, thisPlayer, cameras) {
  player = { ...thisPlayer };
  console.log(player.info);

  player.parts.container = self.add.container(player.info.x, player.info.y);

  player.parts.body = self.add
    .sprite(player.info.x, player.info.y, player.info.playerType)
    .setScale(0.5, 0.5);

  player.parts.container.setSize(
    player.parts.body.width / 2,
    player.parts.body.width / 2
  );
  player.parts.body.setDepth(1);
  player.parts.container.add(player.parts.body);

  if (player.info.equips.mask == "none") {
    // Just default to invisible penguin
    player.parts.mask = self.add
      .sprite(player.info.x, player.info.y, "penguin")
      .setScale(0.2, 0.2);
    player.parts.mask.visible = false;
    player.parts.container.add(player.parts.mask);
  } else {
    // Just default to invisible penguin
    player.parts.mask = self.add
      .sprite(player.info.x, player.info.y, player.info.equips.mask)
      .setScale(0.2, 0.2);
    player.parts.mask.visible = true;
    player.parts.container.add(player.parts.mask);
  }

  self.physics.world.enable(player.parts.container);
  player.parts.container.body.setBounce(0.2).setCollideWorldBounds(true);
  self.physics.add.collider(player.parts.container, platforms);
}

function onConnect() {}
