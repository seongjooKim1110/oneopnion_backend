require("dotenv").config();
// firebase node 모듈 가져오기
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
      // When there are no documents left, we are done
      if (snapshot.size == 0) {
        return 0;
      }

      // Delete documents in a batch
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

const firebase = {
  // 사용자 추가
  addUser: async function(userEmail, fields) {
    try {
      const user = users.doc(userEmail);
      if (!(await user.get().exists)) {
        user.set({
          email: fields.email,
          name: fields.name,
          sex: fields.sex,
          birth: fields.birth,
          created: admin.firestore.Timestamp.fromDate(new Date()),
          upload: [],
          participated: [],
          liked: [],
          point: 0
        });
      } else {
        // user가 있으므로 로그인 페이지로 다시 이동
        return false;
      }
    } catch (err) {
      console.log("Error adding user", err);
    }
  },
  // 사용자 삭제 (수정 필요)
  deleteUser: async function(userEmail) {
    try {
      const user = users.doc(userEmail);
      await user.delete();
    } catch (err) {
      console.log("Error getting users", err);
    }
  },
  // 사용자 찾기
  findOneUser: async function(userEmail) {
    try {
      const user = await users.doc(userEmail).get();
      if (!user.exists) {
        console.log("No such user!");
        return {};
      } else {
        //console.log("Document data:", doc.data());
        return user.data();
      }
    } catch (err) {
      console.log("Error getting user", err);
    }
  },
  // opinion 찾기
  findOneOpinion: async function(opinionID) {
    try {
      const opinion = await opinions.doc(opinionID).get();
      if (!opinion.exists) {
        console.log("No such document!");
      } else {
        //console.log("Document data:", opinion.data());
        return opinion.data();
      }
    } catch (err) {
      console.log("Error getting opinion", err);
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
      console.log("Error getting users", err);
    }
  },
  // 전체 opinion 찾기
  findAllOpinion: async function() {
    try {
      const snapshot = await opinions.orderBy("opinionTime").get();
      let data = [];
      snapshot.forEach(doc => {
        //console.log(doc.id, "=>", doc.data());
        data.push(doc.data());
      });
      return data;
    } catch (err) {
      console.log("Error getting opinions", err);
    }
  },
  // opinion 생성 및 사용자 upload에 추가
  createOpinion: async function(userEmail, content) {
    try {
      const opinion = opinions.doc();
      await opinion.set({
        opinionID: opinion.id,
        title: content.title,
        category: content.category,
        deadline: content.deadline,
        anonymous: content.anonymous,
        form: content.form,
        like: [],
        opinionTime: admin.firestore.Timestamp.fromDate(new Date())
      });
      const user = user.doc(userEmail);
      await user.update({
        upload: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
    } catch (err) {
      console.log("Error creating opinion", err);
    }
  },
  // opinion 삭제(수정 필요)
  dropOpinion: async function(userEmail, opinionID) {
    try {
      const user = users.doc(userEmail);
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
      console.log("Error creating opinion", err);
    }
  },
  // opinion like 표시
  likeOpinion: async function(userEmail, opinionID) {
    try {
      const user = users.doc(userEmail);
      const opinion = opinions.doc(opinionID);
      await user.update({
        liked: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
      await opinion.update({
        like: admin.firestore.FieldValue.arrayUnion(user.id)
      });
    } catch (err) {
      console.log("Error liking opinion", err);
    }
  },
  // opinion like 삭제
  deleteLike: async function(userEmail, opinionID) {
    try {
      const user = users.doc(userEmail);
      const opinion = opinions.doc(opinionID);

      const userInformation = await user.get();
      const liked = await userInformation.data().liked.pop(opinion.id);
      await user.update({ liked: liked });

      const opinionInformation = await opinion.get();
      const like = await opinionInformation.data().like.pop(user.id);
      await opinion.update({ like: like });
    } catch (err) {
      console.log("Error deleting like", err);
    }
  },
  // user의 opinion 결과 제출
  makeResult: async function(userEmail, opinionID, result) {
    try {
      const opinion = opinions
        .doc(opinionID)
        .collection("opinionResult")
        .doc(userEmail);
      await opinion.set({
        email: userEmail,
        result: result
      });
      const user = users.doc(userEmail);
      await user.update({
        participated: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
    } catch (err) {
      console.log("Error making result", err);
    }
  },
  // user의 opinion 결과 삭제
  deleteResult: async function(userEmail, opinionID) {
    try {
      const user = users.doc(userEmail);
      const opinion = opinions
        .doc(opinionID)
        .collection("opinionResult")
        .doc(userEmail);
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
  // opinion 댓글 추가 (수정필요)
  addComment: async function(userEmail, opinionID, comment) {
    try {
      const commentOpinion = opinions
        .doc(opinionID)
        .collection("opinionComment")
        .doc();
      await commentOpinion.set({
        email: userEmail,
        comment: comment.content,
        anonymous: comment.anonymous,
        commentTime: admin.firestore.Timestamp.fromDate(new Date()),
        commentID: commentOpinion.id
      });
    } catch (err) {
      console.log("Error adding comment", err);
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
      console.log("Error deleting comment", err);
    }
  },

  // opinion 댓글 모두 검색
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
      console.log("Error showing comments", err);
    }
  }
};

module.exports = firebase;
