var bcrypt = require("bcrypt");

async function generateHashedPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  return hashedPassword;
}

function validatePassword(password, encryptedStoredPassword) {
  return bcrypt.compareSync(password, encryptedStoredPassword);
}

module.exports = {
  generateHashedPassword,
  validatePassword,
};
