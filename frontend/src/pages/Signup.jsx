import React, { useState } from "react";
import API from "../api";
import "../component/Auth.css";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match!"); return;
    }
    const hasLetter = /[A-Za-z]/.test(form.password);
    const hasDigit = /\d/.test(form.password);
    if (form.password.length < 8 || !hasLetter || !hasDigit) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    setLoading(true);
    try {
      await API.post("auth/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">
            <img src="/logo.png" alt="Shree Sales" />
            <h2>Create Account</h2>
            <p>Join Shree Sales and start shopping!</p>
          </div>

          {error && <div className="alert-box alert-error">{error}</div>}
          {success && <div className="alert-box alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password (min 8 chars, letters & numbers)" value={form.password} onChange={handleChange} required />
            <input type="password" name="confirm" placeholder="Confirm Password" value={form.confirm} onChange={handleChange} required />
            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <div className="auth-link">
            Already have an account? <span onClick={() => navigate("/login")}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
