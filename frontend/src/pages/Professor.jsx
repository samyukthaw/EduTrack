import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

//toast
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium
      ${type === "success" ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-red-500/20 border border-red-500/40 text-red-300"}`}>
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

function ProgressBar({ value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-green-500" : pct > 50 ? "bg-blue-500" : "bg-orange-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const getDeadlineBadge = (due_date) => {
  if (!due_date) return null;
  const diff = Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">Overdue</span>;
  if (diff <= 2) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">Due in {diff}d</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Due in {diff}d</span>;
};

export default function Professor() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  let profName = "";
  try { profName = JSON.parse(atob(token.split(".")[1])).name; } catch {}

  const [activeTab, setActiveTab] = useState("dashboard");
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Forms
  const [courseForm, setCourseForm] = useState({ name: "", code: "" });
  const [assignForm, setAssignForm] = useState({
    title: "", description: "", due_date: "", onedrive_link: "", courseId: "", submissionType: "individual"
  });

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchCourses(), fetchAssignments(), fetchStats()]);
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses", { headers: { Authorization: token } });
      setCourses(res.data);
    } catch {}
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/assignments", { headers: { Authorization: token } });
      setAssignments(res.data);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/stats", { headers: { Authorization: token } });
      setStats(res.data);
    } catch {}
  };

  const fetchSubmissionsFor = async (assignmentId) => {
    try {
      const res = await API.get(`/submissions/${assignmentId}`, { headers: { Authorization: token } });
      setSubmissions(prev => ({ ...prev, [assignmentId]: res.data }));
      setSelectedAssignment(assignmentId);
    } catch (err) {
      setToast({ message: "Could not load submissions", type: "error" });
    }
  };

  const createCourse = async () => {
    if (!courseForm.name || !courseForm.code) return setToast({ message: "Fill all fields", type: "error" });
    setLoading(true);
    try {
      await API.post("/courses", courseForm, { headers: { Authorization: token } });
      setCourseForm({ name: "", code: "" });
      fetchCourses();
      setToast({ message: "Course created!", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Error", type: "error" });
    } finally { setLoading(false); }
  };

  const createAssignment = async () => {
    if (!assignForm.title || !assignForm.courseId) return setToast({ message: "Title and course are required", type: "error" });
    setLoading(true);
    try {
      await API.post("/assignments", assignForm, { headers: { Authorization: token } });
      setAssignForm({ title: "", description: "", due_date: "", onedrive_link: "", courseId: "", submissionType: "individual" });
      fetchAssignments();
      fetchStats();
      setToast({ message: "Assignment created!", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Error", type: "error" });
    } finally { setLoading(false); }
  };

  const saveEdit = async (id) => {
    try {
      await API.put(`/assignments/${id}`, editForm, { headers: { Authorization: token } });
      setEditingId(null);
      fetchAssignments();
      setToast({ message: "Assignment updated!", type: "success" });
    } catch { setToast({ message: "Error updating", type: "error" }); }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await API.delete(`/assignments/${id}`, { headers: { Authorization: token } });
      fetchAssignments();
      fetchStats();
      setToast({ message: "Deleted", type: "success" });
    } catch {}
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  const inputClass = "w-full bg-slate-900/50 border border-slate-600 hover:border-slate-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">🎓</div>
            <span className="font-bold text-lg">EduTrack</span>
            <span className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full">Professor</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">Prof. <span className="text-white font-medium">{profName}</span></span>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: stats?.totalStudents ?? "—", icon: "👥", color: "text-blue-400" },
            { label: "Assignments", value: stats?.totalAssignments ?? "—", icon: "📝", color: "text-purple-400" },
            { label: "Courses", value: courses.length, icon: "📚", color: "text-indigo-400" },
            {
              label: "Avg Completion",
              value: stats?.submissionsPerAssignment?.length
                ? `${Math.round(stats.submissionsPerAssignment.reduce((a, s) => a + (s.submission_count / (stats.totalStudents || 1)), 0) / stats.submissionsPerAssignment.length * 100)}%`
                : "0%",
              icon: "📊",
              color: "text-green-400"
            },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 mb-6 w-fit">
          {["dashboard", "courses", "assignments", "submissions"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${activeTab === tab ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Submission Overview</h2>
            {assignments.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">📋</div>
                <p>No assignments yet. Create one in the Assignments tab.</p>
              </div>
            ) : (
              assignments.map(a => {
                const stat = stats?.submissionsPerAssignment?.find(s => s.id === a._id);
                const count = stat?.submission_count || 0;
                const total = stats?.totalStudents || 0;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);

                return (
                  <div key={a._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white">{a.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            ${a.submissionType === "group"
                              ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                              : "bg-blue-500/15 border border-blue-500/30 text-blue-400"}`}>
                            {a.submissionType === "group" ? "👥 Group" : "👤 Individual"}
                          </span>
                          {getDeadlineBadge(a.due_date)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                      </div>
                      <button
                        onClick={() => fetchSubmissionsFor(a._id)}
                        className="shrink-0 text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        View Submissions
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{count} / {total} submitted</span>
                        <span className={pct === 100 ? "text-green-400" : pct > 50 ? "text-blue-400" : "text-orange-400"}>
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar value={count} max={total} />
                    </div>

                    {/* Submissions drawer */}
                    {selectedAssignment === a._id && submissions[a._id] && (
                      <div className="mt-4 border-t border-slate-700/50 pt-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">
                          Submissions ({submissions[a._id].length})
                        </h4>
                        {submissions[a._id].length === 0 ? (
                          <p className="text-slate-500 text-sm">No submissions yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-400 border-b border-slate-700/50">
                                  <th className="pb-2 font-medium">Student</th>
                                  <th className="pb-2 font-medium">ID</th>
                                  <th className="pb-2 font-medium">Status</th>
                                  <th className="pb-2 font-medium">Acknowledged</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/30">
                                {submissions[a._id].map((s, i) => (
                                  <tr key={i} className="text-slate-300">
                                    <td className="py-2">{s.user?.name}</td>
                                    <td className="py-2 text-slate-400">{s.user?.student_id}</td>
                                    <td className="py-2">
                                      {s.confirmed
                                        ? <span className="text-green-400 text-xs">✅ Submitted</span>
                                        : <span className="text-red-400 text-xs">❌ Pending</span>}
                                    </td>
                                    <td className="py-2">
                                      {s.acknowledged
                                        ? <span className="text-blue-400 text-xs">✓ Ack</span>
                                        : <span className="text-slate-500 text-xs">—</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <button onClick={() => setSelectedAssignment(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                          Close ↑
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── COURSES TAB ── */}
        {activeTab === "courses" && (
          <div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Create New Course</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Course Name</label>
                  <input placeholder="e.g. Data Structures" value={courseForm.name}
                    onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Course Code</label>
                  <input placeholder="e.g. CS201" value={courseForm.code}
                    onChange={e => setCourseForm(p => ({ ...p, code: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <button onClick={createCourse} disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl transition-all font-medium">
                {loading ? "Creating..." : "Create Course"}
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-4">My Courses ({courses.length})</h2>
            {courses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📚</div>
                <p>No courses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => (
                  <div key={c._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg mb-3">📚</div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-slate-400 text-sm">{c.code}</p>
                    <p className="text-slate-500 text-xs mt-2">{c.students?.length || 0} students enrolled</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB ── */}
        {activeTab === "assignments" && (
          <div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Create Assignment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Title *</label>
                  <input placeholder="Assignment title" value={assignForm.title}
                    onChange={e => setAssignForm(p => ({ ...p, title: e.target.value }))} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Description</label>
                  <input placeholder="Brief description" value={assignForm.description}
                    onChange={e => setAssignForm(p => ({ ...p, description: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Due Date</label>
                  <input type="date" value={assignForm.due_date}
                    onChange={e => setAssignForm(p => ({ ...p, due_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Course *</label>
                  <select value={assignForm.courseId}
                    onChange={e => setAssignForm(p => ({ ...p, courseId: e.target.value }))} className={inputClass}>
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Submission Type</label>
                  <select value={assignForm.submissionType}
                    onChange={e => setAssignForm(p => ({ ...p, submissionType: e.target.value }))} className={inputClass}>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">OneDrive Link</label>
                  <input placeholder="https://..." value={assignForm.onedrive_link}
                    onChange={e => setAssignForm(p => ({ ...p, onedrive_link: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <button onClick={createAssignment} disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm px-5 py-2.5 rounded-xl transition-all font-medium">
                {loading ? "Creating..." : "Create Assignment"}
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-4">All Assignments ({assignments.length})</h2>
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
                  {editingId === a._id ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className={inputClass} />
                      <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={inputClass} />
                      <input type="date" value={editForm.due_date} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} className={inputClass} />
                      <input value={editForm.onedrive_link} onChange={e => setEditForm(p => ({ ...p, onedrive_link: e.target.value }))} className={inputClass} />
                      <select value={editForm.submissionType} onChange={e => setEditForm(p => ({ ...p, submissionType: e.target.value }))} className={inputClass}>
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                      </select>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => saveEdit(a._id)} className="bg-green-500 hover:bg-green-400 text-white text-sm px-4 py-2 rounded-lg transition-all">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-white">{a.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            ${a.submissionType === "group"
                              ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                              : "bg-blue-500/15 border border-blue-500/30 text-blue-400"}`}>
                            {a.submissionType === "group" ? "👥 Group" : "👤 Individual"}
                          </span>
                          {getDeadlineBadge(a.due_date)}
                        </div>
                        {a.description && <p className="text-slate-400 text-sm">{a.description}</p>}
                        {a.course && <p className="text-xs text-slate-500 mt-1">📚 {a.course.name} ({a.course.code})</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingId(a._id); setEditForm({ title: a.title, description: a.description, due_date: a.due_date?.split("T")[0], onedrive_link: a.onedrive_link, submissionType: a.submissionType }); }}
                          className="text-xs border border-slate-600 hover:border-slate-400 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                          Edit
                        </button>
                        <button onClick={() => deleteAssignment(a._id)}
                          className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeTab === "submissions" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">View Submissions by Assignment</h2>
            <div className="space-y-4">
              {assignments.map(a => (
                <div key={a._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{a.title}</h3>
                      <p className="text-xs text-slate-400">{a.course?.name} · Due {a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <button onClick={() => fetchSubmissionsFor(a._id)}
                      className="text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all">
                      {selectedAssignment === a._id ? "Hide" : "Load Submissions"}
                    </button>
                  </div>

                  {selectedAssignment === a._id && submissions[a._id] && (
                    <div className="mt-3 border-t border-slate-700/50 pt-4">
                      {submissions[a._id].length === 0 ? (
                        <p className="text-slate-500 text-sm">No submissions yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-slate-400 border-b border-slate-700/50">
                                <th className="pb-2 pr-4 font-medium">Student</th>
                                <th className="pb-2 pr-4 font-medium">Student ID</th>
                                <th className="pb-2 pr-4 font-medium">Submitted</th>
                                <th className="pb-2 font-medium">Acknowledged</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                              {submissions[a._id].map((s, i) => (
                                <tr key={i} className="text-slate-300 hover:bg-slate-700/20">
                                  <td className="py-2.5 pr-4">{s.user?.name || "—"}</td>
                                  <td className="py-2.5 pr-4 text-slate-400">{s.user?.student_id || "—"}</td>
                                  <td className="py-2.5 pr-4">
                                    {s.confirmed ? <span className="text-green-400">✅ Yes</span> : <span className="text-red-400">❌ No</span>}
                                  </td>
                                  <td className="py-2.5">
                                    {s.acknowledged ? <span className="text-blue-400">✓ Yes</span> : <span className="text-slate-500">—</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
