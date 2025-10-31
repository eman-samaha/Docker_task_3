const mongoose = require("mongoose");
const schema = mongoose.Schema;

const memberSchema = new schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  membershipType: { type: String, required: true },
  startDate: { type: Date, required: true },
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;