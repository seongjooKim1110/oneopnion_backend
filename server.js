const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const userRouter = require("./routes/user");
const opinionRouter = require("./routes/opinion");

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get("/", (req, res) => {
  res.send("");
});

app.use("/user", userRouter);
app.use("/opinion", opinionRouter);
app.get("*", (req, res) => {
  res.status(404).send("죄송합니다. 해당 페이지가 없습니다.");
});

app.listen(port, error => {
  if (error) console.log(error);
  else console.log("서버가 등록되었습니다. ");
});
