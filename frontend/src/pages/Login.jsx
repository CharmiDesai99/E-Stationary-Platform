import React, { useState } from "react";
import API from "../api";
import "../component/Auth.css";
import { useNavigate } from "react-router-dom";

function Login({ setCart, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/login/", {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("userEmail", res.data.email || "");
      setIsLoggedIn(true);

      if (res.data.is_admin) {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin-dashboard");
        return;
      } else {
        localStorage.removeItem("isAdmin");
      }

      // Handle pending cart product
      const pendingProduct = localStorage.getItem("pendingProduct");
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (pendingProduct) {
        const product = JSON.parse(pendingProduct);
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        const existing = savedCart.find(item => item.id === product.id);
        const updatedCart = existing
          ? savedCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + product.quantity } : item)
          : [...savedCart, product];
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        setCart(updatedCart);
        localStorage.removeItem("pendingProduct");
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath || "/");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">
            <img src="/Full Logo.JPG" alt="Shree Sales" style={{width:"300px",height:"100px",borderRadius: "0px",objectFit: "cover"}}/>
            <h2>Welcome Back</h2>
            <p>Login to your Shree Sales account</p>
          </div>

          {error && <div className="alert-box alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <div className="forgot-link">
              <span onClick={() => navigate("/forgot-password")}>Forgot Password?</span>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign Up</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
