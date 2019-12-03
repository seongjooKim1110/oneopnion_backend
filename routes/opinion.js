const express = require("express");
const router = express.Router();

const admin = require("firebase-admin");
const firebaseDB = require("./firebase.js");

router.route("/create").post((req, res) => {
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

router.route("/all").get((req, res) => {
  firebaseDB.findAllOpinion(result => {
    let opinions = [];
    for (const opinion of result) {
      let temp = {
        oid: opinion.opinionID,
        title: opinion.data.title,
        desc: opinion.data.desc,
        endpoint: opinion.data.endpoint,
        like: opinion.data.like
      };
      opinions.push(temp);
    }
    res.send(opinions);
  });
});

module.exports = router;
