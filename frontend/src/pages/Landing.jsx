import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import Slider from "../component/Slider";
import Testimonials from "../component/Testimonials";
import WhatsAppButton from "../component/WhatsAppButton";
import API from "../api";

function CountUp({ end, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (end || 0)));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    if (end > 0) window.requestAnimationFrame(step);
    else setCount(0);
  }, [started, end, duration]);

  return <span ref={countRef}>{count}{suffix}</span>;
}

function BestSellerCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  return (
    <div className="bs-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="bs-img-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="bs-img-placeholder">📦</div>
        )}
        <span className="bs-badge">⭐ Best Seller</span>
      </div>
      <div className="bs-info">
        <h4>{product.name}</h4>
        <p className="bs-category">{product.category_name}</p>
        <div className="bs-footer">
          <span className="bs-price">₹{product.price}</span>
          <button
            className="bs-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart({ ...product, quantity: 1 });
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Landing({ addToCart }) {
  const [visitors, setVisitors] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);
  const [stats, setStats] = useState({ happyCustomers: 0, productsAvailable: 0, satisfaction: 0, yearsInBusiness: 5 });
  const [realFeedbacks, setRealFeedbacks] = useState([]);

  useEffect(() => {
    // Visitor count
    API.get("visitors/")
      .then(res => setVisitors(res.data.visitors))
      .catch(() => {});

    // Best sellers
    API.get("best-sellers/")
      .then(res => setBestSellers(res.data))
      .catch(() => {});

    // Real Stats
    API.get("stats/")
      .then(res => {
        if (res.data) {
          setStats({
            happyCustomers: res.data.happyCustomers ?? res.data.happy_customers ?? 0,
            productsAvailable: res.data.productsAvailable ?? res.data.products_available ?? 0,
            satisfaction: res.data.satisfaction ?? res.data.customer_satisfaction ?? 0,
            yearsInBusiness: res.data.yearsInBusiness ?? res.data.years ?? 5
          });
        }
      })
      .catch(() => {});

    // Real Feedbacks
    API.get("feedback/")
      .then(res => setRealFeedbacks(res.data))
      .catch(() => {});
  }, []);

  const handleAddToCart = (product) => {
    if (addToCart) addToCart(product);
  };

  return (
    <div className="landing">
      {/* ─── Hero Slider ─── */}
      <section className="landing-slider">
        <Slider />
      </section>

      {/* ─── Best Sellers ─── */}
      {bestSellers.length > 0 && (
        <section className="best-sellers-section">
          <div className="container">
            <h2 className="section-title">Best Sellers</h2>
            <p className="section-subtitle">Our most loved products, hand-picked for you</p>
            <div className="divider"><div className="dot" /></div>
            <div className="bs-grid">
              {bestSellers.map(product => (
                <BestSellerCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Features Strip ─── */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: "🚚", title: "Fast Delivery", desc: "Quick & safe ordering" },
              { icon: "💎", title: "Premium Quality", desc: "Only the best products" },
              { icon: "🔒", title: "Secure Payments", desc: "100% safe & encrypted" },
              { icon: "🔄", title: "Easy Returns", desc: "Hassle-free return policy" },
            ].map((f, i) => (
              <div key={i} className="feature-item">
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <Testimonials feedbacks={realFeedbacks} />

      {/* ─── Visitor & Stats Counter ─── */}
      <section className="visitor-section">
        <div className="container">
          <div className="visitor-stats">
            <div className="stat-item">
              <h2 className="stat-number">
                <CountUp end={stats.happyCustomers} suffix="+" />
              </h2>
              <p>Happy Customers</p>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <h2 className="stat-number">
                <CountUp end={stats.productsAvailable} suffix="+" />
              </h2>
              <p>Products Available</p>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <h2 className="stat-number">
                <CountUp end={stats.yearsInBusiness} suffix="+" />
              </h2>
              <p>Years in Business</p>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <h2 className="stat-number">
                <CountUp end={stats.satisfaction} suffix="%" />
              </h2>
              <p>Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
}

export default Landing;