import "./Products.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

function Products() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get(`products/${categoryId}/`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products", err));
  }, [categoryId]);

 return (
  <div className="products-page">
    <h2 className="products-title">Products</h2>

    <div className="products-grid">
      {products.map((product) => (
        <Link
          key={product.id}
          to={`/product/${product.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="product-card">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
              />
            )}
            {product.stock <= 0 && <div className="out-of-stock-badge">Out of Stock</div>}

            <h4>{product.name}</h4>
            <p className="price">₹ {product.price}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
);
}

export default Products;
