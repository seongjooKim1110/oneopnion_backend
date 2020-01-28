const express = require("express");
const userRouter = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("../firebase.js");

userRouter.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

userRouter.route("/add").post((req, res) => {
  console.log(req.params);

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
      console.log("Error " + error);
      return {};
    });
});

userRouter.route("/login").post((req, res) => {
  const idToken = req.body.idToken;

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      console.log(uid);
      firebaseDB.findOneUser(uid).then(result => res.send(result));
    })
    .catch(function(error) {
      console.log("Error " + error);
      return {};
    });
});

module.exports = userRouter;
