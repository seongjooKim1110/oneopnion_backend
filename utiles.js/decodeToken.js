const admin = require("firebase-admin");

const decodeToken = idtoken => {
  return new Promise(function(resolve, reject) {
    admin
      .auth()
      .verifyIdToken(idtoken)
      .then(decodedToken => resolve(decodedToken))
      .catch(error => reject(error));
  });
};
module.exports = decodeToken;
