import "../styles/style.css";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API from "../api";

function Header({ cartCount, isLoggedIn, setIsLoggedIn, setCart }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem("dismissedNotifications");
    return saved ? JSON.parse(saved) : [];
  });
  const notifRef = useRef(null);

  const isAuthenticated = isLoggedIn || localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
      const currentIsAdmin = userEmail === "aharsh1993@gmail.com" && localStorage.getItem("isAdmin") === "true";
      const currentUsername = localStorage.getItem("username");
      
      try {
        let allNotifs = [];
        const currentDismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
        if (currentIsAdmin) {
          const [ordersRes, usersRes] = await Promise.all([
            API.get("admin-api/orders/?status=pending"),
            API.get("admin-api/users/")
          ]);
          const newOrders = ordersRes.data.map(o => ({
            id: `o-${o.id}`,
            text: `New Order #${o.id} from ${o.customer_name}`,
            date: o.created_at,
            type: "order"
          }));
          const newUsers = usersRes.data.map(u => ({
            id: `u-${u.id}`,
            text: `New User joined: ${u.username}`,
            date: u.date_joined,
            type: "user"
          }));
          allNotifs = [...newOrders, ...newUsers].sort((a,b) => new Date(b.date) - new Date(a.date));
        } else if (currentUsername) {
          const res = await API.get(`user-orders/?username=${currentUsername}`);
          allNotifs = res.data.map(o => ({
            id: `s-${o.id}-${o.status}`,
            text: `Order #${o.id} is now ${o.status.replace(/_/g, " ").toUpperCase()}`,
            date: o.created_at,
            type: "status"
          }));
        }
        setNotifications(allNotifs.filter(n => !currentDismissed.includes(n.id)).slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Live: 10s

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/search/${searchTerm}`);
      setSearchTerm("");
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("auth/logout/");
    } catch (e) {}
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("cart");
    setIsLoggedIn(false);
    setCart([]);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: Logo + Brand */}
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Shree Sales" style={{ height: "50px", objectFit: "contain" }} />
        </Link>

        {/* Center: Search */}
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products, categories..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn" aria-label="Search">
            🔍
          </button>
        </form>

        {/* Right: Actions */}
        <div className="header-actions">
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
            <span className="icon">🛒</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <>
              <button 
                className="icon-btn profile-btn" 
                onClick={() => {
                  const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
                  const currentIsAdmin = userEmail === "aharsh1993@gmail.com" && localStorage.getItem("isAdmin") === "true";
                  navigate(currentIsAdmin ? "/admin-dashboard" : "/profile");
                }} 
                title={((localStorage.getItem("userEmail") || "").toLowerCase().trim() === "aharsh1993@gmail.com" && localStorage.getItem("isAdmin") === "true") ? "Admin Dashboard" : "Profile"}
              >
                <span className="icon">{((localStorage.getItem("userEmail") || "").toLowerCase().trim() === "aharsh1993@gmail.com" && localStorage.getItem("isAdmin") === "true") ? "⚙️" : "👤"}</span>
              </button>
              
              <div className="notif-wrapper" ref={notifRef}>
                <button 
                  className={`icon-btn notif-btn ${showNotifs ? "active" : ""}`} 
                  onClick={() => setShowNotifs(!showNotifs)} 
                  title="Notifications"
                >
                  <span className="icon">🔔</span>
                  {notifications.length > 0 && <span className="notif-dot"></span>}
                </button>

                {showNotifs && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h3>Notifications</h3>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifs">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="notif-item">
                            <div className="notif-content">
                              <p>{n.text}</p>
                              <small>{new Date(n.date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</small>
                            </div>
                            <button 
                              className="btn-dismiss" 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newDismissed = [...dismissedIds, n.id];
                                setDismissedIds(newDismissed);
                                localStorage.setItem("dismissedNotifications", JSON.stringify(newDismissed));
                                setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                              }}
                              title="Dismiss"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="btn-login btn-signup-header" onClick={() => navigate("/signup")}>
                Signup
              </button>
            </>
          )}

          {/* Right logo circle */}
          <img src="/circlelogo.PNG" alt="Logo" className="logo-circle" />
        </div>
      </div>
    </header>
  );
}

export default Header;