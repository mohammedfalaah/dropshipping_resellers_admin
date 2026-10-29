import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { productsApi } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [availableCategories, setAvailableCategories] = useState([
    "Gadgets",
    "Watches",
    "Footwear",
    "Fashion",
    "Sunglasses",
  ]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Image Upload & Compression state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  // Bulk Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importing, setImporting] = useState(false);

  // Form State & Validation
  const initialForm = {
    name: "",
    sku: "",
    slug: "",
    category: "",
    description: "",
    mainImage: "",
    regularPrice: "",
    resellerPrice: "",
    stockQuantity: "",
    minOrderQuantity: 1,
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const clearError = (field) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search };
      if (selectedCategory !== "all") params.category = selectedCategory;

      const res = await productsApi.getAll(params);
      const data = res.data?.products ? res.data : res.data?.data || res.data;
      setProducts(data.products || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch catalog products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await productsApi.getCategories();
        const list = res?.data?.categories || res?.categories;
        if (Array.isArray(list) && list.length > 0) {
          const names = list.map((c) => c.name || c);
          setAvailableCategories(Array.from(new Set([...names, "Sunglasses"])));
        }
      } catch (e) {
        // keep fallback
      }
    };
    loadCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setFormErrors({});
    setUploadStats(null);
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormErrors({});
    setFormData({
      name: prod.name || "",
      sku: prod.sku || "",
      slug: prod.slug || "",
      category: prod.category?.name || prod.category || "",
      description: prod.description || "",
      mainImage: prod.mainImage || "",
      regularPrice: prod.regularPricePaise ? (prod.regularPricePaise / 100).toFixed(2) : "",
      resellerPrice: prod.resellerPricePaise ? (prod.resellerPricePaise / 100).toFixed(2) : "",
      stockQuantity: prod.stockQuantity !== undefined ? prod.stockQuantity : "",
      minOrderQuantity: prod.minOrderQuantity || 1,
      isActive: prod.isActive !== false,
    });
    setUploadStats(null);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to archive or delete "${name}"?`)) return;
    try {
      await productsApi.delete(id);
      toast.success(`Product "${name}" deleted.`);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
    }
  };

  // Image Upload and Backend Compression Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    setUploadingImage(true);
    try {
      const res = await productsApi.uploadImage(data);
      if (res.success && res.data) {
        setFormData((prev) => ({ ...prev, mainImage: res.data.url }));
        setUploadStats(res.data);
        clearError("mainImage");
        toast.success(
          `Image imported & compressed: ${res.data.originalSizeFormatted} → ${res.data.compressedSizeFormatted} (${res.data.savingsPercent} smaller)`
        );
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err.message || "Failed to compress and upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const errors = {};
    const errorNotifications = [];

    // 1. Product Name Validation (Required, min 2 chars)
    const trimmedName = formData.name ? formData.name.trim() : "";
    if (!trimmedName) {
      errors.name = "Product name is required.";
      errorNotifications.push({
        id: "err-name",
        message: "Missing Required Field: Product Name is required.",
      });
    } else if (trimmedName.length < 2) {
      errors.name = "Product name must be at least 2 characters.";
      errorNotifications.push({
        id: "err-name",
        message: "Invalid Field: Product Name must be at least 2 characters.",
      });
    }

    // 2. SKU Validation (Required, min 3 chars)
    const trimmedSku = formData.sku ? formData.sku.trim().toUpperCase() : "";
    if (!trimmedSku) {
      errors.sku = "Product SKU is required.";
      errorNotifications.push({
        id: "err-sku",
        message: "Missing Required Field: Product SKU is required.",
      });
    } else if (trimmedSku.length < 3) {
      errors.sku = "SKU must be at least 3 characters.";
      errorNotifications.push({
        id: "err-sku",
        message: "Invalid Field: SKU must be at least 3 characters.",
      });
    }

    // 3. Category Validation (Required)
    if (!formData.category || !formData.category.trim()) {
      errors.category = "Category selection is required.";
      errorNotifications.push({
        id: "err-category",
        message: "Missing Required Field: Category is required. Please select a category.",
      });
    }

    // 4. Regular Retail Price Validation (Required, > 0)
    const regPrice = parseFloat(formData.regularPrice);
    if (
      formData.regularPrice === "" ||
      formData.regularPrice === null ||
      formData.regularPrice === undefined ||
      isNaN(regPrice)
    ) {
      errors.regularPrice = "Regular retail price is required.";
      errorNotifications.push({
        id: "err-regularPrice",
        message: "Missing Required Field: Regular Retail Price (₹) is required.",
      });
    } else if (regPrice <= 0) {
      errors.regularPrice = "Regular price must be greater than ₹0.";
      errorNotifications.push({
        id: "err-regularPrice",
        message: "Invalid Field: Regular Retail Price must be greater than ₹0.",
      });
    }

    // 5. Reseller Wholesale Price Validation (Required, > 0, <= Regular Price)
    const resPrice = parseFloat(formData.resellerPrice);
    if (
      formData.resellerPrice === "" ||
      formData.resellerPrice === null ||
      formData.resellerPrice === undefined ||
      isNaN(resPrice)
    ) {
      errors.resellerPrice = "Reseller wholesale price is required.";
      errorNotifications.push({
        id: "err-resellerPrice",
        message: "Missing Required Field: Reseller Wholesale Price (₹) is required.",
      });
    } else if (resPrice <= 0) {
      errors.resellerPrice = "Reseller price must be greater than ₹0.";
      errorNotifications.push({
        id: "err-resellerPrice",
        message: "Invalid Field: Reseller Wholesale Price must be greater than ₹0.",
      });
    } else if (!isNaN(regPrice) && resPrice > regPrice) {
      errors.resellerPrice = "Wholesale price cannot be greater than retail price.";
      errorNotifications.push({
        id: "err-priceComparison",
        message: "Invalid Pricing: Reseller Wholesale Price cannot exceed Regular Retail Price.",
      });
    }

    // 6. Stock Quantity Validation (Required, >= 0)
    const stock = parseInt(formData.stockQuantity, 10);
    if (
      formData.stockQuantity === "" ||
      formData.stockQuantity === null ||
      formData.stockQuantity === undefined ||
      isNaN(stock)
    ) {
      errors.stockQuantity = "Stock quantity is required.";
      errorNotifications.push({
        id: "err-stockQuantity",
        message: "Missing Required Field: Stock Quantity is required.",
      });
    } else if (stock < 0) {
      errors.stockQuantity = "Stock quantity cannot be negative.";
      errorNotifications.push({
        id: "err-stockQuantity",
        message: "Invalid Field: Stock Quantity cannot be negative.",
      });
    }

    // 7. Minimum Order Quantity Validation (Optional, if entered must be >= 1)
    const moq = parseInt(formData.minOrderQuantity, 10);
    if (formData.minOrderQuantity !== "" && formData.minOrderQuantity !== null && !isNaN(moq) && moq < 1) {
      errors.minOrderQuantity = "Minimum order quantity must be at least 1.";
      errorNotifications.push({
        id: "err-minOrderQuantity",
        message: "Invalid Field: Minimum Order Quantity must be at least 1.",
      });
    }

    // 8. Product Image Validation (Required)
    if (!formData.mainImage || !formData.mainImage.trim()) {
      errors.mainImage = "Product image is required.";
      errorNotifications.push({
        id: "err-mainImage",
        message: "Missing Required Field: Product Image is required. Please upload or import an image.",
      });
    }

    // 9. Description Validation (Required, min 10 chars)
    const trimmedDesc = formData.description ? formData.description.trim() : "";
    if (!trimmedDesc) {
      errors.description = "Product description is required (min 10 characters).";
      errorNotifications.push({
        id: "err-description",
        message: "Missing Required Field: Product Description is required.",
      });
    } else if (trimmedDesc.length < 10) {
      errors.description = "Product description must be at least 10 characters.";
      errorNotifications.push({
        id: "err-description",
        message: "Invalid Field: Product Description must be at least 10 characters.",
      });
    }

    // Display ALL missing/invalid fields as individual toast notifications
    if (errorNotifications.length > 0) {
      setFormErrors(errors);
      errorNotifications.forEach((item) => {
        toast.error(item.message, { id: item.id, duration: 6000 });
      });
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    const payload = {
      name: trimmedName,
      sku: trimmedSku,
      slug: formData.slug ? formData.slug.trim() : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: formData.category,
      description: trimmedDesc,
      mainImage: formData.mainImage,
      regularPrice: regPrice,
      resellerPrice: resPrice,
      stockQuantity: stock,
      minOrderQuantity: moq || 1,
      isActive: formData.isActive,
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct._id, payload);
        toast.success(`Product "${payload.name}" updated successfully!`);
      } else {
        await productsApi.create(payload);
        toast.success(`New product "${payload.name}" created successfully!`);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error("Save product API error:", err);

      // Handle server-side validation error array or object
      if (err.errors) {
        const fieldLabels = {
          name: "Product Name",
          sku: "SKU",
          category: "Category",
          regularPrice: "Regular Retail Price",
          resellerPrice: "Reseller Wholesale Price",
          stockQuantity: "Stock Quantity",
          minOrderQuantity: "Minimum Order Quantity",
          mainImage: "Product Image",
          description: "Product Description",
        };

        const serverErrors = {};
        const errorsList = Array.isArray(err.errors)
          ? err.errors
          : Object.entries(err.errors).map(([field, val]) => ({
              field,
              message: typeof val === "string" ? val : val?.message || "Invalid value",
            }));

        errorsList.forEach((e) => {
          const fieldKey = e.field || e.path || "field";
          const label = fieldLabels[fieldKey] || fieldKey;
          const isMissing =
            e.message?.toLowerCase().includes("required") ||
            e.message?.toLowerCase().includes("missing") ||
            !formData[fieldKey];
          const prefix = isMissing ? "Missing Required Field" : "Validation Error";
          const errorMsg = `${prefix}: [${label}] - ${e.message}`;
          serverErrors[fieldKey] = e.message;
          toast.error(errorMsg, { id: `server-err-${fieldKey}`, duration: 6000 });
        });
        setFormErrors(serverErrors);
      } else if (err.code === "DUPLICATE_SKU" || err.message?.toLowerCase().includes("sku")) {
        setFormErrors((prev) => ({ ...prev, sku: err.message }));
        toast.error(`Duplicate SKU Error: ${err.message}`, { id: "err-duplicate-sku", duration: 6000 });
      } else {
        toast.error(err.message || "Failed to save product. Please check your inputs.", { duration: 6000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bulk Product Import
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      toast("Please paste JSON or CSV product data.", { icon: "⚠️" });
      return;
    }

    let parsedList = [];
    try {
      parsedList = JSON.parse(importJsonText);
      if (!Array.isArray(parsedList)) {
        throw new Error("JSON must be an array of product objects.");
      }
    } catch (parseErr) {
      toast.error("Invalid JSON format. Please verify the JSON array structure: " + parseErr.message);
      return;
    }

    setImporting(true);
    try {
      const res = await productsApi.bulkImport(parsedList);
      if (res.success) {
        toast.success(res.message || `Imported ${res.data?.importedCount} products!`);
        setShowImportModal(false);
        setImportJsonText("");
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || "Bulk import failed.");
    } finally {
      setImporting(false);
    }
  };

  const sampleImportJson = JSON.stringify(
    [
      {
        name: "Aura Pro Wireless Earbuds",
        sku: "GAD-AURA-01",
        category: "Gadgets",
        description: "Active Noise Cancellation with 32hr battery life.",
        mainImage: "/images/product-earbuds.jpg",
        regularPrice: 2499,
        resellerPrice: 1299,
        stockQuantity: 150,
        minOrderQuantity: 2,
      },
      {
        name: "Chronos Elite Sapphire Watch",
        sku: "WAT-CHRONO-02",
        category: "Watches",
        description: "Automatic movement with sapphire crystal glass and genuine leather strap.",
        mainImage: "/images/product-luxury-watch.jpg",
        regularPrice: 4999,
        resellerPrice: 2899,
        stockQuantity: 80,
        minOrderQuantity: 1,
      },
    ],
    null,
    2
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Product Catalog</h4>
          <p className="text-muted small mb-0">Manage wholesale and dropshipping products, inventory tiers, and pricing</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
            onClick={() => {
              setImportJsonText(sampleImportJson);
              setShowImportModal(true);
            }}
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Import Products</span>
          </button>
          <button className="btn-admin-primary" onClick={handleOpenAdd}>
            <i className="fa-solid fa-plus"></i>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm rounded-pill"
                placeholder="Search products by title or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-sm btn-dark rounded-pill px-3">
                Search
              </button>
            </form>
          </div>
          <div className="col-md-7 d-flex justify-content-md-end gap-2 flex-wrap">
            <div className="btn-group btn-group-sm">
              {["all", ...availableCategories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${selectedCategory === cat ? "btn-dark" : "btn-light border"}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table table align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Retail Price</th>
                <th>Reseller Price</th>
                <th>Profit Margin</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    Loading catalog inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const retail = prod.regularPricePaise / 100;
                  const reseller = prod.resellerPricePaise / 100;
                  const margin = retail > 0 ? (((retail - reseller) / retail) * 100).toFixed(1) : 0;
                  const isLowStock = prod.stockQuantity <= 15;

                  return (
                    <tr key={prod._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={prod.mainImage || "/images/product-earbuds.jpg"}
                            alt={prod.name}
                            className="rounded-3 border"
                            style={{ width: "44px", height: "44px", objectFit: "cover" }}
                          />
                          <div>
                            <div className="fw-bold text-dark">{prod.name}</div>
                            <span className="text-muted" style={{ fontSize: "11px" }}>
                              MOQ: {prod.minOrderQuantity || 1} units
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace">{prod.sku}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-muted border">{prod.category?.name || prod.category}</span>
                      </td>
                      <td className="fw-semibold text-muted">₹{retail.toLocaleString("en-IN")}</td>
                      <td className="fw-bold text-dark">₹{reseller.toLocaleString("en-IN")}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {margin}% Margin
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`fw-bold ${isLowStock ? "text-danger" : "text-dark"}`}>
                            {prod.stockQuantity}
                          </span>
                          {isLowStock && (
                            <span className="badge bg-danger text-white" style={{ fontSize: "10px" }}>
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {prod.isActive !== false ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">Archived</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-light border"
                            title="Edit Product"
                            onClick={() => handleOpenEdit(prod)}
                          >
                            <i className="fa-solid fa-pen text-primary"></i>
                          </button>
                          <button
                            className="btn btn-light border text-danger"
                            title="Delete / Archive Product"
                            onClick={() => handleDelete(prod._id, prod.name)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Showing page {page} of {pagination.pages} ({pagination.total} products)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-light border"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-light border"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <form onSubmit={handleSubmitForm} noValidate>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingProduct ? "Edit Product" : "Add New Wholesale Product"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-sm-8">
                      <label className="form-label small fw-semibold">
                        Product Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? "is-invalid border-danger" : ""}`}
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          clearError("name");
                        }}
                        placeholder="e.g. Wireless Noise-Cancelling Earbuds"
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.name}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-4">
                      <label className="form-label small fw-semibold">
                        SKU <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.sku ? "is-invalid border-danger" : ""}`}
                        value={formData.sku}
                        onChange={(e) => {
                          setFormData({ ...formData, sku: e.target.value.toUpperCase() });
                          clearError("sku");
                        }}
                        placeholder="e.g. GAD-AURA-01"
                      />
                      {formErrors.sku && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.sku}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.category ? "is-invalid border-danger" : ""}`}
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          clearError("category");
                        }}
                      >
                        <option value="">-- Select Category --</option>
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.category}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">
                        Regular Retail Price (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control ${formErrors.regularPrice ? "is-invalid border-danger" : ""}`}
                        value={formData.regularPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, regularPrice: e.target.value });
                          clearError("regularPrice");
                        }}
                        placeholder="e.g. 2499"
                      />
                      {formErrors.regularPrice && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.regularPrice}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">
                        Reseller Wholesale Price (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control ${formErrors.resellerPrice ? "is-invalid border-danger" : ""}`}
                        value={formData.resellerPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, resellerPrice: e.target.value });
                          clearError("resellerPrice");
                        }}
                        placeholder="e.g. 1499"
                      />
                      {formErrors.resellerPrice && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.resellerPrice}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label small fw-semibold">
                        Stock Quantity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${formErrors.stockQuantity ? "is-invalid border-danger" : ""}`}
                        value={formData.stockQuantity}
                        onChange={(e) => {
                          setFormData({ ...formData, stockQuantity: e.target.value });
                          clearError("stockQuantity");
                        }}
                      />
                      {formErrors.stockQuantity && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.stockQuantity}
                        </div>
                      )}
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label small fw-semibold">Min Order Qty (MOQ)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.minOrderQuantity}
                        onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })}
                      />
                    </div>

                    {/* Image Import & Backend Compression */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold d-flex justify-content-between align-items-center">
                        <span>
                          Product Image <span className="text-danger">*</span>
                        </span>
                        <span className="text-success small fw-semibold">
                          <i className="fa-solid fa-compress me-1"></i> Auto-Reduced in Backend (Sharp WebP)
                        </span>
                      </label>

                      {/* File Upload Box */}
                      <div
                        className={`border border-2 border-dashed rounded-3 p-3 text-center mb-2 ${
                          formErrors.mainImage ? "border-danger bg-danger-subtle" : ""
                        }`}
                        style={{
                          backgroundColor: formErrors.mainImage ? "#FEF2F2" : "#F9FAFB",
                          borderColor: formErrors.mainImage ? "#EF4444" : "#D1D5DB",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="productImageUpload"
                          className="d-none"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="productImageUpload"
                          className="d-block m-0"
                          style={{ cursor: uploadingImage ? "not-allowed" : "pointer" }}
                        >
                          {uploadingImage ? (
                            <div className="py-2 text-primary">
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              <span className="small fw-semibold">Importing & reducing image size in backend...</span>
                            </div>
                          ) : (
                            <div className="d-flex flex-column align-items-center gap-1 py-1">
                              <i className={`fa-solid fa-cloud-arrow-up ${formErrors.mainImage ? "text-danger" : "text-primary"} fs-3 mb-1`}></i>
                              <span className="small fw-bold text-dark">
                                Click to Import Image File (Auto-Compressed)
                              </span>
                              <span className="text-muted" style={{ fontSize: "11px" }}>
                                Supports JPG, PNG, WebP, HEIC up to 15MB — automatically resized & reduced to ~80KB
                              </span>
                            </div>
                          )}
                        </label>
                      </div>

                      {formErrors.mainImage && (
                        <div className="text-danger small mt-1 mb-2 fw-semibold">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.mainImage}
                        </div>
                      )}

                      {/* Image Preview & Compression Stats */}
                      {formData.mainImage && (
                        <div className="d-flex align-items-center gap-3 p-2 bg-light border rounded-3 mb-2">
                          <img
                            src={formData.mainImage}
                            alt="Preview"
                            className="rounded border"
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="small fw-semibold text-truncate">
                              {formData.mainImage.startsWith("data:")
                                ? "Optimized WebP Base64"
                                : formData.mainImage}
                            </div>
                            {uploadStats ? (
                              <div
                                className="badge bg-success-subtle text-success border border-success-subtle mt-1"
                                style={{ fontSize: "11px" }}
                              >
                                <i className="fa-solid fa-bolt me-1"></i>
                                {uploadStats.originalSizeFormatted} → {uploadStats.compressedSizeFormatted} (
                                {uploadStats.savingsPercent} smaller)
                              </div>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "11px" }}>
                                Current product image
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => {
                              setFormData({ ...formData, mainImage: "" });
                              setUploadStats(null);
                            }}
                            title="Remove image"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="activeSwitch"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="form-check-label fw-semibold small" htmlFor="activeSwitch">
                          Active in Storefront Catalog
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Product Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${formErrors.description ? "is-invalid border-danger" : ""}`}
                        rows="3"
                        placeholder="Provide details and features for resellers (minimum 10 characters)..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          clearError("description");
                        }}
                      ></textarea>
                      {formErrors.description && (
                        <div className="invalid-feedback d-block small">
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          {formErrors.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary rounded-pill px-4"
                    disabled={uploadingImage || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Product...
                      </>
                    ) : editingProduct ? (
                      "Save Changes"
                    ) : (
                      "Create Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Products Modal */}
      {showImportModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <form onSubmit={handleBulkImportSubmit}>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="fa-solid fa-file-import text-primary"></i>
                    <span>Bulk Import Products</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowImportModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small border-0 rounded-3 mb-3">
                    <i className="fa-solid fa-circle-info me-2"></i>
                    Paste a JSON array of products below. Each item requires <code>name</code> and <code>sku</code>. Prices are in Indian Rupees (₹).
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Product Data (JSON Array)</label>
                    <textarea
                      className="form-control font-monospace"
                      rows="10"
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder="Paste JSON array of products here..."
                      style={{ fontSize: "12px" }}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary rounded-pill px-4 d-flex align-items-center gap-2"
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Importing Catalog...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Start Import</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
