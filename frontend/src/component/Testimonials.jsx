import "./Testimonials.css";

// No static data fallback for home page feedbacks
const testimonials = [];

function StarRating({ stars }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= stars ? "#f9a825" : "#ddd" }}>★</span>
      ))}
    </div>
  );
}

function Testimonials({ feedbacks = [] }) {
  // Use real feedbacks if available, otherwise fallback to static
  const displayFeedbacks = feedbacks.length > 0 
    ? feedbacks.map(f => ({
        id: f.id,
        name: f.username,
        stars: f.stars,
        text: f.message,
        avatar: "👤",
        role: "Verified Customer"
      }))
    : testimonials;

  if (feedbacks.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2 className="section-title">What Our Customers Say</h2>
        <p className="section-subtitle">Real feedback from our happy customers</p>
        <div className="divider"><div className="dot" /></div>

        <div className="testimonials-grid">
          {displayFeedbacks.map(t => (
            <div key={t.id} className="testimonial-card">
              <div className="testimonial-quote">❝</div>
              <p className="testimonial-text">{t.text}</p>
              <StarRating stars={t.stars} />
              <div className="testimonial-author">
                <div className="author-avatar">{t.avatar}</div>
                <div>
                  <p className="author-name">{t.name}</p>
                  <p className="author-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
