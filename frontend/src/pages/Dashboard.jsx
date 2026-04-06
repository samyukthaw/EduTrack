import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchAssignments();
    fetchGroups();
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

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups", {
        headers: { Authorization: token }
      });
      setGroups(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const submitAssignment = async (id) => {
    try {
      await API.post(`/submit/${id}`, {}, {
        headers: { Authorization: token }
      });
      alert("Submitted!");
    } catch (err) {
      alert("Error submitting");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return alert("Enter a group name");
    try {
      await API.post("/groups", { name: groupName }, {
        headers: { Authorization: token }
      });
      alert("Group created!");
      setGroupName("");
      fetchGroups();
    } catch (err) {
      alert("Error creating group");
    }
  };

  const addMember = async (groupId) => {
    if (!studentId.trim()) return alert("Enter a student ID");
    try {
      await API.post(`/groups/${groupId}/add-member`, { student_id: studentId }, {
        headers: { Authorization: token }
      });
      alert("Member added!");
      setStudentId("");
      fetchGroups();
    } catch (err) {
      alert("Error adding member");
    }
  };

  const removeMember = async (groupId, userId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await API.delete(`/groups/${groupId}/remove-member/${userId}`, {
        headers: { Authorization: token }
      });
      fetchGroups();
    } catch (err) {
      alert("Error removing member");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
      <hr />

      {/* ASSIGNMENTS */}
      <h3>Assignments</h3>
      {assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        assignments.map((a) => (
          <div key={a.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <p>Due: {new Date(a.due_date).toLocaleDateString()}</p>
            <a href={a.onedrive_link} target="_blank" rel="noreferrer">
              Open OneDrive Link
            </a>
            <br /><br />
            <button onClick={() => submitAssignment(a.id)}>Submit</button>
          </div>
        ))
      )}

      <hr />

      {/* CREATE GROUP */}
      <h3>My Groups</h3>
      <input
        placeholder="Group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <button onClick={createGroup} style={{ marginLeft: "10px" }}>
        Create Group
      </button>

      <br /><br />

      {/* GROUP LIST */}
      {groups.length === 0 ? (
        <p>No groups yet.</p>
      ) : (
        groups.map((g) => (
          <div key={g.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h4>{g.name}</h4>
            <p>Members ({g.members.length}):</p>
            <ul>
              {g.members.map((m) => (
                <li key={m.user_id} style={{ marginBottom: "5px" }}>
                  {m.name} ({m.student_id})
                  <button
                    onClick={() => removeMember(g.id, m.user_id)}
                    style={{ marginLeft: "10px", color: "red", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            {selectedGroupId === g.id ? (
              <div>
                <input
                  placeholder="Enter student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
                <button onClick={() => addMember(g.id)} style={{ marginLeft: "10px" }}>
                  Add
                </button>
                <button onClick={() => setSelectedGroupId(null)} style={{ marginLeft: "10px" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setSelectedGroupId(g.id)}>
                + Add Member
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}