const express = require("express");
const router = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("../firebase.js");

router.route("/add").post((req, res) => {
  console.log(req.body);

  const idToken = JSON.stringify(req.body.idToken);
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
      return [];
    });
});

router.route("/login").post((req, res) => {
  const idToken = JSON.stringify(req.body.idToken);

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      firebaseDB.findOneUser(uid).then(result => res.send(result));
    })
    .catch(function(error) {
      console.log(error);
      return [];
    });
});

module.exports = router;
