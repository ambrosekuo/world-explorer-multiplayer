// class User{
//     username: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     player: {
//       databaseId: String,
//       socketId: String,
//       loggedIn: Boolean,
//       facing: String,
//       username: String,
//       playerType: String,
//       gold: Number,
//       equips: {
//         mask: String
//       },
//       parts: {
//   container:String,
//   mask:String,
//   body: String,
//       },
//       experience: Number,
//       level: Number,
//       room: String,
//       x: Number,
//       y: Number
//     }
// }

// Player is a subset of a User barring the unecessary info like password < will be neater when I do inheritance...
class Player {
  constructor(playerInfo) {
    this.username = playerInfo.username;
    this.parts = {
      container: {},
      mask: {},
      body: {},
    };
    this.socketId = "";
    this.loggedIn = false;
    this.facing = "right";
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
