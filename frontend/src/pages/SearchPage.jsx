import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

function SearchPage( {addToCart }) {
  const { keyword } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
  API
    .get(`products/search/?search=${keyword}`)
    .then((res) => setProducts(res.data))
    .catch((err) => console.log(err));
}, [keyword]);


  return (
  <div style={{ padding: "40px" }}>
    <h2>Search Results for "{keyword}"</h2>

    {products.length === 0 ? (
      <p style={{ marginTop: "20px" }}>No products found.</p>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              textAlign: "center",
              background: "#fff",
            }}
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                style={{ width: "100%", height: "180px", objectFit: "cover" }}
              />
            )}

            <h3 style={{ margin: "10px 0" }}>{product.name}</h3>

            <p style={{ fontWeight: "bold" }}>₹ {product.price}</p>

            <button
              onClick={() => addToCart({ ...product, quantity: 1 })}
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                backgroundColor: "#1a7f37",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
}
export default SearchPage;
