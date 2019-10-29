const express= require('express'); 
const app = express(); 

const bodyParser = require('body-parser');
app.use(express.static('public'))
app.use(bodyParser.json())//json형태
app.use(bodyParser.urlencoded({extended:true}))
//app.set('view engine', 'ejs')

const port = process.env.port || 3000;
const router = express.Router(); 

//firebase
var firebase = require("firebase/app");
var auth = require("firebase/auth");
const admin = require('firebase-admin'); 
const serviceAccount= require('./testoneop-d8102-firebase-adminsdk-lgzqd-6b9888776b.json')

var firebaseConfig = {
  apiKey: "AIzaSyDH1ccwuvdLdGHCNnhr6HyA7hCStKMmrss",
  authDomain: "testoneop-d8102.firebaseapp.com",
  databaseURL: "https://testoneop-d8102.firebaseio.com",
  projectId: "testoneop-d8102",
  storageBucket: "testoneop-d8102.appspot.com",
  messagingSenderId: "442810321009",
  appId: "1:442810321009:web:a8757996025f054fe7b3d0",
  measurementId: "G-0RKBZYZZ54"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}); 
const db = admin.firestore(); 

router.route('/').get((req, res) => {

  console.log('/ 호출');

  fs.readFile('./public/index.html', 'utf8', (err, data) => {

      res.end(data, 'utf-8')

  });
  
})


router.post('/create', function(req,res){
  let pname = req.body.name;
  let pnickname = req.body.nickname; 
  db.collection('user').doc(pname).set({
    name: pname,
    nickname : pnickname 
  })
  res.redirect('/');
})

router.get('/read', function(req,res){
  db.collection('user').get().then((snapshot)=>{
    snapshot.forEach((doc)=>{
      var data = doc.data(); 
      res.render(data);
  });
})
  .catch((err)=>{
    console.log(err); 
  });
})

router.post('/delete', function(req, res){
  let pname = req.body.name;
  db.collection('user').doc(pname).delete(); 
  res.redirect('/'); 
})

router.post('/update', function(req, res){
  let pname = req.body.name; 
  let pnickname = req.body.nickname;
  db.collection('user').doc(pname).update({
    nickname : pnickname
  }) 
  res.redirect('/'); 
})

/*app.get('https://testoneop-d8102.firebaseapp.com/__/auth/handler', function(req,res){
  var id_token = googleUser.getAuthResponse().id_token;
  var credential = firebase.auth.GoogleAuthProvider.credential(id_token);
  firebase.auth().signInWithCredential(credential).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });

})
*/
router.route('/auth/google').post(function(req,res){
  var id_token = req.body.idtoken;
  // Build Firebase credential with the Google ID token.
var credential = firebase.auth.GoogleAuthProvider.credential(id_token);

// Sign in with credential from the Google user.
firebase.auth().signInWithCredential(credential).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});

})

app.use(router); 

app.listen(port,err =>{
    if(err) console.log(err); 
    else console.log("서버가 등록되었습니다. ");
})