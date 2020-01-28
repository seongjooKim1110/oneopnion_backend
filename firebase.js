require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = {
  type: process.env.firebase_type,
  project_id: process.env.firebase_project_id,
  private_key_id: process.env.firebase_private_key_id,
  private_key: process.env.firebase_private_key.replace(/\\n/g, "\n"),
  client_email: process.env.firebase_client_email,
  client_id: process.env.firebase_client_id,
  auth_uri: process.env.firebase_auth_uri,
  token_uri: process.env.firebase_token_uri,
  auth_provider_x509_cert_url: process.env.firebase_auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.firebase_client_x509_cert_url
};

// firebase 설정
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.databaseURL
});

const db = admin.firestore();
const users = db.collection("users");
const opinions = db.collection("opinions");

function deleteCollection(db, collectionPath, batchSize) {
  let collectionRef = db.collection(collectionPath);
  let query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  query
    .get()
    .then(snapshot => {
      // 문서가 남아 있지 않으면 끝납니다.
      if (snapshot.size == 0) {
        return 0;
      }

      // 일괄적으로 문서를 삭제합니다.
      let batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then(numDeleted => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
      });
    })
    .catch(reject);
}

const firebaseDB = {
  // 사용자 추가
  addUser: async function(email, fields) {
    try {
      const user = users.doc(email);
      if (!(await user.get().exists)) {
        user.set({
          sex: fields.sex,
          birth: fields.birth,
          created: admin.firestore.Timestamp.fromDate(new Date()),
          upload: [],
          participated: [],
          liked: [],
          point: 0,
          email: email,
          job: fields.job
        });
      } else {
        return {};
      }
    } catch (err) {
      return console.log("Error adding user", err);
    }
  },
  // 사용자 삭제
  deleteUser: async function(email) {
    try {
      const user = users.doc(email);
      await user.delete();
    } catch (err) {
      return console.log("Error getting users", err);
    }
  },
  // 사용자 찾기
  findOneUser: async function(email) {
    await users
      .doc(email)
      .get()
      .then(user => {
        if (!user.exists) {
          console.log("No such user!");
          return {};
        } else {
          //console.log("Document data:", doc.data());
          return user.data();
        }
      })
      .catch(err => {
        return console.log("Error getting user", err);
      });
  },

  // opinion 찾기
  findOneOpinion: async function(opinionID) {
    try {
      const opinion = await opinions.doc(opinionID).get();
      if (!opinion.exists) {
        console.log("No such document!");
        return {};
      } else {
        //console.log("Document data:", opinion.data());
        return opinion.data();
      }
    } catch (err) {
      return console.log("Error getting opinion", err);
    }
  },
  // 전체 사용자 찾기
  findAllUser: async function() {
    try {
      const snapshot = await users.get();
      let data = [];
      snapshot.forEach(doc => {
        //console.log(doc.id, "=>", doc.data());
        data.push(doc.data());
      });
      return data;
    } catch (err) {
      return console.log("Error getting users", err);
    }
  },
  // 전체 opinion 찾기
  findAllOpinion: async function() {
    try {
      const snapshot = await opinions.orderBy("opinionTime", "desc").get();
      let data = [];
      snapshot.forEach(doc => {
        //console.log(doc.id, "=>", doc.data());
        data.push(doc.data());
      });
      return data;
    } catch (err) {
      return console.log("Error getting opinions", err);
    }
  },
  // opinion 생성 및 사용자 upload에 추가
  createOpinion: async function(email, data) {
    try {
      const opinion = opinions.doc();
      await opinion.set({
        opinionID: opinion.id,
        data: data,
        opinionTime: admin.firestore.Timestamp.fromDate(new Date()),
        email: email
      });
      const user = user.doc(email);
      await user.update({
        upload: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
    } catch (err) {
      return console.log("Error creating opinion", err);
    }
  },
  // opinion 삭제
  dropOpinion: async function(email, opinionID) {
    try {
      const user = users.doc(email);
      const userInformation = await user.get();

      const upload = await userInformation.data().upload;
      upload.pop(opinionID);
      await user.update({ upload: upload });

      await deleteCollection(
        db,
        "opinions/" + opinionID + "/opinionResult",
        10
      );
      await deleteCollection(
        db,
        "opinions/" + opinionID + "/opinionComment",
        10
      );

      await opinions.doc(opinionID).delete();
    } catch (err) {
      return console.log("Error creating opinion", err);
    }
  },
  // opinion like 표시
  likeOpinion: async function(email, opinionID) {
    try {
      const user = users.doc(email);
      const opinion = opinions.doc(opinionID);
      await user.update({
        liked: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
      await opinion.update({
        "data.like": admin.firestore.FieldValue.arrayUnion(user.id)
      });
    } catch (err) {
      return console.log("Error liking opinion", err);
    }
  },
  // opinion like 삭제
  deleteLike: async function(email, opinionID) {
    try {
      const user = users.doc(email);
      const opinion = opinions.doc(opinionID);

      const userInformation = await user.get();
      const liked = await userInformation.data().liked.pop(opinion.id);
      await user.update({ liked: liked });

      const opinionInformation = await opinion.get();
      const like = await opinionInformation.data().data.like.pop(user.id);
      await opinion.update({ "data.like": like });
    } catch (err) {
      return console.log("Error deleting like", err);
    }
  },
  // user의 opinion 결과 제출
  makeResult: async function(email, opinionID, result) {
    try {
      const opinion = opinions
        .doc(opinionID)
        .collection("opinionResult")
        .doc(email);
      await opinion.set({
        email: email,
        result: result
      });
      const user = users.doc(email);
      await user.update({
        participated: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
    } catch (err) {
      console.log("Error making result", err);
    }
  },
  // user의 opinion 결과 삭제
  deleteResult: async function(email, opinionID) {
    try {
      const user = users.doc(email);
      const opinion = opinions
        .doc(opinionID)
        .collection("opinionResult")
        .doc(email);
      await opinion.delete();

      const userInformation = await user.get();
      const participated = await userInformation
        .data()
        .participated.pop(opinionID);
      await user.update({ participated: participated });
    } catch (err) {
      console.log("Error deleting result", err);
    }
  },
  // opinion 댓글 추가
  addComment: async function(email, opinionID, comment) {
    try {
      const commentOpinion = opinions
        .doc(opinionID)
        .collection("opinionComment")
        .doc();
      await commentOpinion.set({
        email: email,
        comment: comment.content,
        anonymous: comment.anonymous,
        commentTime: admin.firestore.Timestamp.fromDate(new Date()),
        commentID: commentOpinion.id
      });
    } catch (err) {
      return console.log("Error adding comment", err);
    }
  },

  // opinion 댓글 삭제
  deleteComment: async function(commentID, opinionID) {
    try {
      const comment = opinions
        .doc(opinionID)
        .collection("opinionComment")
        .doc(commentID);
      await comment.delete();
    } catch (err) {
      return console.log("Error deleting comment", err);
    }
  },

  // opinion 댓글 모두 출력
  showComments: async function(opinionID) {
    try {
      let comments = [];
      const opinionComment = opinions.doc(opinionID).collection(opinionComment);
      const snapshot = await opinionComment.orderBy("commentTime").get();
      snapshot.forEach(doc => {
        comments.push(doc.data());
      });
      return comments;
    } catch (err) {
      return console.log("Error showing comments", err);
    }
  }
};

module.exports = firebaseDB;
