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

  const idToken = req.body.token;
  const userFields = req.body.data;

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      firebaseDB.addUser(uid, userFields);
    })
    .catch(function(error) {
      console.log(error);
    });
});

router.route("/login").post((req, res) => {
  const idToken = req.body;

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

router.route("/").get((req, res) => {});

app.use("/", router);

app.listen(port, err => {
  if (err) console.log(err);
  else console.log("서버가 등록되었습니다. ");
});
