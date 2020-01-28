const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const userRouter = require("./routes/user");
const opinionRouter = require("./routes/opinion");

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
