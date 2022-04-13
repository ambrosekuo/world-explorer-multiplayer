var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");
mongoose.set("useCreateIndex", true);

var UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  player: {
    databaseId: String,
    socketId: String,
    loggedIn: Boolean,
    facing: String,
    username: String,
    playerType: String,
    gold: Number,
    equips: {
      mask: String,
    },
    experience: Number,
    level: Number,
    room: String,
    x: Number,
    y: Number,
  },
});

UserSchema.pre("save", function (next) {
  var user = this;
  // Function to encrypt password
  if (user.isNew) {
    bcrypt.hash(user.password, null, null, function (err, hash) {
      if (err) return next(err); // Exit if error is found
      user.password = hash; // Assign the hash to the user's password so it is saved in database encrypted
      next(); // Exit Bcrypt function
    });
  }
});
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
