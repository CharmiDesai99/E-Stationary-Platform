import { useNavigate } from "react-router-dom";
import "../styles/style.css";

function ThankYou() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "calc(100vh - 200px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f5f6fa, #eef0f8)",
      padding: "40px 20px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px", padding: "56px 48px",
        maxWidth: "520px", width: "100%", textAlign: "center",
        boxShadow: "0 16px 60px rgba(26,35,126,0.12)",
        border: "1px solid #e0e4f0"
      }}>
        <div style={{ fontSize: "5rem", marginBottom: "20px" }}>🎊</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#1a237e", fontSize: "2rem", marginBottom: "12px" }}>
          Thank You!
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1rem", lineHeight: "1.7", marginBottom: "10px" }}>
          Your order has been placed successfully and your feedback means the world to us!
        </p>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "32px" }}>
          We hope to see you again soon at <strong style={{ color: "#1a237e" }}>Shree Sales Stationery</strong>.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "linear-gradient(135deg, #1a237e, #283593)",
            color: "#fff", border: "none", padding: "14px 36px",
            borderRadius: "50px", fontSize: "1rem", fontWeight: "700",
            cursor: "pointer", transition: "0.28s",
            fontFamily: "'Poppins', sans-serif",
            boxShadow: "0 6px 20px rgba(26,35,126,0.3)"
          }}
          onMouseEnter={e => { e.target.style.background = "linear-gradient(135deg, #f9a825, #ffd54f)"; e.target.style.color = "#1a237e"; }}
          onMouseLeave={e => { e.target.style.background = "linear-gradient(135deg, #1a237e, #283593)"; e.target.style.color = "#fff"; }}
        >
          🛍 Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default ThankYou;
