require("dotenv").config();

require("dotenv").config({ path: "./.env" });
console.log("ENV TEST:", process.env.DB_PASSWORD);


const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt"); //for password security
const jwt = require("jsonwebtoken");  //for login

const app = express();

//middleware
app.use(cors());                // allow frontend to call backend
app.use(express.json());        // read JSON data

//connect database or 
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// =======================
// 🔐 JWT SECRET
// =======================
const SECRET = "secret123";

// =======================
// 🔐 AUTH MIDDLEWARE
// =======================
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) return res.status(401).send("No token");

    const decoded = jwt.verify(token, SECRET);

    req.user = decoded; //contains userId + role

    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

//register
app.post("/register", async (req, res) => {
  const { name, email, password, role, student_id } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO users (name, email, password, role, student_id) VALUES ($1,$2,$3,$4,$5)",
    [name, email, hashed, role, student_id]
  );

  res.send("User registered");
});

//login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (user.rows.length === 0) {
    return res.status(401).json({ error: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.rows[0].password);

  if (!valid) {
    return res.status(401).json({ error: "Wrong password" });
  }

  const token = jwt.sign(
    {
      userId: user.rows[0].id,
      role: user.rows[0].role,
    },
    SECRET
  );

  res.json({ token });
});
//CREATE GROUP , here auth is middleware that verifies and fetches token info 
app.post("/groups", auth, async (req, res) => {
  const { name } = req.body;

  //create group
  const result = await pool.query(
    "INSERT INTO groups (name, created_by) VALUES ($1,$2) RETURNING id",
    [name, req.user.userId]
  );

  const groupId = result.rows[0].id;

  //add creator as member
  await pool.query(
    "INSERT INTO group_members (group_id, user_id) VALUES ($1,$2)",
    [groupId, req.user.userId]
  );

  res.send("Group created");
});


//ADD MEMBER WITH STUDENT ID
app.post("/groups/:id/add-member", auth, async (req, res) => {
  const { student_id } = req.body;
  const groupId = req.params.id; //requests group id of the group we are in

  //find user
  const user = await pool.query(
    "SELECT id FROM users WHERE student_id=$1",
    [student_id]
  );

  if (user.rows.length === 0) {
    return res.send("User not found");
  }

  //add to group
  await pool.query(
    "INSERT INTO group_members (group_id, user_id) VALUES ($1,$2)",
    [groupId, user.rows[0].id]
  );

  res.send("Member added");
});

//CREATE ASSIGNMENT (ONLY BY ADMIN)
app.post("/assignments", auth, async (req, res) => {
  const { title, description, due_date, onedrive_link } = req.body;
    //if student tries to create
  if (req.user.role !== "admin") {
    return res.send("Only admin can create");
  }
    //else if admin tries to create
  await pool.query(
    "INSERT INTO assignments (title, description, due_date, onedrive_link) VALUES ($1,$2,$3,$4)",
    [title, description, due_date, onedrive_link]
  );

  res.send("Assignment created");
});



//GET ASSIGNMENTS
app.get("/assignments", auth, async (req, res) => {
  const data = await pool.query("SELECT * FROM assignments");
  res.json(data.rows);
});


//SUBMIT ASSIGNMENT
app.post("/submit/:id", auth, async (req, res) => {
  const assignmentId = req.params.id;

  await pool.query(
    "INSERT INTO submissions (user_id, assignment_id, confirmed) VALUES ($1,$2,true)",
    [req.user.userId, assignmentId]
  );

  res.send("Submission confirmed");
});


//VIEW SUBMISSIONS(ONLY BY STUDENT)
app.get("/submissions", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.send("Only admin is allowed to view submissions");
  }

  const data = await pool.query(`
    SELECT users.name, users.student_id, submissions.assignment_id, submissions.confirmed
    FROM submissions
    JOIN users ON submissions.user_id = users.id
  `);

  res.json(data.rows);
});

// EDIT ASSIGNMENT
app.put("/assignments/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Only admin can edit");
  const { title, description, due_date, onedrive_link } = req.body;
  await pool.query(
    "UPDATE assignments SET title=$1, description=$2, due_date=$3, onedrive_link=$4 WHERE id=$5",
    [title, description, due_date, onedrive_link, req.params.id]
  );
  res.send("Assignment updated");
});

// DELETE ASSIGNMENT
app.delete("/assignments/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Only admin can delete");
  await pool.query("DELETE FROM submissions WHERE assignment_id=$1", [req.params.id]);
  await pool.query("DELETE FROM assignments WHERE id=$1", [req.params.id]);
  res.send("Assignment deleted");
});

// GET MY GROUPS WITH MEMBERS
app.get("/groups", auth, async (req, res) => {
  // get groups the user belongs to
  const groupsResult = await pool.query(`
    SELECT groups.id, groups.name
    FROM groups
    JOIN group_members ON groups.id = group_members.group_id
    WHERE group_members.user_id = $1
  `, [req.user.userId]);

  const groups = groupsResult.rows;

  // get members for each group
  for (let group of groups) {
    const membersResult = await pool.query(`
      SELECT users.id AS user_id, users.name, users.student_id
      FROM group_members
      JOIN users ON group_members.user_id = users.id
      WHERE group_members.group_id = $1
    `, [group.id]);
    group.members = membersResult.rows;
  }

  res.json(groups);
});

// REMOVE MEMBER FROM GROUP
app.delete("/groups/:groupId/remove-member/:userId", auth, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);
    await pool.query(
      "DELETE FROM group_members WHERE group_id=$1 AND user_id=$2",
      [groupId, userId]
    );
    res.send("Member removed");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET SUBMISSION STATS
app.get("/stats", auth, async (req, res) => {
  const totalStudents = await pool.query(
    "SELECT COUNT(*) FROM users WHERE role='student'"
  );

  const totalAssignments = await pool.query(
    "SELECT COUNT(*) FROM assignments"
  );

  const submissionsPerAssignment = await pool.query(`
    SELECT assignments.id, assignments.title, COUNT(submissions.id) as submission_count
    FROM assignments
    LEFT JOIN submissions ON assignments.id = submissions.assignment_id
    GROUP BY assignments.id, assignments.title
  `);

  const userSubmissions = await pool.query(
    "SELECT assignment_id FROM submissions WHERE user_id=$1",
    [req.user.userId]
  );

  res.json({
    totalStudents: parseInt(totalStudents.rows[0].count),
    totalAssignments: parseInt(totalAssignments.rows[0].count),
    submissionsPerAssignment: submissionsPerAssignment.rows,
    userSubmissions: userSubmissions.rows.map(r => r.assignment_id)
  });
});
//ROOT
app.get("/", (req, res) => {
  res.send("Backend running");
});

//START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});


