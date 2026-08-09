import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/style.css";
import "./Feedback.css";

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-input">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star-icon ${s <= (hovered || value) ? "filled" : ""}`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >★</span>
      ))}
    </div>
  );
}

function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState(null);

  useEffect(() => {
    if (location.state && location.state.productId) {
      setProductId(location.state.productId);
    }
  }, [location]);

  const username = localStorage.getItem("username") || "Anonymous";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars === 0) { setError("Please select a star rating."); return; }
    setError("");
    try {
      await axios.post(`http://${window.location.hostname}:8000/api/feedback/`, {
        username, stars, message, product_id: productId
      });
      setSubmitted(true);
      setTimeout(() => navigate("/thank-you"), 1500);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        {!submitted ? (
          <>
            <div className="feedback-header">
              <div className="feedback-emoji">💬</div>
              <h2>Share Your Experience</h2>
              <p>Your feedback helps us serve you better!</p>
            </div>

            {error && <div className="alert-box alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="stars-section">
                <label>How would you rate your experience?</label>
                <StarInput value={stars} onChange={setStars} />
                <p className="star-label">
                  {stars === 1 ? "😔 Poor" : stars === 2 ? "😕 Fair" : stars === 3 ? "😊 Good" : stars === 4 ? "😄 Very Good" : stars === 5 ? "🤩 Excellent!" : "Click to rate"}
                </p>
              </div>

              <div className="message-section">
                <label>Suggestions or Comments <span>(Optional)</span></label>
                <textarea
                  placeholder="Tell us what you loved or what we can improve..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <button type="submit" className="submit-feedback-btn">
                Submit Feedback 🌟
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
            <h3 style={{ color: "#27ae60" }}>Thank you for your feedback!</h3>
            <p>Redirecting you to the next page...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feedback;
