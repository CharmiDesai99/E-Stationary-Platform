import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Slider.css";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1400&q=80",
    title: "Premium Stationery",
    subtitle: "Elevate your writing experience with quality products",
    cta: "Shop Now",
    link: "/products/all"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1400&q=80",
    title: "Office Essentials",
    subtitle: "Everything you need for a productive workspace",
    cta: "Explore",
    link: "/products/1"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1400&q=80",
    title: "Inks & Refills",
    subtitle: "Unleash your productivity with our cartridge collection",
    cta: "Discover",
    link: "/products/5"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1400&q=80",
    title: "Custom Stamps",
    subtitle: "Personalize your stamps with custom text & designs",
    cta: "Order Now",
    link: "/products/4"
  },
];

function Slider() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, []);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <div
      className="slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`slide ${idx === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="slide-overlay" />
          <div className="slide-content">
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <button
              className="slide-cta"
              onClick={() => navigate(slide.link)}
            >
              {slide.cta}
            </button>
          </div>
        </div>
      ))}

      <button className="slider-arrow prev" onClick={prev}>❮</button>
      <button className="slider-arrow next" onClick={next}>❯</button>

      <div className="slider-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === current ? "active" : ""}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
}

export default Slider;
