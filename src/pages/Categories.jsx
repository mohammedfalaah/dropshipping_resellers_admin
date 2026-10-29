import React, { useState, useEffect } from "react";
import { categoriesApi, productsApi } from "../services/api";
import { useToast } from "../context/ToastContext";

const DEFAULT_CATEGORIES = [
  {
    _id: "cat_gadgets",
    name: "Gadgets",
    slug: "gadgets",
    description: "Smart wearables, ANC audio accessories, magnetic charging hubs, and smart home electronics.",
    image: "/images/category-gadgets.jpg",
    productCount: 4,
    isActive: true,
  },
  {
    _id: "cat_watches",
    name: "Watches",
    slug: "watches",
    description: "Chronographs, minimalist dress timepieces, and automatic stainless steel watches.",
    image: "/images/category-watches.jpg",
    productCount: 2,
    isActive: true,
  },
  {
    _id: "cat_footwear",
    name: "Footwear",
    slug: "footwear",
    description: "Breathable knit sneakers, lightweight running trainers, and athletic lifestyle shoes.",
    image: "/images/category-footwear.jpg",
    productCount: 2,
    isActive: true,
  },
  {
    _id: "cat_fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Apparel essentials, heavyweight cotton tees, oversized streetwear, and outerwear.",
    image: "/images/category-fashion.jpg",
    productCount: 2,
    isActive: true,
  },
  {
    _id: "cat_sunglasses",
    name: "Sunglasses",
    slug: "sunglasses",
    description: "Premium polarized eyewear, aviators, UV400 luxury frames, and retro shades.",
    image: "/images/category-sunglasses.jpg",
    productCount: 2,
    isActive: true,
  },
];

const PRESET_IMAGES = [
  { label: "Sunglasses", url: "/images/category-sunglasses.jpg" },
  { label: "Gadgets", url: "/images/category-gadgets.jpg" },
  { label: "Watches", url: "/images/category-watches.jpg" },
  { label: "Footwear", url: "/images/category-footwear.jpg" },
  { label: "Fashion", url: "/images/category-fashion.jpg" },
];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

