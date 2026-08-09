import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Checkout.css";

const PLATFORM_CHARGE_THRESHOLD = 1000;
const PLATFORM_CHARGE = 50;

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=bill, 2=payment-method, 3=details, 4=success
  const [paymentMethod, setPaymentMethod] = useState(""); // 'online' | 'cod'
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [initialProfile, setInitialProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    location_link: "",
    user_comment: "",
    location_type: "",
    other_location_type: "",
  });

  const subTotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const platformCharge = subTotal > PLATFORM_CHARGE_THRESHOLD ? 0 : PLATFORM_CHARGE;
  const grandTotal = subTotal + platformCharge;

  useEffect(() => {
    // Pre-fill from profile
    const username = localStorage.getItem("username") || "";
    const email = localStorage.getItem("userEmail") || "";
    if (username || email) {
      API.get("auth/profile/")
        .then(res => {
          const p = res.data;
          setFormData(prev => ({
            ...prev,
            name: p.full_name || username,
            email: p.email || email,
            phone: p.mobile || "",
            address: p.address || "",
            pincode: p.pincode || "",
          }));
          setInitialProfile(p);
          setProfileLoaded(true);
        }).catch(() => {
          setFormData(prev => ({ ...prev, name: username, email: email }));
          setProfileLoaded(true);
        });
    } else {
      setProfileLoaded(true);
    }
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const placeOrder = async () => {
    const { name, email, phone, address, city, pincode, location_type } = formData;
    if (!name || !email || !phone || !address || !city || !pincode || !location_type) {
      setError("Please fill all mandatory fields (marked with *).");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("customer_name", formData.name);
      fd.append("email", formData.email);
      fd.append("phone", formData.phone);
      fd.append("address", formData.address);
      fd.append("city", formData.city);
      fd.append("pincode", formData.pincode);
      fd.append("location_link", formData.location_link);
      fd.append("user_comment", formData.user_comment);
      fd.append("location_type", formData.location_type === "Other" ? `Other: ${formData.other_location_type}` : formData.location_type);
      fd.append("total_amount", grandTotal);
      fd.append("platform_charge", platformCharge);
      fd.append("payment_method", paymentMethod);
      fd.append("username", localStorage.getItem("username") || "");
      fd.append("items", JSON.stringify(
        cart.map(i => ({
          product: i.id,
          product_name: i.name,
          price: i.price,
          quantity: i.quantity,
          shape: i.shape || "",
          color: i.color || "",
          stamp_text: i.customText || i.stamp_text || "",
          stamp_type: i.stamp_type || "",
        }))
      ));
      const res = await API.post("create-order/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // SAVE ADDRESS TO PROFILE if it was empty before
      if (localStorage.getItem("username") && initialProfile && (!initialProfile.address || !initialProfile.pincode)) {
        try {
          await API.put("auth/profile/", {
            full_name: formData.name,
            address: formData.address,
            pincode: formData.pincode,
            mobile: formData.phone
          });
        } catch (e) {
          console.error("Failed to update profile address", e);
        }
      }

      if (paymentMethod === "online" && res.data.razorpay_order_id) {
        const scriptLoaded = await new Promise((resolve) => {
          if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            resolve(true);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!scriptLoaded) {
          setError("Failed to load payment gateway. Please try again or use Cash on Delivery.");
          setLoading(false);
          return;
        }

        const options = {
          key: res.data.razorpay_key,
          amount: res.data.razorpay_amount,
          currency: res.data.currency,
          name: "Shree Sales",
          description: "Order Payment",
          order_id: res.data.razorpay_order_id,
          handler: async function (response) {
            try {
              setLoading(true);
              await API.post("verify-payment/", {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_id: res.data.order_id
              });
              setCart([]);
              setStep(4);
            } catch (err) {
              setError("Payment verification failed! Please contact support.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#1a237e"
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
              setError("Payment cancelled. You can retry paying the order.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setError("Payment Failed! Reason: " + response.error.description);
        });
        rzp.open();
      } else {
        setCart([]);
        setStep(4);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to place order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  if (cart.length === 0 && step !== 4) {
    return (
      <div className="checkout-page container">
        <div className="empty-cart-msg">
          <h3>Your cart is empty</h3>
          <button className="btn-primary" onClick={() => navigate("/")}>Go Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Step Indicator */}
        <div className="step-indicator">
          {["Bill Summary", "Payment Method", "Details", "Confirmation"].map((s, i) => (
            <div key={i} className={`step ${step > i + 1 ? "done" : ""} ${step === i + 1 ? "active" : ""}`}>
              <div className="step-num">{step > i + 1 ? "✓" : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Bill Summary ─── */}
        {step === 1 && (
          <div className="checkout-card">
            <h2>📄 Your Order Summary</h2>
            <div className="bill-items">
              {cart.map(item => (
                <div key={item.id} className="bill-item">
                  <div className="bill-item-img">
                    {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>📦</span>}
                  </div>
                  <div className="bill-item-info">
                    <p className="bill-item-name">{item.name}</p>
                    {item.shape && <p className="bill-item-meta">Shape: {item.shape}</p>}
                    {item.color && <p className="bill-item-meta">Color: {item.color}</p>}
                    <p className="bill-item-meta">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="bill-item-total">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="bill-totals">
              <div className="bill-row"><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
              <div className="bill-row">
                <span>Platform Charge</span>
                <span className={platformCharge === 0 ? "free-text" : ""}>
                  {platformCharge === 0 ? "FREE" : `₹${platformCharge}`}
                </span>
              </div>
              <div className="bill-row grand"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <button className="next-btn" onClick={() => setStep(2)}>Save & Continue →</button>
          </div>
        )}

        {/* ─── STEP 2: Payment Method ─── */}
        {step === 2 && (
          <div className="checkout-card">
            <h2>💳 Choose Payment Method</h2>
            <div className="payment-options">
              <div
                className={`payment-option ${paymentMethod === "online" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("online")}
              >
                <div className="po-icon">📱</div>
                <div>
                  <h4>Online Payment</h4>
                  <p>UPI / QR Code</p>
                </div>
                <div className="po-radio" />
              </div>
              <div
                className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <div className="po-icon">💵</div>
                <div>
                  <h4>Cash on Delivery</h4>
                  <p>Pay when delivered</p>
                </div>
                <div className="po-radio" />
              </div>
            </div>

            {paymentMethod === "online" && (
              <div className="online-warning">
                ⚠️ <strong>Important Notice:</strong> If you choose Online Payment, your order <strong>cannot be cancelled or returned</strong> after payment confirmation. Please proceed only if you are sure.
              </div>
            )}

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
              <button
                className="next-btn"
                disabled={!paymentMethod}
                onClick={() => setStep(3)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Details & Screenshot ─── */}
        {step === 3 && (
          <div className="checkout-card">
            <h2>📝 Delivery Details</h2>

            {paymentMethod === "online" && (
              <div className="online-payment-info" style={{background: "#f0f4ff", padding: "15px", borderRadius: "8px", marginBottom: "20px"}}>
                <p style={{margin: 0, color: "#1a237e", fontWeight: "bold"}}>Secure Online Payment via Razorpay</p>
                <p style={{margin: "5px 0 0", fontSize: "14px"}}>You will be redirected to the secure Razorpay checkout after clicking "Place Order".</p>
              </div>
            )}

            <div className="form-grid">
              <input type="text" name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} className="form-input" />
              <input type="email" name="email" placeholder="Email Address *" value={formData.email} onChange={handleChange} className="form-input" />
              <input type="tel" name="phone" placeholder="Phone Number *" value={formData.phone} onChange={handleChange} className="form-input" />
              <input type="text" name="city" placeholder="City *" value={formData.city} onChange={handleChange} className="form-input" />
              <input type="text" name="pincode" placeholder="Pincode *" value={formData.pincode} onChange={handleChange} className="form-input" />
              
              <div className="location-type-group" style={{ gridColumn: "1/-1" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Location Type *</label>
                <div className="location-options" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {["House", "Factory", "School", "Office", "Other"].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${formData.location_type === type ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, location_type: type })}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: "1px solid #ddd",
                        background: formData.location_type === type ? "#1a237e" : "#fff",
                        color: formData.location_type === type ? "#fff" : "#333",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {formData.location_type === "Other" && (
                  <input 
                    type="text" 
                    name="other_location_type" 
                    placeholder="Please specify location type (e.g. Garden, Library) *" 
                    value={formData.other_location_type} 
                    onChange={handleChange} 
                    className="form-input" 
                    style={{ marginTop: "10px", borderColor: "#1a237e" }}
                    required
                  />
                )}
              </div>

              <input type="text" name="location_link" placeholder="Location Link (Google Maps) - Optional" value={formData.location_link} onChange={handleChange} className="form-input" style={{ gridColumn: "1/-1" }} />
              
              <textarea name="address" placeholder="Full Address *" value={formData.address} onChange={handleChange} className="form-input" rows={3} style={{ gridColumn: "1/-1" }} />
              
              <textarea name="user_comment" placeholder="Extra Comments (e.g. delivery time, gift wrap) - Optional" value={formData.user_comment} onChange={handleChange} className="form-input" rows={2} style={{ gridColumn: "1/-1" }} />
            </div>

            {error && <div className="alert-box alert-error">{error}</div>}

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="place-order-btn" onClick={placeOrder} disabled={loading}>
                {loading ? "Placing Order..." : "✅ Place Order"}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Success ─── */}
        {step === 4 && (
          <div className="checkout-card success-card">
            <div className="success-icon">🎉</div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for shopping at <strong>Shree Sales</strong>!</p>
            <p>A confirmation email has been sent to your email address.</p>
            <div className="success-actions">
              <button className="next-btn" onClick={() => navigate("/feedback", { state: { productId: cart[0]?.id } })}>
                🌟 Give Feedback
              </button>
              <button className="continue-btn" onClick={() => navigate("/")}>
                🛍 Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
