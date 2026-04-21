import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDeadlineInfo = (due_date) => {
  if (!due_date) return { label: "No deadline", color: "text-slate-400", bg: "bg-slate-700/40" };
  const diff = Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10 border border-red-500/20" };
  if (diff <= 2) return { label: `Due in ${diff}d`, color: "text-orange-400", bg: "bg-orange-500/10 border border-orange-500/20" };
  if (diff <= 7) return { label: `Due in ${diff}d`, color: "text-yellow-400", bg: "bg-yellow-500/10 border border-yellow-500/20" };
  return { label: `Due in ${diff}d`, color: "text-green-400", bg: "bg-green-500/10 border border-green-500/20" };
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slide-up
      ${type === "success" ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-red-500/20 border border-red-500/40 text-red-300"}`}>
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "bg-blue-500" }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Assignment Card ──────────────────────────────────────────────────────────
function AssignmentCard({ assignment, submitted, onSubmit, submitting, myGroup }) {
  const dl = getDeadlineInfo(assignment.due_date);
  const isGroup = assignment.submissionType === "group";
  const isLeader = myGroup && myGroup.leader?._id === JSON.parse(atob(localStorage.getItem("token").split(".")[1])).userId;
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`bg-slate-800/60 border rounded-xl p-5 transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5
      ${submitted ? "border-green-500/30" : "border-slate-700/50"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white text-sm leading-snug">{assignment.title}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${dl.bg} ${dl.color}`}>{dl.label}</span>
      </div>

      {assignment.description && (
        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{assignment.description}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${isGroup ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-blue-500/15 border border-blue-500/30 text-blue-400"}`}>
          {isGroup ? "👥 Group" : "👤 Individual"}
        </span>
        {assignment.onedrive_link && (
          <a href={assignment.onedrive_link} target="_blank" rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline">
            Open Link ↗
          </a>
        )}
      </div>

      {submitted ? (
        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</div>
          Submitted
          {isGroup && isLeader && (
            <button
              onClick={() => onSubmit(assignment._id, "acknowledge")}
              className="ml-auto text-xs bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 px-3 py-1 rounded-lg transition-all"
            >
              Acknowledge for Group
            </button>
          )}
          {isGroup && !isLeader && (
            <span className="ml-auto text-xs text-slate-500">Pending leader ack</span>
          )}
        </div>
      ) : (
        <div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full text-sm bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg py-2 transition-all duration-200"
            >
              Mark as Submitted
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { onSubmit(assignment._id, "submit"); setConfirming(false); }}
                disabled={submitting === assignment._id}
                className="flex-1 text-sm bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 rounded-lg py-2 transition-all font-medium disabled:opacity-50"
              >
                {submitting === assignment._id ? "Submitting..." : "Yes, confirm ✓"}
              </button>
              <button onClick={() => setConfirming(false)} className="px-3 text-slate-400 hover:text-white transition-colors text-sm">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, assignments, submissions, onClick, active }) {
  const courseAssignments = assignments.filter(a => a.course?._id === course._id || a.course === course._id);
  const submitted = courseAssignments.filter(a => submissions.includes(a._id)).length;
  const pct = courseAssignments.length === 0 ? 0 : Math.round((submitted / courseAssignments.length) * 100);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-slate-800/60 border rounded-xl p-5 transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5
        ${active ? "border-blue-500/60 shadow-blue-500/10 shadow-lg" : "border-slate-700/50"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-sm">{course.name}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{course.code}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
          ${pct === 100 ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
          {pct === 100 ? "✓" : "📚"}
        </div>
      </div>

      <div className="space-y-1.5 mb-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{courseAssignments.length} assignment{courseAssignments.length !== 1 ? "s" : ""}</span>
          <span className={pct === 100 ? "text-green-400" : "text-blue-400"}>{pct}%</span>
        </div>
        <ProgressBar value={submitted} max={courseAssignments.length} color={pct === 100 ? "bg-green-500" : "bg-blue-500"} />
      </div>
      <p className="text-xs text-slate-500 mt-2">{submitted}/{courseAssignments.length} submitted</p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]); // array of assignment IDs
  const [groups, setGroups] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("courses");
  const [showEnroll, setShowEnroll] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  let userName = "";
  try { userName = JSON.parse(atob(token.split(".")[1])).name; } catch {}

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchCourses(), fetchAssignments(), fetchSubmissions(), fetchGroups()]);
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses", { headers: { Authorization: token } });
      setCourses(res.data);
    } catch {}
  };

  const fetchAllCourses = async () => {
    try {
      const res = await API.get("/courses/all", { headers: { Authorization: token } });
      setAllCourses(res.data);
    } catch {}
  };

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/assignments", { headers: { Authorization: token } });
      setAssignments(res.data);
    } catch {}
  };

  const fetchSubmissions = async () => {
    try {
      const res = await API.get("/my-submissions", { headers: { Authorization: token } });
      setSubmissions(res.data.map(s => s.assignment?._id || s.assignment));
    } catch {}
  };

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups", { headers: { Authorization: token } });
      setGroups(res.data);
    } catch {}
  };

  const handleAction = async (assignmentId, type, groupId) => {
    setSubmitting(assignmentId);
    try {
      if (type === "submit") {
        await API.post(`/submit/${assignmentId}`, {}, { headers: { Authorization: token } });
        setToast({ message: "Assignment submitted!", type: "success" });
      } else if (type === "acknowledge") {
        await API.post(`/acknowledge/${assignmentId}`, { groupId }, { headers: { Authorization: token } });
        setToast({ message: "Acknowledged for all group members!", type: "success" });
      }
      fetchSubmissions();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Error", type: "error" });
    } finally {
      setSubmitting(null);
    }
  };

  const enroll = async (courseId) => {
    try {
      await API.post(`/courses/${courseId}/enroll`, {}, { headers: { Authorization: token } });
      setToast({ message: "Enrolled successfully!", type: "success" });
      fetchCourses();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Already enrolled", type: "error" });
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await API.post("/groups", { name: groupName }, { headers: { Authorization: token } });
      setGroupName("");
      fetchGroups();
      setToast({ message: "Group created!", type: "success" });
    } catch {}
  };

  const addMember = async (groupId) => {
    if (!studentId.trim()) return;
    try {
      await API.post(`/groups/${groupId}/add-member`, { student_id: studentId }, { headers: { Authorization: token } });
      setStudentId("");
      fetchGroups();
      setToast({ message: "Member added!", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Error adding member", type: "error" });
    }
  };

  const removeMember = async (groupId, userId) => {
    try {
      await API.delete(`/groups/${groupId}/remove-member/${userId}`, { headers: { Authorization: token } });
      fetchGroups();
    } catch {}
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  const visibleAssignments = selectedCourse
    ? assignments.filter(a => a.course?._id === selectedCourse._id || a.course === selectedCourse._id)
    : assignments;

  const totalSubmitted = submissions.length;
  const totalAssignments = assignments.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-sm">📚</div>
            <span className="font-bold text-lg">EduTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">Hello, <span className="text-white font-medium">{userName}</span></span>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Enrolled Courses", value: courses.length, icon: "🎓" },
            { label: "Assignments", value: totalAssignments, icon: "📝" },
            { label: "Submitted", value: totalSubmitted, icon: "✅" },
            { label: "Completion", value: `${totalAssignments ? Math.round((totalSubmitted/totalAssignments)*100) : 0}%`, icon: "📊" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 font-medium">Overall Progress</span>
            <span className="text-blue-400">{totalSubmitted}/{totalAssignments} submitted</span>
          </div>
          <ProgressBar value={totalSubmitted} max={totalAssignments} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 mb-6 w-fit">
          {["courses", "assignments", "groups"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${activeTab === tab ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── COURSES TAB ── */}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Courses</h2>
              <button onClick={() => { setShowEnroll(!showEnroll); fetchAllCourses(); }}
                className="text-sm bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all">
                + Enroll in Course
              </button>
            </div>

            {showEnroll && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Available Courses</h3>
                <div className="space-y-2">
                  {allCourses.filter(c => !courses.find(ec => ec._id === c._id)).map(c => (
                    <div key={c._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.code} · Prof. {c.professor?.name}</p>
                      </div>
                      <button onClick={() => enroll(c._id)}
                        className="text-xs bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg transition-all">
                        Enroll
                      </button>
                    </div>
                  ))}
                  {allCourses.filter(c => !courses.find(ec => ec._id === c._id)).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-3">You're enrolled in all available courses!</p>
                  )}
                </div>
              </div>
            )}

            {courses.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No courses yet. Enroll in a course above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => (
                  <CourseCard key={c._id} course={c} assignments={assignments} submissions={submissions}
                    active={selectedCourse?._id === c._id}
                    onClick={() => { setSelectedCourse(c === selectedCourse ? null : c); setActiveTab("assignments"); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB ── */}
        {activeTab === "assignments" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedCourse ? selectedCourse.name : "All Assignments"}
                </h2>
                {selectedCourse && (
                  <button onClick={() => setSelectedCourse(null)} className="text-xs text-blue-400 hover:text-blue-300 mt-0.5">
                    ← All courses
                  </button>
                )}
              </div>
              <span className="text-sm text-slate-400">{visibleAssignments.length} total</span>
            </div>

            {visibleAssignments.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">📋</div>
                <p>No assignments yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleAssignments.map(a => {
                  const myGroup = groups.find(g => g.members?.some(m => m._id === a._id));
                  return (
                    <AssignmentCard
                      key={a._id}
                      assignment={a}
                      submitted={submissions.includes(a._id)}
                      onSubmit={(id, type) => handleAction(id, type, myGroup?._id)}
                      submitting={submitting}
                      myGroup={myGroup}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GROUPS TAB ── */}
        {activeTab === "groups" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">My Groups</h2>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Create New Group</h3>
              <div className="flex gap-3">
                <input
                  placeholder="Group name"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createGroup()}
                  className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button onClick={createGroup} className="bg-blue-500 hover:bg-blue-400 text-white text-sm px-4 py-2 rounded-lg transition-all">
                  Create
                </button>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">👥</div>
                <p>No groups yet. Create one above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map(g => {
                  const myId = JSON.parse(atob(token.split(".")[1])).userId;
                  const isLeader = g.leader?._id === myId || g.leader === myId;
                  return (
                    <div key={g._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{g.name}</h3>
                          <p className="text-xs text-slate-400">{g.members?.length || 0} member{g.members?.length !== 1 ? "s" : ""}</p>
                        </div>
                        {isLeader && (
                          <span className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                            👑 Leader
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2 mb-4">
                        {g.members?.map(m => (
                          <li key={m._id} className="flex items-center justify-between text-sm text-slate-300 bg-slate-700/30 rounded-lg px-3 py-2">
                            <span>{m.name} <span className="text-slate-500">({m.student_id})</span></span>
                            {isLeader && m._id !== myId && (
                              <button onClick={() => removeMember(g._id, m._id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                Remove
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      {isLeader && (
                        selectedGroupId === g._id ? (
                          <div className="flex gap-2">
                            <input
                              placeholder="Student ID"
                              value={studentId}
                              onChange={e => setStudentId(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && addMember(g._id)}
                              className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => addMember(g._id)} className="text-sm bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg transition-all">Add</button>
                            <button onClick={() => setSelectedGroupId(null)} className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedGroupId(g._id)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            + Add Member
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease; }
      `}</style>
    </div>
  );
}
