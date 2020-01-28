const express = require("express");
const opinionRouter = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("../firebase.js");

opinionRouter.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

opinionRouter.route("/create").post((req, res) => {
  const idtoken = req.body.token;
  const data = req.body.data;
  admin
    .auth()
    .verifyIdToken(idtoken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      firebaseDB.createOpinion(uid, data);
    });
});

opinionRouter.route("/all").get((req, res) => {
  firebaseDB.findAllOpinion(result => {
    let opinions = [];
    for (const opinion of result) {
      const tempOpinion = {
        oid: opinion.opinionID,
        title: opinion.data.title,
        desc: opinion.data.desc,
        endpoint: opinion.data.endpoint,
        like: opinion.data.like
      };
      opinions.push(tempOpinion);
    }
    return res.send(opinions);
  });
});

module.exports = opinionRouter;
