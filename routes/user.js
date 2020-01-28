const express = require("express");
const firebase = require("firebase");
const admin = require("firebase-admin");
const firebaseDB = require("../firebase.js");

const userRouter = express.Router();

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

userRouter.route("/userCheck").post((req, res) => {
  const idToken = req.body.idToken;

  admin
    .auth()
    .verifyIdToken(idToken)
    .catch(function(error) {
      console.log("Error1 " + error);
      return {};
    })
    .then(function(decodedToken) {
      console.log(decodedToken.aud);
      firebaseDB.findOneUser(decodedToken.uid).then(result => res.send(result));
    })
    .catch(function(error) {
      console.log("Error2 " + error);
      return {};
    });
});

userRouter.route("/googleLogin").post((req, res) => {
  const google_IdToken = req.body.idToken;
  console.log("google " + google_IdToken);
  const credential = firebase.auth.GoogleAuthProvider.credential(
    google_IdToken
  );
  firebase
    .auth()
    .signInWithCredential(credential)
    .catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.email;
      const credential = error.credential;
      console.log(errorMessage);
      return false;
    });
});
module.exports = userRouter;
