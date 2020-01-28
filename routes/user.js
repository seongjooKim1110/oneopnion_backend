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
  const { email } = req.body.user;
  firebaseDB.findOneUser(email).then(result => {
    console.log(result);
    res.send(result);
  });
});

let email = "twtz0309@naver.com";
firebaseDB.findOneUser(email).then(result => console.log(result));

module.exports = userRouter;
