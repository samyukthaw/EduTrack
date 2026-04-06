import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    student_id: ""
  });

  const handleSubmit = async () => {
    try {
      await API.post("/register", form);
      alert("Registered successfully");
      navigate("/");
    } catch (err) {
      alert("Error registering");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input placeholder="Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <br />
      <input placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <br />
      <input type="password" placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <br />
      <input placeholder="Student ID"
        onChange={(e) => setForm({ ...form, student_id: e.target.value })} />
      <br />
      <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
      <br /><br />
      <button onClick={handleSubmit}>Register</button>
      <br /><br />
      <a href="/">Already have an account? Login</a>
    </div>
  );
}