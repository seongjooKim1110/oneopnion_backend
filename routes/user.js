const express = require("express");
const firebaseDB = require("../firebase.js");

const userRouter = express.Router();

userRouter.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

userRouter.route("/add").post((req, res) => {
  const user = req.body.user;
  firebaseDB.addUser(user.email);
});

userRouter.route("/userCheck").post((req, res) => {
  const user = req.body.user;
  firebaseDB.findOneUser(user.email).then(result => res.send(result));
});

module.exports = userRouter;
