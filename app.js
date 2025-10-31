const express = require("express");
const mongoose = require("mongoose");
const Member = require("./models/memberModel"); 
const User = require("./models/userModel"); ذ
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;

// ===== Middlewares =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "views"))); // CSS
app.set("view engine", "ejs");

// ===== Session setup =====
app.use(session({
  secret: "yourSecretKey", 
  resave: false,
  saveUninitialized: false
}));

// ===== Connect to MongoDB =====
mongoose
  .connect("mongodb://localhost:27017/GymDB")
  .then(() => {
    app.listen(port, () => console.log(`✅ Server running at: http://localhost:${port}/`));
    console.log("💾 Connected to MongoDB locally");
  })
  .catch((err) => console.error("Connection error:", err));

function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

// ===== Routes =====

// Home page - form to add member
app.get("/", (req, res) => res.render("index"));

// Success page
app.get("/success.html", (req, res) => res.render("success"));

// ===== Register/Login =====
app.get("/register", (req, res) => {
  res.render("register", { errorMsg: "" });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render("register", { errorMsg: "⚠️ هذا المستخدم مسجل بالفعل!" });
    }

    const user = new User({ username, password });
    await user.save();


    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { errorMsg: "⚠️ حدث خطأ أثناء التسجيل، حاول مرة أخرى" });
  }
});



app.get("/login", (req, res) => {
  res.render("login", { errorMsg: "" });
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.render("login", { 
        errorMsg: "⚠️ هذا المستخدم غير مسجل، الرجاء التسجيل أولاً!" 
      });
    }
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render("login", { 
        errorMsg: "⚠️ كلمة المرور غير صحيحة!" 
      });
    }

    req.session.userId = user._id;
    res.redirect("/Members");

  } catch (err) {
    console.error(err);
    res.render("login", { 
      errorMsg: "⚠️ حدث خطأ أثناء تسجيل الدخول" 
    });
  }
});




app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ===== Members CRUD + Search =====

// Get all members
app.get("/Members", isAuthenticated, async (req, res) => {
  const members = await Member.find();
  res.render("Members", { myTitle: "Members", members });
});

// Create new member
app.post("/", async (req, res) => {
  try {
    const newMember = new Member({
      name: req.body.name,
      age: req.body.age,
      phone: req.body.phone,
      membershipType: req.body.membershipType,
      startDate: req.body.startDate,
    });
    await newMember.save();
    res.redirect("/success.html");
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error creating member", error });
  }
});

// Delete a member by ID
app.post("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.redirect("/Members");
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error deleting member", error });
  }
});

// Search members by name
app.get("/search", isAuthenticated, async (req, res) => {
  try {
    const searchQuery = req.query.name;
    const members = await Member.find({
      name: { $regex: searchQuery, $options: "i" }
    });
    res.render("Members", { myTitle: "Search Results", members });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error searching members", error });
  }
});
