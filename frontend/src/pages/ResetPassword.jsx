import React, { useState } from "react";
import API from "../api";
import "../styles/style.css";
import "../component/Auth.css";
import { useNavigate, useLocation } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") || "";
  const username = params.get("username") || "";

  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.new_password !== form.confirm) {
      setError("Passwords do not match!"); return;
    }
    const hasLetter = /[A-Za-z]/.test(form.new_password);
    const hasDigit = /\d/.test(form.new_password);
    if (form.new_password.length < 8 || !hasLetter || !hasDigit) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("auth/reset-password/", {
        token,
        username,
        new_password: form.new_password,
      });
      setMsg(res.data.message || "Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to reset password. Please try again.");
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
            <h2>Reset Password</h2>
            <p>Set your new password below</p>
          </div>
          {msg && <div className="alert-box alert-success">{msg}</div>}
          {error && <div className="alert-box alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New Password"
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
            />
            <button type="submit">Reset Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;