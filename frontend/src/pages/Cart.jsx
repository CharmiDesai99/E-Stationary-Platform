import { useNavigate } from "react-router-dom";
import "./Cart.css";
import API from "../api";
import { useEffect, useState } from "react";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);
  const subTotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const platformCharge = subTotal > 1000 ? 0 : 50;
  const grandTotal = subTotal + platformCharge;

  const increaseQty = (id) =>
    setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));

  const decreaseQty = (id) =>
    setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
      .filter(item => item.quantity > 0));

  const removeItem = (id) => setCart(cart.filter(item => item.id !== id));

  useEffect(() => {
    // Fetch "you might like" suggestions from best sellers
    API.get("best-sellers/")
      .then(res => {
        const cartIds = cart.map(i => i.id);
        setSuggestedProducts(res.data.filter(p => !cartIds.includes(p.id)).slice(0, 4));
      }).catch(() => {});
  }, [cart]);

  return (
    <div className="cart-page">
      <div className="cart-inner container">
        <h2 className="cart-heading">🛒 My Cart ({totalItems} items)</h2>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to your cart to continue shopping</p>
            <button className="btn-primary" onClick={() => navigate("/")}>Start Shopping</button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-col">
              {cart.map(item => (
                <div key={`${item.id}-${item.shape}-${item.color}`} className="cart-card">
                  <div className="cart-item-img">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} />
                      : <span className="item-emoji">📦</span>
                    }
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    {item.shape && <p><b>Shape:</b> {item.shape}</p>}
                    {item.color && <p><b>Ink Color:</b> {item.color}</p>}
                    {item.customText && <p><b>Text:</b> {item.customText}</p>}
                    <span className="item-price">₹{item.price} each</span>
                  </div>
                  <div className="cart-item-right">
                    <div className="qty-controls">
                      <button onClick={() => decreaseQty(item.id)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.id)}>+</button>
                    </div>
                    <p className="item-subtotal">₹{(item.price * item.quantity).toFixed(2)}</p>
                    <button className="remove-btn" onClick={() => removeItem(item.id)}>🗑 Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="cart-summary-col">
              <div className="cart-summary-card">
                <h3>Order Summary</h3>
                <div className="summary-row"><span>Subtotal ({totalItems} items)</span><span>₹{subTotal.toFixed(2)}</span></div>
                <div className="summary-row">
                  <span>Platform Charge</span>
                  <span className={platformCharge === 0 ? "free-charge" : ""}>
                    {platformCharge === 0 ? "FREE" : `₹${platformCharge}`}
                  </span>
                </div>
                {platformCharge === 0 && (
                  <p className="free-label">🎉 Free delivery on orders above ₹1000!</p>
                )}
                {platformCharge > 0 && (
                  <p className="charge-label">Add ₹{1000 - subTotal} more for free delivery!</p>
                )}
                <div className="summary-divider" />
                <div className="summary-row grand-total">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <button className="buy-now-btn" onClick={() => navigate("/checkout")}>
                  🛍 Proceed to Buy
                </button>
                <button className="continue-btn" onClick={() => navigate("/")}>
                  ← Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* You Might Like */}
        {suggestedProducts.length > 0 && (
          <div className="suggested-section">
            <h3>You Might Also Like</h3>
            <div className="suggested-grid">
              {suggestedProducts.map(p => (
                <div key={p.id} className="suggested-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="sug-img">
                    {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span>📦</span>}
                  </div>
                  <p className="sug-name">{p.name}</p>
                  <p className="sug-price">₹{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;