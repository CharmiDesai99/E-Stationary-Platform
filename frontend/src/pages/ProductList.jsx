import { useParams } from "react-router-dom";

function ProductList() {
  const { slug } = useParams();

  return (
    <div style={{ padding: "40px" }}>
      <h2>Products for: {slug}</h2>
      <p>Here we will load products from backend 🔜</p>
    </div>
  );
}

export default ProductList;
