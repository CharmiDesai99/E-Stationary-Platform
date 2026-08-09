import "./ProductDetail.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedShape, setSelectedShape] = useState("Circle");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedType, setSelectedType] = useState("To stamp on Paper");
  const [customText, setCustomText] = useState("");
  const [designFile, setDesignFile] = useState(null);

  const isStamp =
  (product?.category && String(product.category).toLowerCase() === "stamp") ||
  (product?.name && product.name.toLowerCase().includes("stamp"));

  useEffect(() => {
    API.get(`product/${id}/`)
      .then(res => {
        const data = res.data;
        setProduct(data);

        // Fetch related products
        API.get(`products/${data.category}/`)
          .then(res => {
            const rel = res.data;
            const filtered = rel.filter(p => p.id !== data.id);
            setRelatedProducts(filtered);
          });
      });
  }, [id]);

  if (!product) return <h2>Loading...</h2>;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        <div className="product-image">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="product-info">
          <h2>{product.name}</h2>
          <p className="product-price">₹{product.price}</p>
          <p className="product-description">{product.description || "No description available."}</p>

          {/* ONLY STAMP CUSTOMIZATION */}
          {isStamp && (
            <div style={{ marginTop: "20px" }}>
              {/* Shape */}
              <h4>Choose Shape</h4>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                {["Circle", "Rectangle"].map(shape => (
                  <button
                    key={shape}
                    onClick={() => setSelectedShape(shape)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: selectedShape === shape ? "2px solid #2563eb" : "1px solid #ccc",
                      background: selectedShape === shape ? "#e0f2fe" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {shape}
                  </button>
                ))}
              </div>

              {/* Ink Color */}
              <h4>Choose Ink Color</h4>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
                {["Royal Blue", "Violet", "Black", "Red", "Green"].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: selectedColor === color ? "2px solid #2563eb" : "1px solid #ccc",
                      background: selectedColor === color ? "#e0f2fe" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>

              {/* Stamp Type */}
              <h4>Stamp On</h4>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                {["To stamp on Plastic", "To stamp on Paper"].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: selectedType === type ? "2px solid #2563eb" : "1px solid #ccc",
                      background: selectedType === type ? "#e0f2fe" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Custom Text */}
              <div style={{ marginTop: "15px" }}>
                <h4>Enter Stamp Text</h4>
                <input
                  type="text"
                  placeholder="Enter name or company"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  style={{ padding: "8px", width: "100%", marginTop: "5px" }}
                />
              </div>

              {/* Upload Design */}
              <div style={{ marginTop: "15px" }}>
                <h4>Upload Signature / Logo</h4>
                <input type="file" accept="image/*" onChange={(e) => setDesignFile(e.target.files[0])} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            <div className="quantity-box">
              <button onClick={() => setQuantity(prev => (prev > 1 ? prev - 1 : 1))} disabled={product.stock <= 0}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(prev => prev + 1)} disabled={product.stock <= 0}>+</button>
            </div>

            <button
  className={`add-cart-btn ${product.stock <= 0 ? 'out-of-stock' : ''}`}
  disabled={product.stock <= 0}
 onClick={() => {
  const itemToAdd = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    quantity
  };

  if (isStamp) {
    itemToAdd.shape = selectedShape;
    itemToAdd.color = selectedColor;
    itemToAdd.stamp_type = selectedType;
    itemToAdd.customText = customText;
    itemToAdd.designFile = designFile;

    // 🔹 Force category to "stamp"
    itemToAdd.category = "stamp";
  } else {
    // Non-stamp products keep their original category
    itemToAdd.category = product.category || "";
  }

  addToCart(itemToAdd);
}}
>
  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
</button>
          </div>
        </div>
      </div>

      <div className="related-section">
        <h3>Related Products</h3>
        <div className="related-grid">
          {relatedProducts.map(item => (
            <div key={item.id} className="related-card">
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: "100%", height: "150px", objectFit: "contain" }}
              />
              <h4>{item.name}</h4>
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;