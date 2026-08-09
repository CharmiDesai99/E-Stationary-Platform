import React, { useState } from "react";
import API from "../api";
import "../component/Auth.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError(""); setLoading(true);
    try {
      const res = await API.post("auth/forgot-password/", { email });
      setMsg(res.data.message || "Password reset link sent! Check your email.");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Email not found. Please check and try again.");
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
            <h2>Forgot Password</h2>
            <p>Enter your email to receive a reset link</p>
          </div>

          {msg && <div className="alert-box alert-success">{msg}</div>}
          {error && <div className="alert-box alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Your registered email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className="auth-link">
            Remember your password? <span onClick={() => navigate("/login")}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;