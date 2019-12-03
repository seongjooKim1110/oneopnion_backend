const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(express.static("public"));
app.use(bodyParser.json()); //json형태
app.use(bodyParser.urlencoded({ extended: true }));
//app.set('view engine', 'ejs')

const port = process.env.PORT || 5000;

const userRouter = require("./routes/user");
const opinionRouter = require("./routes/opinion");

app.get("/", (req, res) => {});

app.use("/user", userRouter);
app.use("/opinion", opinionRouter);

app.listen(port, err => {
  if (err) console.log(err);
  else console.log("서버가 등록되었습니다. ");
});
