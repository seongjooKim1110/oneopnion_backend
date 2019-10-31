// firebase node 모듈 가져오기
const admin = require("firebase-admin");
const serviceAccount = require("./testoneop-d8102-firebase-adminsdk-lgzqd-6b9888776b.json");

// firebase 설정
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://testoneop-d8102.firebaseio.com"
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
  addUser: function(userEmail, fields) {
    try {
      if (!users.doc(userEmail).get().exists) {
        let user = users.doc(userEmail);
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
        return 0;
      }
    } catch (err) {
      console.log("Error adding user", err);
    }
  },
  // 사용자 삭제 (수정 필요)
  deleteUser: function(userEmail) {
    try {
      const user = users.doc(userEmail);
      user.delete();
    } catch (err) {
      console.log("Error getting users", err);
    }
  },
  // 사용자 찾기
  findOneUser: async function(userEmail) {
    try {
      let doc = await users.doc(userEmail).get();
      if (!doc.exists) {
        console.log("No such document!");
      } else {
        //console.log("Document data:", doc.data());
        return doc.data();
      }
    } catch (err) {
      console.log("Error getting user", err);
    }
  },
  // opinion 찾기
  findOneOpinion: async function(opinionID) {
    try {
      let doc = await opinions.doc(opinionID).get();
      if (!doc.exists) {
        console.log("No such document!");
      } else {
        //console.log("Document data:", doc.data());
        return doc.data();
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
      const snapshot = await opinions.get();
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
        like: []
      });
      const user = users.doc(userEmail);
      await user.update({
        upload: admin.firestore.FieldValue.arrayUnion(opinion.id)
      });
    } catch (err) {
      console.log("Error creating opinion", err);
    }
  },
  // opinion 삭제(수정 필요)
  dropOpinion: async function name(userEmail, opinionID) {
    try {
      const user = users.doc(userEmail);
      await user.get().then(doc => {
        const upload = doc.data().upload;
        upload.pop(opinionID);
        user.update({ upload: upload });
      });
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
      await user.get().then(doc => {
        const liked = doc.data().liked;
        liked.pop(opinion.id);
        user.update({ liked: liked });
      });
      await opinion.get().then(doc => {
        const like = doc.data().like;
        like.pop(user.id);
        opinion.update({ like: like });
      });
    } catch (err) {
      console.log("Error deleting like", err);
    }
  },
  // user의 opinion 결과 제출
  makeResult: async function(userEmail, opinionID, result) {
    try {
      const opinionResult = opinions.doc(opinionID).collection("opinionResult");
      const userResult = opinionResult.doc(userEmail);
      await userResult.set({
        email: userEmail,
        result: result
      });
      const user = users.doc(users);
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
      await opinions
        .doc(opinionID)
        .collection("opinionResult")
        .doc(userEmail)
        .delete();
      const user = users.doc(userEmail);
      await user.get().then(doc => {
        const participated = doc.data().participated;
        liked.pop(opinionID);
        user.update({ participated: participated });
      });
    } catch (err) {
      console.log("Error deleting result", err);
    }
  },
  // opinion 댓글 추가
  addComment: async function(userEmail, opinionID, comment) {
    try {
      const opinionComment = opinions
        .doc(opinionID)
        .collection("opinionComment");
      const userComment = opinionComment.doc(userEmail);
      await userComment.set({
        email: userEmail,
        comment: comment.content,
        anonymous: comment.anonymous
      });
    } catch (err) {
      console.log("Error adding comment", err);
    }
  },

  // opinion 댓글 삭제
  deleteComment: async function(userEmail, opinionID) {
    try {
      await opinions
        .doc(opinionID)
        .collection("opinionComment")
        .doc(userEmail)
        .delete();
    } catch (err) {
      console.log("Error deleting comment", err);
    }
  }
};

module.exports = firebase;
