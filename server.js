const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(express.static("public"));
app.use(bodyParser.json()); //json형태
app.use(bodyParser.urlencoded({ extended: true }));
//app.set('view engine', 'ejs')

const port = process.env.PORT || 5000;
const router = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("./firebase.js");

router.route("/addUser").post((req, res) => {
  console.log(req.body);

  const userEmail = req.body.user.email;
  const userName = req.body.user.name;
  const userFields = req.body.data;

  firebaseDB.addUser({ userEmail, userName }, userFields);
});

router.route("/login").post((req, res) => {
  const idToken = req.body.idToken;

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      firebaseDB.findOneUser(uid).then(result => res.send(result));
    })
    .catch(function(error) {
      console.log(error);
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
