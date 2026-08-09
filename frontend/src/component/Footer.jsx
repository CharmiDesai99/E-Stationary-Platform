import "./Footer.css";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <img src="/logo.png" alt="Shree Sales" className="footer-logo" />
          <h3>Shree Sales</h3>
          <p>Your trusted stationery destination since years. Quality products, great prices.</p>
          <div className="footer-socials">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="social-link" title="Instagram">📷</a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="social-link" title="Facebook">📘</a>
            <a href="https://wa.me/919428465069" target="_blank" rel="noreferrer" className="social-link" title="WhatsApp">💬</a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
            <li><Link to="/login">Login / Sign Up</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <ul>
            <li>
              <span className="contact-icon">📍</span>
              <a href="https://www.google.com/maps/search/sattva+square+401+office+no.+Opp.+twin+star,Nr.+Nana+Mava+Circle,150Ft+Ring+Road,+Rajkot" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                Sattva Square, 401 Office No, Opp. Twin Star,<br />Nr. Nana Mava Circle, 150Ft Ring Road, Rajkot
              </a>
            </li>
            <li>
              <span className="contact-icon">📧</span>
              <a href="mailto:aharsh1993@gmail.com">aharsh1993@gmail.com</a>
            </li>
            <li>
              <span className="contact-icon">📞</span>
              <a href="tel:+919428465069">+91 94284 65069</a>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div className="footer-col">
          <h4>Store Hours</h4>
          <ul>
            <li>🕘 Mon – Sat: 9 AM – 8 PM</li>
            <li>🕘 Sunday: 10 AM – 5 PM</li>
            <li>🎉 Festive Hours May Vary</li>
          </ul>
          <div className="footer-badge">100% Quality Assured</div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Shree Sales Stationery. All Rights Reserved.</p>
        <p>Made with ❤️ for quality stationery lovers</p>
      </div>
    </footer>
  );
}

export default Footer;
