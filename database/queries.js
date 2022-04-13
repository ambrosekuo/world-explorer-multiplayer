if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var encrypt = require("../services/encryptionService");

const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
});

async function createPostgresInstance() {
  const res = await pool.query("SELECT $1::text as message", ["Hello world!"]);
  console.log(res.rows[0].message); // Hello world!
  return pool;
}

console.log(process.env.POSTGRES_DATABASE);

function createEmptyUser(username, encryptedPassword, playerType) {
  return {
    password: encryptedPassword,
    socketId: -1,
    loggedIn: false,
    facing: "right",
    username: username,
    playerType: playerType,
    gold: 0,
    equips: JSON.stringify({}),
    parts: JSON.stringify({}),
    experience: 0,
    level: 1,
    room: " ",
    x: -1,
    y: -1,
  };
}

const fieldNames = [
  "password",
  "socketId",
  "loggedIn",
  "facing",
  "username",
  "playerType",
  "gold",
  "equips",
  "parts",
  "experience",
  "level",
  "room",
  "x",
  "y",
];

async function addUser(username, encryptedPassword, playerType = "female") {
  let user = createEmptyUser(username, encryptedPassword, playerType);
  const columns = fieldNames.reduce(
    (acc, fieldName, index) =>
      index != fieldNames.length - 1
        ? `${acc}${fieldName}, `
        : `${acc}${fieldName})`,
    "("
  );

  let valueArray = [];
  let insertList = "(";
  let count = 1;
  for (let property in user) {
    valueArray.push(user[property]);
    insertList += "$" + count + ",";
    count++;
  }
  insertList = insertList.slice(0, -1);
  insertList += ")";
  console.log(columns);
  console.log(insertList);
  await pool.query(
    `INSERT INTO public.users (password, socketId, loggedIn, facing, username, playerType, gold, equips, parts, experience, level, room, x, y) VALUES ${insertList};`,
    valueArray
  );
}

async function getUser(username, encryptedPassword) {
  let usersRows = await pool.query(
    "SELECT username, password, loggedIn, socketId, gold, facing, playerType, parts :: text, equips:: text, experience, level, room, x, y " +
      `FROM public.users WHERE username = $1`,
    [username]
  );
  if (
    usersRows?.rows?.length > 0 &&
    encrypt.validatePassword(encryptedPassword, usersRows.rows[0].password)
  ) {
    let player = { ...usersRows.rows[0] };
    delete player.password;
    return player;
  } else {
    return null;
  }
}

async function logInUser(username) {
  let finished = pool.query(
    `UPDATE users SET loggedIn = true WHERE username = $1;`,
    [username]
  );
}

async function createTable() {
  const createQuery =
    "CREATE TABLE Users(" +
    "id serial PRIMARY KEY," +
    " username varchar(100)," +
    " password varchar(100)," +
    " socketId int," +
    " loggedIn bool," +
    " gold int," +
    " facing varchar(40)," +
    " playerType varchar(100)," +
    " parts jsonb," +
    " equips jsonb," +
    " experience int," +
    " level int," +
    " room varchar(100)," +
    " x int," +
    " y int" +
    ");";
  await pool.query(createQuery);
}
// createTable();
module.exports = {
  addUser,
  getUser,
  logInUser,
};
