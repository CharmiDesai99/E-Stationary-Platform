import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Profile.css";

function Profile({ setIsLoggedIn, setCart }) {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const username = localStorage.getItem("username") || "";
  const cachedEmail = localStorage.getItem("userEmail") || "";

  const [profile, setProfile] = useState({ 
    username: username, 
    email: cachedEmail, 
    full_name: "", 
    address: "", 
    pincode: "", 
    mobile: "" 
  });
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ full_name: "", address: "", pincode: "", mobile: "" });
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    // Fetch profile
    API.get("auth/profile/")
      .then(res => {
        setProfile(res.data);
        setForm({ 
          full_name: res.data.full_name || "", 
          address: res.data.address || "", 
          pincode: res.data.pincode || "", 
          mobile: res.data.mobile || "" 
        });
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setErrorMsg("Your session has expired. Please log in again.");
          // Optional: handle auto-logout if needed
        } else {
          setErrorMsg("Failed to load profile data.");
        }
      });

    // Fetch orders
    API.get(`user-orders/?username=${username}`)
      .then(res => setOrders(res.data))
      .catch(err => {
        console.error("Orders fetch error:", err);
      })
      .finally(() => setLoading(false));
    // Check for tab query param
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [isLoggedIn, username, window.location.search]);

  const handleSave = async () => {
    setMsg("");
    setErrorMsg("");
    try {
      const res = await API.put("auth/profile/", form);
      setMsg("Profile updated successfully!");
      setEditMode(false);
      setProfile(prev => ({ ...prev, ...form }));
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      console.error("Profile update error:", err);
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setErrorMsg("Session mismatched/expired. Please LOG OUT completely and LOG IN again.");
        } else {
          setErrorMsg(`Failed updating (Server responded with ${err.response.status})`);
        }
      } else {
        setErrorMsg(`Network/CORS error: ${err.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try { await API.post("auth/logout/"); } catch (e) {}
    localStorage.clear();
    setIsLoggedIn(false);
    setCart([]);
    navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="profile-guest">
        <div className="guest-card">
          <div className="guest-icon">👤</div>
          <h2>You're not logged in</h2>
          <p>Please login or create an account to view your profile.</p>
          <button className="btn-login-now" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-signup-now" onClick={() => navigate("/signup")}>Create Account</button>
        </div>
      </div>
    );
  }

  const statusColors = { pending: "#856404", out_for_delivery: "#0c5460", delivered: "#155724", cancelled: "#721c24" };
  const statusBgs = { pending: "#fff3cd", out_for_delivery: "#d1ecf1", delivered: "#d4edda", cancelled: "#f8d7da" };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">{(profile.username || username).charAt(0).toUpperCase()}</div>
            <h3>{profile.username || username}</h3>
            <p className="sidebar-email">{profile.email || "No email provided"}</p>
          </div>
          <nav className="profile-nav">
            <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>👤 My Profile</button>
            <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>📦 Order History</button>
            <button className="logout-nav-btn" onClick={handleLogout}>🚪 Logout</button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {activeTab === "profile" && (
            <div className="profile-content-card">
              <div className="card-header">
                <h2>Account Information</h2>
                {!editMode
                  ? <button className="edit-btn" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
                  : <div className="edit-actions">
                      <button className="save-btn" onClick={handleSave}>💾 Save Changes</button>
                      <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                }
              </div>
              
              {msg && <div className="alert-box alert-success">✅ {msg}</div>}
              {errorMsg && <div className="alert-box alert-error">❌ {errorMsg}</div>}

              <div className="profile-fields">
                <div className="field-row">
                  <label>Username</label>
                  <span className="readonly-value">{profile.username || username}</span>
                </div>
                <div className="field-row">
                  <label>Email Address</label>
                  <span className="readonly-value">{profile.email || "—"}</span>
                </div>
                <div className="field-row">
                  <label>Full Name</label>
                  {editMode
                    ? <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Enter your full name" />
                    : <span className="value-text">{profile.full_name || "—"}</span>
                  }
                </div>
                <div className="field-row">
                  <label>Mobile Number</label>
                  {editMode
                    ? <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="Enter your phone number" />
                    : <span className="value-text">{profile.mobile || "—"}</span>
                  }
                </div>
                <div className="field-row">
                  <label>Shipping Address</label>
                  {editMode
                    ? <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Enter your full address" rows="3" />
                    : <span className="value-text">{profile.address || "—"}</span>
                  }
                </div>
                <div className="field-row">
                  <label>Pincode</label>
                  {editMode
                    ? <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Pincode" />
                    : <span className="value-text">{profile.pincode || "—"}</span>
                  }
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="profile-content-card">
              <div className="card-header"><h2>Order History</h2></div>
              {loading ? <p>Loading orders...</p> :
                orders.length === 0 ? (
                  <div className="no-orders">
                    <p style={{ fontSize: "3rem" }}>📦</p>
                    <p>No orders placed yet.</p>
                    <button className="shop-btn" onClick={() => navigate("/")}>Start Shopping</button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header-row">
                          <div>
                            <span className="order-id">Order #{order.id}</span>
                            <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <span className="order-status-badge" style={{ background: statusBgs[order.status] || "#e0e4f0", color: statusColors[order.status] || "#1a237e" }}>
                            {order.status?.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        <div className="order-items-mini">
                          {order.items?.map((item, i) => (
                            <span key={i} className="order-item-chip">{item.product_name} ×{item.quantity}</span>
                          ))}
                        </div>
                        <div className="order-footer-row">
                          <span>Payment: <b>{order.payment_method?.toUpperCase()}</b></span>
                          <span className="order-total">Total: ₹{order.total_amount}</span>
                        </div>
                        {order.admin_comment && (
                          <div className="admin-comment-box">💬 Note from Shree Sales: {order.admin_comment}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Profile;