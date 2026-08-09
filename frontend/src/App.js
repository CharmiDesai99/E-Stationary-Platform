import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./styles/style.css";
import API from "./api";

import Landing from "./pages/Landing";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Feedback from "./pages/Feedback";
import ThankYou from "./pages/ThankYou";
import SearchPage from "./pages/SearchPage";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import Header from "./component/Header";
import CategoryBar from "./component/CategoryBar";
import Footer from "./component/Footer";

function App() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    API.get("categories/")
      .then(res => setCategories(res.data))
      .catch(err => console.error("API error fetching categories", err));

    // Verify session state on initial load
    API.get("auth/profile/")
      .then(res => {
        if (res.data && res.data.username) {
          setIsLoggedIn(true);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("username", res.data.username);
          if (res.data.email) localStorage.setItem("userEmail", res.data.email);
          if (res.data.is_admin && (res.data.email || "").toLowerCase().trim() === "aharsh1993@gmail.com") {
            localStorage.setItem("isAdmin", "true");
          } else {
            localStorage.removeItem("isAdmin");
          }
        }
      })
      .catch(() => {
        // Express session is unauthenticated
        setIsLoggedIn(false);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isAdmin");
      });
  }, []);

  const addToCart = (product) => {
    const loggedIn = isLoggedIn || localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      alert("Please login or signup first to add items to cart.");
      localStorage.setItem("pendingProduct", JSON.stringify(product));
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/login");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  return (
    <>
      <Header
        cartCount={cart.reduce((t, i) => t + i.quantity, 0)}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setCart={setCart}
      />

      <CategoryBar categories={categories} />

      <Routes>
        <Route path="/" element={<Landing addToCart={addToCart} />} />

        {/* Auth */}
        <Route path="/login" element={<Login setCart={setCart} setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Products */}
        <Route path="/products/:categoryId" element={<Products addToCart={addToCart} />} />
        <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} />} />
        <Route path="/search/:keyword" element={<SearchPage addToCart={addToCart} />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} />} />

        {/* Feedback & ThankYou */}
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Profile & Admin */}
        <Route path="/profile" element={<Profile setIsLoggedIn={setIsLoggedIn} setCart={setCart} />} />
        <Route path="/admin-dashboard" element={<AdminDashboard setIsLoggedIn={setIsLoggedIn} setCart={setCart} />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
