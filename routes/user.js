const express = require("express");
const router = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("../firebase.js");

router.route("/add").post((req, res) => {
  console.log(req.body);

  const idToken = req.body.idToken;
  const userFields = req.body.data;
  console.log(req.body.idToken);
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

module.exports = router;
