const express = require("express");
const mongoose = require("mongoose");
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

// ===== Connect to MongoDB =====
mongoose
  .connect("mongodb://mongo:27017/GymDB")
  .then(() => {
    app.listen(port, () => console.log(`✅ Server running at: http://localhost:${port}/`));
    console.log("💾 Connected to MongoDB inside Docker");
  })
  .catch((err) => console.error("Connection error:", err));

// ===== Schemas & Models =====
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  membershipType: { type: String, required: true },
  startDate: { type: Date, required: true },
});
const Member = mongoose.model("Member", memberSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
userSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const User = mongoose.model("User", userSchema);

// ===== Routes =====

// Home page - form to add member
app.get("/", (req, res) => res.render("index"));

// Success page
app.get("/success.html", (req, res) => res.render("success"));

// ===== Members CRUD + Search =====

// Get all members
app.get("/Members", async (req, res) => {
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
app.post("/delete/:id", async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.redirect("/Members");
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error deleting member", error });
  }
});

// Search members by name
app.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.name;
    const members = await Member.find({ name: { $regex: searchQuery, $options: "i" } });
    res.render("Members", { myTitle: "Search Results", members });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error searching members", error });
  }
});
