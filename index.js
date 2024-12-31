const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const session = require("express-session");
const passport = require("./config/passport")
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter")
const paymentRouter = require("./routes/paymentRouter");
const nocache = require("nocache");
const cors = require("cors")
db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());
app.use(cors())

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2592000,secure:false }, 
  })
);

app.use(passport.initialize());
app.use(passport.session())

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/User"),
  path.join(__dirname, "views/admin"),
]);
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});


app.use("/", userRouter);
app.use("/",adminRouter);
app.use("/",paymentRouter)

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});



module.exports = app;
