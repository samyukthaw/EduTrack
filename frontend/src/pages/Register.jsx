import { useState } from "react";
import API from "../api/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", student_id: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.role === "student" && !form.student_id.trim()) e.student_id = "Student ID is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await API.post("/register", form);
      navigate("/");
    } catch (err) {
      console.log(err.response?.data);
      setServerError(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    onChange: (e) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      setErrors(prev => ({ ...prev, [key]: "" }));
    },
    className: `w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      ${errors[key] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-600 hover:border-slate-500"}`,
  });

  const ErrorMsg = ({ k }) => errors[k] ? (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      {errors[k]}
    </p>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-white tracking-tight">EduTrack</h1>
          <p className="text-slate-400 mt-1 text-sm">Create your account</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {serverError && (
            <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input placeholder="Enter your name" value={form.name} {...field("name")} />
              <ErrorMsg k="name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" placeholder="Enter your email" value={form.email} {...field("email")} />
              <ErrorMsg k="email" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" placeholder="Min. 6 characters" value={form.password} {...field("password")} />
              <ErrorMsg k="password" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-600 hover:border-slate-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            {form.role === "student" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Student ID</label>
                <input placeholder="e.g. SE25UARI000" value={form.student_id} {...field("student_id")} />
                <ErrorMsg k="student_id" />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
