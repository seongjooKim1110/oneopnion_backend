const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(express.static("public"));
app.use(bodyParser.json()); //json형태
app.use(bodyParser.urlencoded({ extended: true }));
//app.set('view engine', 'ejs')

const port = process.env.PORT || 5000;
const router = express.Router();

//firebase
var firebase = require("firebase/app");

const firebaseDB = require("./firebase.js");
// firebaseDB.addUser(data);

router.route("/addUser").post((req, res) => {
  console.log(req.body);

  const userEmail = req.user.email;
  const userFields = req.user.data;
  firebaseDB.addUser(userEmail, userFields);
});

router.route("/login").post((req, res) => {
  const userEmail = req.user.email;
  firebaseDB.findOneUser(userEmail).then(result => {
    res.send(result);
  });
});

router.route("/").get((req, res) => {
  res.render("public/index");
});

app.use("/", router);

app.listen(port, err => {
  if (err) console.log(err);
  else console.log("서버가 등록되었습니다. ");
});
