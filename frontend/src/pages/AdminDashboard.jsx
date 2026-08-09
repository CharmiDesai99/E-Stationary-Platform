import React, { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";
import "./AdminDashboard.css";

function AdminDashboard({ setIsLoggedIn, setCart }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [outForDeliveryOrders, setOutForDeliveryOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesReport, setSalesReport] = useState({
    overall: { totalOrders: 0, totalProductsSold: 0 },
    weekly: [],
    monthly: [],
    products: []
  });
  const [salesModal, setSalesModal] = useState(null);

  const [adminComment, setAdminComment] = useState("");
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", category: "", is_best_seller: false, stock: 0 });
  const [productImage, setProductImage] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [msg, setMsg] = useState("");

  const tabs = [
    { id: "users", label: "👥 Users" },
    { id: "pending", label: "🕐 Pending Orders" },
    { id: "out_for_delivery", label: "🚚 Out For Delivery" },
    { id: "delivered", label: "✅ Delivered Orders" },
    { id: "cancelled", label: "❌ Cancelled Orders" },
    { id: "sales", label: "📊 Sales Reports" },
    { id: "feedback", label: "⭐ Feedbacks" },
    { id: "products", label: "📦 My Products" },
  ];

  useEffect(() => {
    const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
    const isSystemAdmin = userEmail === "aharsh1993@gmail.com" && localStorage.getItem("isAdmin") === "true";
    if (!isSystemAdmin) { navigate("/"); return; }
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
    fetchAll();
  }, [activeTab, navigate, window.location.search]);

  const fetchAll = () => {
    if (activeTab === "users") API.get("admin-api/users/").then(r => setUsers(r.data)).catch(() => {});
    if (activeTab === "pending") API.get("admin-api/orders/?status=pending").then(r => setPendingOrders(r.data)).catch(() => {});
    if (activeTab === "out_for_delivery") API.get("admin-api/orders/?status=out_for_delivery").then(r => setOutForDeliveryOrders(r.data)).catch(() => {});
    if (activeTab === "delivered") API.get("admin-api/orders/?status=delivered").then(r => setDeliveredOrders(r.data)).catch(() => {});
    if (activeTab === "cancelled") API.get("admin-api/orders/?status=cancelled").then(r => setCancelledOrders(r.data)).catch(() => {});
    if (activeTab === "sales") API.get("admin-api/sales-report/").then(r => setSalesReport(r.data)).catch(() => {});
    if (activeTab === "feedback") API.get("admin-api/feedback/").then(r => setFeedbacks(r.data)).catch(() => {});
    if (activeTab === "products") {
      API.get("admin-api/products/").then(r => setProducts(r.data)).catch(() => {});
      API.get("admin-api/categories/").then(r => setCategories(r.data)).catch(() => {});
    }
  };

  const handleLogout = async () => {
    try { await API.post("auth/logout/"); } catch (e) {}
    localStorage.clear();
    setIsLoggedIn(false);
    setCart([]);
    navigate("/");
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await API.put(`admin-api/orders/${orderId}/status/`, { status, admin_comment: adminComment });
      showMsg(`Order #${orderId} marked as ${status}! Notification email sent to customer.`);
      setSelectedOrder(null);
      fetchAll();
    } catch { showMsg("Failed to update order status", true); }
  };

  const handleSaveProduct = async () => {
    const fd = new FormData();
    Object.entries(productForm).forEach(([k, v]) => fd.append(k, v));
    if (productImage) fd.append("image", productImage);
    try {
      if (editProductId) {
        await API.put(`admin-api/products/${editProductId}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showMsg("Product updated!");
      } else {
        await API.post("admin-api/products/", fd, { headers: { "Content-Type": "multipart/form-data" } });
        showMsg("Product added!");
      }
      setProductForm({ name: "", price: "", description: "", category: "", is_best_seller: false, stock: 0 });
      setProductImage(null);
      setEditProductId(null);
      API.get("admin-api/products/").then(r => setProducts(r.data));
    } catch { showMsg("Failed to save product", true); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`admin-api/products/${id}/`);
      showMsg("Product deleted!");
      setProducts(p => p.filter(x => x.id !== id));
    } catch { showMsg("Failed to delete", true); }
  };

  const handleEditProduct = (p) => {
    setEditProductId(p.id);
    setProductForm({ name: p.name, price: p.price, description: p.description, category: p.category, is_best_seller: p.is_best_seller, stock: p.stock || 0 });
  };

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
            Welcome, {localStorage.getItem("username")}
          </span>
          <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-body">
        {/* Sidebar Nav */}
        <div className="admin-sidebar">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`admin-nav-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => { setActiveTab(t.id); setSelectedOrder(null); }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="admin-content">
          {msg && (
            <div className={`admin-alert ${msg.isError ? "alert-error" : "alert-success"}`}>
              {msg.text}
            </div>
          )}

          {/* ─── USERS ─── */}
          {activeTab === "users" && (
            <div>
              <h2 className="admin-section-title">All Registered Users</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Username</th><th>Email</th><th>Joined</th><th>Last Login</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td><td><b>{u.username}</b></td><td>{u.email}</td>
                        <td>{new Date(u.date_joined).toLocaleDateString('en-IN')}</td>
                        <td>{u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : "Never"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── PENDING ORDERS ─── */}
          {activeTab === "pending" && !selectedOrder && (
            <div>
              <h2 className="admin-section-title">Pending Orders <span className="order-count">({pendingOrders.length})</span></h2>
              <div className="orders-grid">
                {pendingOrders.length === 0 && <p style={{ color: "#6b7280" }}>No pending orders! 🎉</p>}
                {pendingOrders.map(o => (
                  <div key={o.id} className="admin-order-card" onClick={() => { setSelectedOrder(o); setAdminComment(""); }}>
                    <div className="aoc-header">
                      <span className="aoc-id">Order #{o.id}</span>
                      <span className="aoc-date">{new Date(o.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="aoc-name">{o.customer_name}</p>
                    <p className="aoc-phone">📞 {o.phone}</p>
                    <p className="aoc-total">₹{o.total_amount} · {o.payment_method?.toUpperCase()}</p>
                    <p className="aoc-items">{o.items?.length || 0} item(s)</p>
                    <div className="aoc-footer">View Details →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── ORDER DETAIL ─── */}
          {selectedOrder && (
            <div className="order-detail-panel">
              <button className="back-to-orders" onClick={() => setSelectedOrder(null)}>← Back to Orders</button>
              <h2 className="admin-section-title">Order #{selectedOrder.id} Details</h2>

              <div className="order-detail-grid">
                <div className="od-section">
                  <h3>Customer Info</h3>
                  <p><b>Name:</b> {selectedOrder.customer_name}</p>
                  <p><b>Email:</b> {selectedOrder.email}</p>
                  <p><b>Phone:</b> {selectedOrder.phone}</p>
                  <p><b>Address:</b> {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode}</p>
                  <p><b>Location Type:</b> <span className="loc-type-badge">{selectedOrder.location_type}</span></p>
                  {selectedOrder.location_link && (
                    <p><b>Location Link:</b> <a href={selectedOrder.location_link} target="_blank" rel="noreferrer" className="admin-link">Open in Maps 🔗</a></p>
                  )}
                  {selectedOrder.user_comment && (
                    <p><b>User Comment:</b> <i style={{ color: "#d32f2f" }}>"{selectedOrder.user_comment}"</i></p>
                  )}
                  <p><b>Payment:</b> {selectedOrder.payment_method?.toUpperCase()}</p>
                  <p><b>Total:</b> ₹{selectedOrder.total_amount} (Charge: ₹{selectedOrder.platform_charge})</p>
                  <p><b>Date:</b> {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                </div>

                {selectedOrder.payment_screenshot_url && (
                  <div className="od-section">
                    <h3>Payment Screenshot</h3>
                    <img src={selectedOrder.payment_screenshot_url} alt="Payment" className="payment-screenshot-img" />
                  </div>
                )}
              </div>

              <div className="od-section">
                <h3>Items Ordered</h3>
                <div className="order-items-detail">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="item-detail-row">
                      {item.product_image && (
                        <img src={item.product_image} alt={item.product_name} className="item-product-img" />
                      )}
                      <div>
                        <p><b>{item.product_name}</b></p>
                        <p>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                        {item.shape && <p>Shape: {item.shape}</p>}
                        {item.color && <p>Color: {item.color}</p>}
                        {item.stamp_text && <p>Text: {item.stamp_text}</p>}
                        {item.stamp_type && <p>Type: {item.stamp_type}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="od-section">
                <h3>Update Order Status</h3>
                <textarea
                  className="admin-comment-input"
                  placeholder="Add a note/comment for the customer (sent via email)..."
                  value={adminComment}
                  onChange={e => setAdminComment(e.target.value)}
                />
                <div className="status-action-btns">
                  <button className="status-btn out-btn" onClick={() => updateOrderStatus(selectedOrder.id, "out_for_delivery")}>
                    🚚 Mark Out for Delivery
                  </button>
                  <button className="status-btn delivered-btn" onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}>
                    ✅ Mark Delivered
                  </button>
                  <button className="status-btn cancel-order-btn" onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}>
                    ❌ Cancel Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── OUT FOR DELIVERY ORDERS ─── */}
          {activeTab === "out_for_delivery" && (
            <div>
              <h2 className="admin-section-title">Out For Delivery <span className="order-count">({outForDeliveryOrders.length})</span></h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead>
                  <tbody>
                    {outForDeliveryOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.id}</td><td>{o.customer_name}</td><td>{o.phone}</td>
                        <td>₹{o.total_amount}</td><td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        <td><button className="view-btn" onClick={() => setSelectedOrder(o)}>Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── DELIVERED ORDERS ─── */}
          {activeTab === "delivered" && (
            <div>
              <h2 className="admin-section-title">Delivered Orders</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
                  <tbody>
                    {deliveredOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.id}</td><td>{o.customer_name}</td><td>{o.phone}</td>
                        <td>₹{o.total_amount}</td><td>{o.payment_method?.toUpperCase()}</td>
                        <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── CANCELLED ORDERS ─── */}
          {activeTab === "cancelled" && (
            <div>
              <h2 className="admin-section-title">Cancelled Orders <span className="order-count">({cancelledOrders.length})</span></h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {cancelledOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.id}</td><td>{o.customer_name}</td><td>{o.phone}</td>
                        <td>₹{o.total_amount}</td><td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── SALES REPORTS ─── */}
          {activeTab === "sales" && (
            <div>
              <h2 className="admin-section-title">📊 Sales Analytics & Reports</h2>

              {/* Overall Stat Cards - DO NOT show Total Revenue or Average Order Value */}
              <div className="sales-stats-grid">
                <div className="sales-card">
                  <div className="sales-card-icon">📦</div>
                  <div>
                    <h4>Total Orders</h4>
                    <p className="sales-card-val">{salesReport.overall?.totalOrders || 0}</p>
                  </div>
                </div>
                <div className="sales-card">
                  <div className="sales-card-icon">🛒</div>
                  <div>
                    <h4>Products Sold</h4>
                    <p className="sales-card-val">{salesReport.overall?.totalProductsSold || 0}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Sales Report */}
              <div className="sales-section-box">
                <h3>📅 Weekly Sales (Day-wise Breakdown) <small style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "normal" }}>(Click any row for detailed orders)</small></h3>
                <div className="admin-table-wrap">
                  <table className="admin-table clickable-table">
                    <thead><tr><th>Day</th><th>Orders Placed</th><th>Visual Progress</th><th>Action</th></tr></thead>
                    <tbody>
                      {salesReport.weekly?.map((w, idx) => {
                        const maxOrders = Math.max(...(salesReport.weekly.map(x => x.orders) || [1]), 1);
                        const pct = Math.round((w.orders / maxOrders) * 100);
                        return (
                          <tr key={idx} onClick={() => setSalesModal({ type: "weekly", title: `Weekly Details: ${w.day}`, data: w })} className="interactive-row">
                            <td><b>{w.day}</b></td>
                            <td>{w.orders} order(s)</td>
                            <td>
                              <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td><button className="view-btn">View Details 🔍</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Sales Report */}
              {salesReport.monthly?.length > 0 && (
                <div className="sales-section-box">
                  <h3>🗓️ Monthly Sales <small style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "normal" }}>(Click any row for detailed orders)</small></h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table clickable-table">
                      <thead><tr><th>Month</th><th>Total Orders</th><th>Action</th></tr></thead>
                      <tbody>
                        {salesReport.monthly.map((m, idx) => (
                          <tr key={idx} onClick={() => setSalesModal({ type: "monthly", title: `Monthly Details: ${m.label}`, data: m })} className="interactive-row">
                            <td><b>{m.label}</b></td>
                            <td>{m.orders} order(s)</td>
                            <td><button className="view-btn">View Details 🔍</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Product Sales Report */}
              <div className="sales-section-box">
                <h3>🏆 Product Sales Breakdown <small style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "normal" }}>(Click any product for order breakdown)</small></h3>
                <div className="admin-table-wrap">
                  <table className="admin-table clickable-table">
                    <thead><tr><th>#</th><th>Product Name</th><th>Units Sold</th><th>Action</th></tr></thead>
                    <tbody>
                      {salesReport.products?.length === 0 ? (
                        <tr><td colSpan={4}>No product sales data yet</td></tr>
                      ) : (
                        salesReport.products?.map((p, idx) => (
                          <tr key={idx} onClick={() => setSalesModal({ type: "product", title: `Product Sales Details: ${p.product_name}`, data: p })} className="interactive-row">
                            <td>{idx + 1}</td>
                            <td><b>{p.product_name}</b></td>
                            <td>{p.quantity_sold} unit(s)</td>
                            <td><button className="view-btn">View Details 🔍</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detail Drilldown Modal */}
              {salesModal && (
                <div className="sales-modal-overlay" onClick={() => setSalesModal(null)}>
                  <div className="sales-modal-box" onClick={e => e.stopPropagation()}>
                    <div className="sales-modal-header">
                      <h3>{salesModal.title}</h3>
                      <button className="close-modal-btn" onClick={() => setSalesModal(null)}>×</button>
                    </div>

                    <div className="sales-modal-body">
                      {salesModal.type === "product" && (
                        <div className="modal-summary-chip">
                          <b>Total Units Sold:</b> {salesModal.data.quantity_sold} unit(s)
                        </div>
                      )}
                      {(salesModal.type === "weekly" || salesModal.type === "monthly") && (
                        <div className="modal-summary-chip">
                          <b>Total Orders:</b> {salesModal.data.orders} order(s)
                        </div>
                      )}

                      <h4 style={{ margin: "16px 0 8px", color: "#1a237e" }}>Orders Involved</h4>

                      {(!salesModal.data.ordersList || salesModal.data.ordersList.length === 0) ? (
                        <p style={{ color: "#666", padding: "10px 0" }}>No order records found for this selection.</p>
                      ) : (
                        <div className="admin-table-wrap">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesModal.data.ordersList.map((ord, i) => (
                                <tr key={i}>
                                  <td><b>#{ord.order_id || ord.id}</b></td>
                                  <td>{ord.customer_name || "Guest"}</td>
                                  <td>{ord.email || ord.phone || "—"}</td>
                                  <td><span className="loc-type-badge">{ord.status}</span></td>
                                  <td>{ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN') : "—"}</td>
                                  <td>
                                    {salesModal.type === "product" ? (
                                      <span>Qty: {ord.quantity} (₹{ord.item_total})</span>
                                    ) : (
                                      <span>₹{ord.total_amount} ({ord.items?.length || 0} items)</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="sales-modal-footer">
                      <button className="close-btn-secondary" onClick={() => setSalesModal(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── FEEDBACKS ─── */}
          {activeTab === "feedback" && (
            <div>
              <h2 className="admin-section-title">Customer Feedbacks</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Rating</th><th>Message</th><th>Date</th></tr></thead>
                  <tbody>
                    {feedbacks.map(f => (
                      <tr key={f.id}>
                        <td><b>{f.username}</b></td>
                        <td>{"★".repeat(f.stars)}{"☆".repeat(5 - f.stars)}</td>
                        <td>{f.message || "—"}</td>
                        <td>{new Date(f.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── PRODUCTS ─── */}
          {activeTab === "products" && (
            <div>
              <h2 className="admin-section-title">My Products</h2>

              {/* Add/Edit Form */}
              <div className="product-form-card">
                <h3>{editProductId ? "Edit Product" : "Add New Product"}</h3>
                <div className="product-form-grid">
                  <input className="admin-input" placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                  <input className="admin-input" type="number" placeholder="Price (₹)" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                  <select className="admin-input" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <label className="best-seller-check">
                    <input type="checkbox" checked={productForm.is_best_seller} onChange={e => setProductForm({ ...productForm, is_best_seller: e.target.checked })} />
                    ⭐ Mark as Best Seller
                  </label>
                  <input className="admin-input" type="number" placeholder="Stock Quantity" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                  <textarea className="admin-input" placeholder="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} style={{ gridColumn: "1/-1" }} rows={2} />
                  <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} style={{ gridColumn: "1/-1" }} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button className="save-product-btn" onClick={handleSaveProduct}>{editProductId ? "Update Product" : "Add Product"}</button>
                  {editProductId && <button className="cancel-edit-btn" onClick={() => { setEditProductId(null); setProductForm({ name: "", price: "", description: "", category: "", is_best_seller: false, stock: 0 }); }}>Cancel Edit</button>}
                </div>
              </div>

              {/* Products Table */}
              <div className="admin-table-wrap" style={{ marginTop: "20px" }}>
                <table className="admin-table">
                  <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Best Seller</th><th>Actions</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td><div className="product-thumb">{p.image_url ? <img src={p.image_url} alt={p.name} /> : "📦"}</div></td>
                        <td><b>{p.name}</b></td>
                        <td>₹{p.price}</td>
                        <td>{p.category_name}</td>
                        <td>{p.stock}</td>
                        <td>{p.is_best_seller ? "⭐ Yes" : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button className="edit-product-btn" onClick={() => handleEditProduct(p)}>Edit</button>
                            <button className="delete-product-btn" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
