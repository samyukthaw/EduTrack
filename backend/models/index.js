const mongoose = require("mongoose");

//user
const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ["student", "professor"], default: "student" },
  student_id: { type: String },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
}, { timestamps: true });

//course
const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, required: true },
  professor:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
}, { timestamps: true });

//assignment
const assignmentSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String },
  due_date:       { type: Date },
  onedrive_link:  { type: String },
  course:         { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  submissionType: { type: String, enum: ["individual", "group"], default: "individual" },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

//group
const groupSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  leader:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

//submission
const submissionSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignment:   { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  group:        { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  confirmed:    { type: Boolean, default: false },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = {
  User:       mongoose.model("User", userSchema),
  Course:     mongoose.model("Course", courseSchema),
  Assignment: mongoose.model("Assignment", assignmentSchema),
  Group:      mongoose.model("Group", groupSchema),
  Submission: mongoose.model("Submission", submissionSchema),
};
