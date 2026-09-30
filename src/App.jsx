import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  "https://glayzamagnase-lavalust-1.onrender.com/api";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("lab6_token") || ""
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [products, setProducts] = useState([]);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      // Login API uses "success"
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid username or password."
        );
      }

      localStorage.setItem("lab6_token", data.token);

      setToken(data.token);
      setUsername("");
      setPassword("");
      setMessage("Login successful.");
    } catch (err) {
      setError(
        err.message || "Unable to connect to the API."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    const savedToken =
      localStorage.getItem("lab6_token");

    if (!savedToken) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/products`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lab6_token");
        setToken("");

        throw new Error(
          "Session expired. Please login again."
        );
      }

      // Product API uses "status"
      if (!response.ok || !data.status) {
        throw new Error(
          data.message || "Failed to load products."
        );
      }

      setProducts(data.data || []);
    } catch (err) {
      setError(
        err.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD PRODUCTS AFTER LOGIN
  // =========================================================

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setProductName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    setEditingId(null);
  };

  // =========================================================
  // ADD / UPDATE PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }

    if (price === "" || quantity === "") {
      setError(
        "Price and quantity are required."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const savedToken =
      localStorage.getItem("lab6_token");

    const productData = {
      product_name: productName,
      description: description,
      price: Number(price),
      quantity: Number(quantity),
    };

    try {
      const url = editingId
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
          Accept: "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lab6_token");
        setToken("");

        throw new Error(
          "Session expired. Please login again."
        );
      }

      // Product CRUD uses "status"
      if (!response.ok || !data.status) {
        throw new Error(
          data.message || "Unable to save product."
        );
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();

      await fetchProducts();
    } catch (err) {
      setError(
        err.message || "Unable to save product."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const handleEdit = (product) => {
    setEditingId(product.id);

    setProductName(
      product.product_name || ""
    );

    setDescription(
      product.description || ""
    );

    setPrice(product.price || "");
    setQuantity(product.quantity || "");

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    const savedToken =
      localStorage.getItem("lab6_token");

    try {
      const response = await fetch(
        `${API_URL}/products/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lab6_token");
        setToken("");

        throw new Error(
          "Session expired. Please login again."
        );
      }

      // Product CRUD uses "status"
      if (!response.ok || !data.status) {
        throw new Error(
          data.message || "Unable to delete product."
        );
      }

      setMessage(
        "Product deleted successfully."
      );

      await fetchProducts();
    } catch (err) {
      setError(
        err.message || "Unable to delete product."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    const savedToken =
      localStorage.getItem("lab6_token");

    try {
      if (savedToken) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            Accept: "application/json",
          },
        });
      }
    } catch (err) {
      console.log("Logout request failed.");
    }

    localStorage.removeItem("lab6_token");

    setToken("");
    setProducts([]);

    resetForm();

    setMessage("");
    setError("");
  };

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-container">

          {/* LEFT BRAND PANEL */}
          <div className="login-brand">

            <div className="brand-decoration decoration-one">
              ✦
            </div>

            <div className="brand-decoration decoration-two">
              ☕
            </div>

            <div className="login-coffee">
              ☕
            </div>

            <span className="brand-small">
              COFFEE SHOP
            </span>

            <h1>
              In Every
              <br />
              Dose of Coffee
            </h1>

            <p>
              A simple and cozy product
              management system for your
              coffee shop.
            </p>

            <div className="coffee-line">
              <span></span>
              <i>✦</i>
              <span></span>
            </div>
          </div>

          {/* RIGHT LOGIN PANEL */}
          <div className="login-form-panel">

            <div className="login-heading">
              <span className="login-welcome">
                Welcome back
              </span>

              <h2>
                Sign in
              </h2>

              <p>
                Enter your account details
                to continue.
              </p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>

              <div className="form-group">
                <label>
                  Username
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    ♙
                  </span>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Password
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? "Logging in..."
                    : "Sign in to dashboard"}
                </span>

                <span className="button-arrow">
                  →
                </span>
              </button>
            </form>

            <div className="login-footer">
              <span>☕</span>
              Coffee Shop Product Management
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="app">

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-inner">

          <div className="brand">

            <span className="brand-icon">
              ☕
            </span>

            <div>
              <h2>
                In Every Dose of Coffee
              </h2>

              <p>
                Product Management System
              </p>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>
      </header>

      <main className="main-wrapper">

        <div className="container">

          {/* WELCOME BANNER */}
          <section className="dashboard-welcome">

            <div className="welcome-content">

              <span className="welcome-label">
                COFFEE SHOP MANAGEMENT
              </span>

              <h1>
                Manage Your
                <br />
                Products
              </h1>

              <p>
                Keep your coffee products
                organized and manage your
                inventory with ease.
              </p>

            </div>

            <div className="product-stat">

              <div className="stat-icon">
                ☕
              </div>

              <div>
                <strong>
                  {products.length}
                </strong>

                <span>
                  Products
                </span>
              </div>

            </div>

          </section>

          {/* MESSAGES */}
          {message && (
            <div
              className="success-message"
              style={{
                marginTop: "28px",
                marginBottom: "0",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="error-message"
              style={{
                marginTop: "28px",
                marginBottom: "0",
              }}
            >
              {error}
            </div>
          )}

          {/* ADD / EDIT PRODUCT */}
          <section className="form-card">

            <div className="section-title">

              <div>
                <h2>
                  {editingId
                    ? "Edit Product"
                    : "Add New Product"}
                </h2>

                <p className="product-list-subtitle">
                  {editingId
                    ? "Update the product information below."
                    : "Add a new coffee product to your inventory."}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}

            </div>

            <form
              onSubmit={handleSubmit}
              className="product-form"
            >

              <div className="form-group">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  value={productName}
                  onChange={(e) =>
                    setProductName(
                      e.target.value
                    )
                  }
                  placeholder="Example: Caramel Latte"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Enter product description"
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        e.target.value
                      )
                    }
                    placeholder="0"
                    required
                  />

                </div>

              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>

            </form>

          </section>

          {/* PRODUCT LIST */}
          <section className="products-card">

            <div className="section-title">

              <div>
                <h2>
                  Product List
                </h2>

                <p className="product-list-subtitle">
                  Manage all coffee products
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={fetchProducts}
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {products.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ☕
                </div>

                <h3>
                  No Products Found
                </h3>

                <p>
                  Add your first coffee
                  product using the form
                  above.
                </p>

              </div>

            ) : (

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {products.map(
                      (product) => (
                        <tr
                          key={product.id}
                        >

                          <td>
                            {product.id}
                          </td>

                          <td>
                            <strong>
                              {
                                product.product_name
                              }
                            </strong>
                          </td>

                          <td>
                            {product.description ||
                              "No description"}
                          </td>

                          <td>
                            ₱
                            {Number(
                              product.price
                            ).toFixed(2)}
                          </td>

                          <td>
                            <span className="stock">
                              {
                                product.quantity
                              }
                            </span>
                          </td>

                          <td>

                            <div className="actions">

                              <button
                                className="edit-button"
                                onClick={() =>
                                  handleEdit(
                                    product
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                onClick={() =>
                                  handleDelete(
                                    product.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          <footer>
            In Every Dose of Coffee • React • LavaLust API • Aiven MySQL
          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
