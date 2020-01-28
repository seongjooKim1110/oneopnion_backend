const express = require("express");
const firebaseDB = require("../firebase.js");

const userRouter = express.Router();

userRouter.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

userRouter.route("/add").post((req, res) => {
  const data = req.body;
  firebaseDB.addUser(data.email, data.filed);
});

userRouter.route("/userCheck").post((req, res) => {
  console.log(req.body, req.params);
  const { email } = req.body.user;
  console.log(email);
  firebaseDB.findOneUser(email).then(result => res.send(result));
});

module.exports = userRouter;
