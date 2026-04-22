
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { User, Course, Assignment, Group, Submission } = require("./models");

const app = express();
app.use(cors());
app.use(express.json());


console.log("MONGO URI:", process.env.MONGO_URI);
//connect mongodb
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const SECRET = process.env.JWT_SECRET || "secret123";

//auth middleware 
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "No token" });
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const professorOnly = (req, res, next) => {
  if (req.user.role !== "professor") return res.status(403).json({ error: "Professors only" });
  next();
};

//register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, student_id } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, student_id });
    res.json({ message: "User registered", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ userId: user._id, role: user.role, name: user.name }, SECRET);
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//courses
//create course(professor only)
app.post("/courses", auth, professorOnly, async (req, res) => {
  try {
    const { name, code } = req.body;
    const course = await Course.create({ name, code, professor: req.user.userId });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get courses for logged-in user
app.get("/courses", auth, async (req, res) => {
  try {
    let courses;
    if (req.user.role === "professor") {
      courses = await Course.find({ professor: req.user.userId }).populate("assignments");
    } else {
      courses = await Course.find({ students: req.user.userId }).populate("assignments");
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//enroll student in course
app.post("/courses/:id/enroll", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!course.students.includes(req.user.userId)) {
      course.students.push(req.user.userId);
      await course.save();
      await User.findByIdAndUpdate(req.user.userId, { $addToSet: { enrolledCourses: course._id } });
    }
    res.json({ message: "Enrolled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get all courses (for browsing/enrolling)
app.get("/courses/all", auth, async (req, res) => {
  try {
    const courses = await Course.find().populate("professor", "name");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//assignments

//create assignment
app.post("/assignments", auth, professorOnly, async (req, res) => {
  try {
    const { title, description, due_date, onedrive_link, courseId, submissionType } = req.body;
    const assignment = await Assignment.create({
      title, description, due_date, onedrive_link,
      course: courseId,
      submissionType: submissionType || "individual",
      createdBy: req.user.userId,
    });
    //attach to course
    await Course.findByIdAndUpdate(courseId, { $push: { assignments: assignment._id } });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get assignments for a course
app.get("/assignments/course/:courseId", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get all assignments (for student dashboard)
app.get("/assignments", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("course", "name code");
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//edit assignment
app.put("/assignments/:id", auth, professorOnly, async (req, res) => {
  try {
    const { title, description, due_date, onedrive_link, submissionType } = req.body;
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, description, due_date, onedrive_link, submissionType },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//delete assignment
app.delete("/assignments/:id", auth, professorOnly, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignment: req.params.id });
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//submit assignment - individual
app.post("/submit/:assignmentId", auth, async (req, res) => {
  try {
    const existing = await Submission.findOne({
      user: req.user.userId,
      assignment: req.params.assignmentId,
    });
    if (existing) return res.status(400).json({ error: "Already submitted" });

    const submission = await Submission.create({
      user: req.user.userId,
      assignment: req.params.assignmentId,
      confirmed: true,
    });
    res.json({ message: "Submitted!", submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//only group leader can acknowledge — marks all group members
app.post("/acknowledge/:assignmentId", auth, async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ error: "Group not found" });

    //check if requester is the leader
    if (group.leader.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Only the group leader can acknowledge" });
    }

    //mark all group members submissions as acknowledged
    await Submission.updateMany(
      {
        assignment: req.params.assignmentId,
        user: { $in: group.members },
      },
      {
        acknowledged: true,
        acknowledgedBy: req.user.userId,
      }
    );

    res.json({ message: "Acknowledged for all group members" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get my submissions
app.get("/my-submissions", auth, async (req, res) => {
  try {
    const subs = await Submission.find({ user: req.user.userId }).populate("assignment");
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get submissions for an assignment (professor)
app.get("/submissions/:assignmentId", auth, professorOnly, async (req, res) => {
  try {
    const subs = await Submission.find({ assignment: req.params.assignmentId })
      .populate("user", "name student_id email");
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//create group
app.post("/groups", auth, async (req, res) => {
  try {
    const { name, courseId } = req.body;
    const group = await Group.create({
      name,
      course: courseId,
      leader: req.user.userId,
      members: [req.user.userId],
      created_by: req.user.userId,
    });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add member by student_id
app.post("/groups/:id/add-member", auth, async (req, res) => {
  try {
    const { student_id } = req.body;
    const user = await User.findOne({ student_id });
    if (!user) return res.status(404).json({ error: "Student not found" });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.leader.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Only leader can add members" });
    }

    if (!group.members.includes(user._id)) {
      group.members.push(user._id);
      await group.save();
    }
    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//remove member
app.delete("/groups/:groupId/remove-member/:userId", auth, async (req, res) => {
  try {
    await Group.findByIdAndUpdate(req.params.groupId, {
      $pull: { members: req.params.userId }
    });
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get my groups
app.get("/groups", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId })
      .populate("members", "name student_id email")
      .populate("leader", "name");
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//stats prof dashboard
app.get("/stats", auth, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAssignments = await Assignment.countDocuments();

    const assignments = await Assignment.find();
    const submissionsPerAssignment = await Promise.all(
      assignments.map(async (a) => {
        const count = await Submission.countDocuments({ assignment: a._id, confirmed: true });
        return { id: a._id, title: a.title, submission_count: count, due_date: a.due_date };
      })
    );

    const userSubmissions = await Submission.find({ user: req.user.userId });

    res.json({
      totalStudents,
      totalAssignments,
      submissionsPerAssignment,
      userSubmissions: userSubmissions.map(s => s.assignment),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//root
app.get("/", (req, res) => res.send("EduTrack backend running"));

const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