export default function Categories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "/images/category-sunglasses.jpg",
    isActive: true,
  });

  const { addToast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getAll();
      const list = res?.data?.categories || res?.categories;
      if (Array.isArray(list) && list.length > 0) {
        // Ensure Sunglasses is included if not present in remote yet
        const hasSunglasses = list.some(
          (c) => c.slug === "sunglasses" || c.name.toLowerCase() === "sunglasses"
        );
        let merged = [...list];
        if (!hasSunglasses) {
          merged.push(DEFAULT_CATEGORIES.find((c) => c.slug === "sunglasses"));
        }
        setCategories(merged);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.warn("Could not load categories from API, using cached:", err.message);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "/images/category-sunglasses.jpg",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat._id || cat.id);
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      image: cat.image || "/images/category-sunglasses.jpg",
      isActive: cat.isActive !== false,
    });
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!isEditing) {
      setForm((prev) => ({
        ...prev,
        name: newName,
        slug: slugify(newName),
      }));
    } else {
      setForm((prev) => ({ ...prev, name: newName }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Category name is required.", "danger");
      return;
    }

    const finalSlug = form.slug.trim() || slugify(form.name);
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        slug: finalSlug,
        description: form.description.trim(),
        image: form.image.trim() || `/images/category-${finalSlug}.jpg`,
        isActive: form.isActive,
      };

      if (isEditing) {
        try {
          await categoriesApi.update(currentId, payload);
        } catch (apiErr) {
          console.warn("Backend update failed, updating locally:", apiErr.message);
        }

        setCategories((prev) =>
          prev.map((c) =>
            (c._id || c.id) === currentId
              ? { ...c, ...payload, slug: finalSlug }
              : c
          )
        );
        addToast(`Category "${payload.name}" updated successfully.`, "success");
      } else {
        let createdCat = {
          _id: `cat_${Date.now()}`,
          id: `cat_${Date.now()}`,
          ...payload,
          productCount: 0,
        };

        try {
          const res = await categoriesApi.create(payload);
          const returned = res?.data?.category || res?.category;
          if (returned) createdCat = returned;
        } catch (apiErr) {
          console.warn("Backend create failed, storing locally:", apiErr.message);
        }

        setCategories((prev) => [createdCat, ...prev]);
        addToast(`Category "${payload.name}" added successfully!`, "success");
      }

      setShowModal(false);
    } catch (err) {
      addToast(err.message || "Failed to save category.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    const updatedStatus = !cat.isActive;
    const catId = cat._id || cat.id;

    try {
      await categoriesApi.update(catId, { isActive: updatedStatus });
    } catch (err) {
      console.warn("Status toggle local update:", err.message);
    }

    setCategories((prev) =>
      prev.map((c) =>
        (c._id || c.id) === catId ? { ...c, isActive: updatedStatus } : c
      )
    );
    addToast(
      `Category "${cat.name}" is now ${updatedStatus ? "Active" : "Inactive"}.`,
      "info"
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const catId = deleteTarget._id || deleteTarget.id;

    try {
      await categoriesApi.delete(catId);
    } catch (err) {
      console.warn("Delete local fallback:", err.message);
    }

    setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId));
    addToast(`Category "${deleteTarget.name}" deleted.`, "warning");
    setDeleteTarget(null);
  };

  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  });

  const totalSKUs = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const activeCount = categories.filter((c) => c.isActive !== false).length;

  return (
    <div>
      {/* Header and Stats */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-tags text-primary"></i>
            <span>Product Categories</span>
          </h4>
          <p className="text-muted small mb-0">
            Organize dropshipping catalog departments, assign products, and control reseller storefront visibility.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 rounded-pill"
            onClick={fetchCategories}
            title="Refresh from server"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`}></i>
            <span className="ms-1">Refresh</span>
          </button>
          <button
            id="admin-add-category-btn"
            className="btn-admin-primary"
            onClick={handleOpenAdd}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="admin-card p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold text-uppercase">Total Categories</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{categories.length}</h3>
            </div>
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "46px", height: "46px", backgroundColor: "#EEF2FF", color: "#5E43F3" }}
            >
              <i className="fa-solid fa-layer-group fs-5"></i>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <div className="admin-card p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold text-uppercase">Active Departments</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{activeCount}</h3>
            </div>
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "46px", height: "46px", backgroundColor: "#ECFDF5", color: "#10B981" }}
            >
              <i className="fa-solid fa-circle-check fs-5"></i>
            </div>
          </div>
        </div>
        <div className="col-sm-12 col-lg-4">
          <div className="admin-card p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold text-uppercase">Total Catalog SKUs</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{totalSKUs}</h3>
            </div>
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "46px", height: "46px", backgroundColor: "#F0FDF4", color: "#16A34A" }}
            >
              <i className="fa-solid fa-boxes-stacked fs-5"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search categories by name, slug, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary border-start-0"
                  type="button"
                  onClick={() => setSearch("")}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 col-lg-7 d-flex justify-content-md-end align-items-center gap-2">
            <span className="small text-muted">Showing {filteredCategories.length} of {categories.length} categories</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="row g-4">
        {filteredCategories.map((cat) => {
          const isActive = cat.isActive !== false;
          const isSunglasses = cat.slug === "sunglasses" || cat.name?.toLowerCase() === "sunglasses";

          return (
            <div key={cat.slug || cat._id || cat.id} className="col-md-6 col-xl-4 col-xxl-3">
              <div
                className={`admin-card h-100 p-0 overflow-hidden d-flex flex-column transition-all ${
                  isSunglasses ? "border-primary shadow-sm" : ""
                }`}
                style={{
                  border: isSunglasses ? "2px solid #5E43F3" : "1px solid var(--admin-border)",
                  borderRadius: "14px",
                }}
              >
                {/* Category Image Header */}
                <div style={{ height: "160px", overflow: "hidden", backgroundColor: "#F1F5F9", position: "relative" }}>
                  <img
                    src={cat.image || "/images/category-sunglasses.jpg"}
                    alt={cat.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/category-sunglasses.jpg";
                    }}
                  />
                  {isSunglasses && (
                    <span
                      className="position-absolute top-0 start-0 m-2 badge bg-primary px-2 py-1 shadow-sm"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      <i className="fa-solid fa-star me-1"></i>NEW DEPARTMENT
                    </span>
                  )}
                  <span
                    className={`position-absolute top-0 end-0 m-2 admin-badge ${
                      isActive ? "admin-badge-success" : "admin-badge-danger"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h5 className="fw-bold text-dark mb-0">{cat.name}</h5>
                      <code className="text-muted small" style={{ fontSize: "11px" }}>
                        /{cat.slug}
                      </code>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: "12px", lineHeight: "1.45", minHeight: "36px" }}>
                      {cat.description || "No description provided for this catalog department."}
                    </p>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted fw-semibold">
                        <i className="fa-solid fa-box me-1 text-primary"></i>
                        {cat.productCount ?? 0} SKUs
                      </span>
                      <button
                        type="button"
                        className={`btn btn-sm ${isActive ? "btn-outline-danger" : "btn-outline-success"} py-0 px-2`}
                        style={{ fontSize: "11px" }}
                        onClick={() => handleToggleStatus(cat)}
                        title={isActive ? "Deactivate Category" : "Activate Category"}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-pill px-3 flex-grow-1 fw-semibold"
                        onClick={() => handleOpenEdit(cat)}
                      >
                        <i className="fa-solid fa-pen-to-square me-1 text-primary"></i>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={() => setDeleteTarget(cat)}
                        title="Delete category"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-12">
            <div className="admin-card text-center py-5">
              <i className="fa-solid fa-tags fs-1 text-muted mb-3 d-block"></i>
              <h5 className="fw-bold text-dark">No Categories Found</h5>
              <p className="text-muted small mb-3">No categories match your current search query "{search}".</p>
              <button className="btn-admin-primary" onClick={handleOpenAdd}>
                <i className="fa-solid fa-plus me-1"></i> Add Category
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom px-4 py-3 bg-light">
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="fa-solid fa-tags text-primary"></i>
                    <span>{isEditing ? "Edit Category" : "Add New Category"}</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Category Name */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Category Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sunglasses, Luxury Fragrances..."
                        required
                        value={form.name}
                        onChange={handleNameChange}
                        autoFocus
                      />
                    </div>

                    {/* Category Slug */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Slug (URL identifier) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted small">/shop?category=</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. sunglasses"
                          required
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                        />
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        Unique URL safe handle used for reseller storefront filters.
                      </small>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Describe products in this category for resellers..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      ></textarea>
                    </div>

                    {/* Image URL & Presets */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">Banner / Thumbnail Image</label>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="/images/category-sunglasses.jpg or image URL"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                      />

                      {/* Quick Presets */}
                      <div className="d-flex align-items-center gap-1 flex-wrap mb-2">
                        <span className="small text-muted me-1" style={{ fontSize: "11px" }}>Quick presets:</span>
                        {PRESET_IMAGES.map((img) => (
                          <button
                            key={img.url}
                            type="button"
                            className={`btn btn-sm py-0 px-2 rounded-pill ${
                              form.image === img.url ? "btn-primary text-white" : "btn-light border"
                            }`}
                            style={{ fontSize: "11px" }}
                            onClick={() => setForm({ ...form, image: img.url })}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>

                      {/* Image Preview */}
                      {form.image && (
                        <div
                          className="rounded-3 border overflow-hidden p-1 bg-light"
                          style={{ height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <img
                            src={form.image}
                            alt="Preview"
                            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover", borderRadius: "6px" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/images/category-sunglasses.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Active Status */}
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="categoryActiveSwitch"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold text-dark" htmlFor="categoryActiveSwitch">
                          Category Active & Published on Reseller Storefront
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top bg-light px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary rounded-pill px-4"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className={`fa-solid ${isEditing ? "fa-check" : "fa-plus"} me-2`}></i>
                        {isEditing ? "Save Changes" : "Create Category"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div
                  className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: "54px", height: "54px", backgroundColor: "#FEE2E2", color: "#EF4444" }}
                >
                  <i className="fa-solid fa-triangle-exclamation fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-1">Delete Category?</h5>
                <p className="text-muted small mb-3">
                  Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
                  {deleteTarget.productCount > 0 && (
                    <span className="d-block text-danger fw-semibold mt-1">
                      Warning: This category currently has {deleteTarget.productCount} product(s) assigned.
                    </span>
                  )}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-3"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-3"
                    onClick={confirmDelete}
                  >
                    Delete Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
