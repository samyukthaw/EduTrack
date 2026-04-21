import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    onedrive_link: ""
  });

  const [assignments, setAssignments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/assignments", {
        headers: { Authorization: token }
      });
      setAssignments(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await API.get("/submissions", {
        headers: { Authorization: token }
      });
      setSubmissions(res.data);
      setShowSubmissions(true);
    } catch (err) {
      alert("Error fetching submissions");
    }
  };

  const createAssignment = async () => {
    try {
      await API.post("/assignments", form, {
        headers: { Authorization: token }
      });
      alert("Assignment created");
      fetchAssignments();
    } catch (err) {
      alert("Error creating assignment");
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await API.delete(`/assignments/${id}`, {
        headers: { Authorization: token }
      });
      fetchAssignments();
    } catch (err) {
      alert("Error deleting assignment");
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditForm({
      title: a.title,
      description: a.description,
      due_date: a.due_date?.split("T")[0],
      onedrive_link: a.onedrive_link
    });
  };

  const saveEdit = async (id) => {
    try {
      await API.put(`/assignments/${id}`, editForm, {
        headers: { Authorization: token }
      });
      setEditingId(null);
      fetchAssignments();
    } catch (err) {
      alert("Error updating assignment");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // group submissions by assignment id
  const getSubmissionsForAssignment = (assignmentId) => {
    return submissions.filter(s => s.assignment_id === assignmentId);
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={handleLogout}>Logout</button>
      <hr />

      {/* CREATE ASSIGNMENT */}
      <h3>Create Assignment</h3>
      <input
        placeholder="Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <br />
      <input
        placeholder="Description"
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <br />
      <input
  type="date"
  value={form.due_date}
  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
  onClick={(e) => e.target.showPicker()}
  style={{
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
    colorScheme: "dark"
  }}
/>
      <br />
      <input
        placeholder="OneDrive Link"
        onChange={(e) => setForm({ ...form, onedrive_link: e.target.value })}
      />
      <br /><br />
      <button onClick={createAssignment}>Create</button>

      <hr />

      {/* ALL ASSIGNMENTS */}
      <h3>All Assignments</h3>
      {assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        assignments.map((a) => (
          <div key={a.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            {editingId === a.id ? (
              <div>
                <input
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <br />
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <br />
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                />
                <br />
                <input
                  value={editForm.onedrive_link}
                  onChange={(e) => setEditForm({ ...editForm, onedrive_link: e.target.value })}
                />
                <br /><br />
                <button onClick={() => saveEdit(a.id)}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ marginLeft: "10px" }}>Cancel</button>
              </div>
            ) : (
              <div>
                <h4>{a.title}</h4>
                <p>{a.description}</p>
                <p>Due: {new Date(a.due_date).toLocaleDateString()}</p>
                <a href={a.onedrive_link} target="_blank" rel="noreferrer">Open Link</a>
                <br /><br />
                <button onClick={() => startEdit(a)}>Edit</button>
                <button onClick={() => deleteAssignment(a.id)} style={{ marginLeft: "10px", color: "red" }}>Delete</button>
              </div>
            )}
          </div>
        ))
      )}

      <hr />

      {/* SUBMISSIONS TRACKER */}
      <h3>Submission Tracker</h3>
      <button onClick={fetchSubmissions}>Load Submissions</button>

      {showSubmissions && (
        <div>
          {assignments.map((a) => {
            const subs = getSubmissionsForAssignment(a.id);
            return (
              <div key={a.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
                <h4>{a.title}</h4>
                <p>Total Submissions: {subs.length}</p>

                {subs.length === 0 ? (
                  <p style={{ color: "gray" }}>No submissions yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #ccc" }}>
                        <th style={{ textAlign: "left", padding: "5px" }}>Student Name</th>
                        <th style={{ textAlign: "left", padding: "5px" }}>Student ID</th>
                        <th style={{ textAlign: "left", padding: "5px" }}>Confirmed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((s, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "5px" }}>{s.name}</td>
                          <td style={{ padding: "5px" }}>{s.student_id}</td>
                          <td style={{ padding: "5px" }}>{s.confirmed ? "✅" : "❌"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}