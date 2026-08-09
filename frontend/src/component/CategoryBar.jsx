import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CategoryBar.css";
import API from "../api";

function CategoryBar({ categories }) {
  const navigate = useNavigate();
  const [openCat, setOpenCat] = useState(null);
  const [catProducts, setCatProducts] = useState({});

  const handleCatHover = async (catId) => {
    setOpenCat(catId);
    if (!catProducts[catId]) {
      try {
        const res = await API.get(`products/${catId}/`);
        setCatProducts(prev => ({ ...prev, [catId]: res.data.slice(0, 6) }));
      } catch (e) { console.error(e); }
    }
  };

  return (
    <nav className="category-bar" onMouseLeave={() => setOpenCat(null)}>
      <div className="category-bar-inner">
        <span className="cat-bar-label">Categories:</span>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`cat-item ${openCat === cat.id ? "active" : ""}`}
            onMouseEnter={() => handleCatHover(cat.id)}
          >
            <button
              className="cat-btn"
              onClick={() => navigate(`/products/${cat.id}`)}
            >
              {cat.name}
              <span className="cat-arrow">▾</span>
            </button>

            {openCat === cat.id && (
              <div className="cat-dropdown">
                <div className="dropdown-header">
                  <span>{cat.name}</span>
                  <button
                    className="view-all-btn"
                    onClick={() => { navigate(`/products/${cat.id}`); setOpenCat(null); }}
                  >
                    View All →
                  </button>
                </div>
                <div className="dropdown-products">
                  {catProducts[cat.id]?.length > 0 ? (
                    catProducts[cat.id].map(product => (
                      <div
                        key={product.id}
                        className="dropdown-product-card"
                        onClick={() => { navigate(`/product/${product.id}`); setOpenCat(null); }}
                      >
                        <div className="dp-img-wrap">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} />
                          ) : (
                            <div className="dp-img-placeholder">📦</div>
                          )}
                        </div>
                        <div className="dp-info">
                          <p className="dp-name">{product.name}</p>
                          <p className="dp-price">₹{product.price}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-products">No products yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

export default CategoryBar;
