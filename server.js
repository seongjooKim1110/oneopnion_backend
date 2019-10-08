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
const admin = require('firebase-admin'); 
const serviceAccount= require('./testoneop-d8102-firebase-adminsdk-lgzqd-6b9888776b.json')

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
app.use(router); 

app.listen(port,err =>{
    if(err) console.log(err); 
    else console.log("서버가 등록되었습니다. ");
})