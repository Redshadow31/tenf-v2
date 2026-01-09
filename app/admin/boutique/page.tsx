"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Save, AlertCircle, CheckCircle2, Tag } from "lucide-react";
import type { ShopProduct, ShopCategory } from "@/app/api/admin/shop/products/route";

export default function BoutiqueAdminPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  
  // Product form
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
    images: [""],
    featured: false,
  });

  // Category form
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#8B5CF6", // Purple default
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/shop/products");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  // Product functions
  async function handleCreateProduct() {
    if (!productForm.name || !productForm.price || !productForm.categoryId) {
      setError("Tous les champs requis doivent être remplis");
      return;
    }

    if (productForm.images.filter(img => img.trim()).length === 0) {
      setError("Au moins une image est requise");
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/admin/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          images: productForm.images.filter(img => img.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      setSuccess("Produit créé avec succès !");
      setIsAddingProduct(false);
      resetProductForm();
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err.message || "Erreur lors de la création");
    }
  }

  async function handleUpdateProduct() {
    if (!editingProduct) return;

    try {
      setError(null);
      const response = await fetch("/api/admin/shop/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          ...productForm,
          price: parseFloat(productForm.price),
          images: productForm.images.filter(img => img.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      setSuccess("Produit mis à jour avec succès !");
      setEditingProduct(null);
      resetProductForm();
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err.message || "Erreur lors de la mise à jour");
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/shop/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      setSuccess("Produit supprimé avec succès !");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError(err.message || "Erreur lors de la suppression");
    }
  }

  function startEditProduct(product: ShopProduct) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      categoryId: product.categoryId,
      images: product.images.length > 0 ? product.images : [""],
      featured: product.featured,
    });
    setIsAddingProduct(true);
  }

  // Category functions
  async function handleCreateCategory() {
    if (!categoryForm.name || !categoryForm.color) {
      setError("Tous les champs doivent être remplis");
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/admin/shop/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      setSuccess("Catégorie créée avec succès !");
      setIsAddingCategory(false);
      setCategoryForm({ name: "", color: "#8B5CF6" });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error creating category:", err);
      setError(err.message || "Erreur lors de la création");
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory) return;

    try {
      setError(null);
      const response = await fetch("/api/admin/shop/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          ...categoryForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      setSuccess("Catégorie mise à jour avec succès !");
      setEditingCategory(null);
      setCategoryForm({ name: "", color: "#8B5CF6" });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating category:", err);
      setError(err.message || "Erreur lors de la mise à jour");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/shop/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      setSuccess("Catégorie supprimée avec succès !");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setError(err.message || "Erreur lors de la suppression");
    }
  }

  function startEditCategory(category: ShopCategory) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color,
    });
    setIsAddingCategory(true);
  }

  function resetProductForm() {
    setProductForm({
      name: "",
      price: "",
      description: "",
      categoryId: "",
      images: [""],
      featured: false,
    });
    setEditingProduct(null);
  }

  function addImageField() {
    if (productForm.images.length < 6) {
      setProductForm({ ...productForm, images: [...productForm.images, ""] });
    }
  }

  function removeImageField(index: number) {
    setProductForm({
      ...productForm,
      images: productForm.images.filter((_, i) => i !== index),
    });
  }

  function updateImageField(index: number, value: string) {
    const newImages = [...productForm.images];
    newImages[index] = value;
    setProductForm({ ...productForm, images: newImages });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Gestion des annonces
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Gérez les produits et catégories de la boutique
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#10b981' }}>
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => {
            setActiveTab("products");
            setIsAddingProduct(false);
            resetProductForm();
          }}
          className="px-4 py-2 font-medium transition-colors relative"
          style={{
            color: activeTab === "products" ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          Produits
          {activeTab === "products" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-primary)' }} />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("categories");
            setIsAddingCategory(false);
            setCategoryForm({ name: "", color: "#8B5CF6" });
            setEditingCategory(null);
          }}
          className="px-4 py-2 font-medium transition-colors relative"
          style={{
            color: activeTab === "categories" ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          Catégories
          {activeTab === "categories" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-primary)' }} />
          )}
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Add/Edit Product Form */}
          {isAddingProduct && (
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {editingProduct ? "Modifier le produit" : "Créer un produit"}
                </h2>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    resetProductForm();
                  }}
                  className="p-2 rounded-lg hover:bg-opacity-10"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="T-shirt TENF"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Prix (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      placeholder="20.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Catégorie *
                    </label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    rows={3}
                    placeholder="Description du produit..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      Images (max 6) *
                    </label>
                    {productForm.images.length < 6 && (
                      <button
                        onClick={addImageField}
                        className="text-sm px-3 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                      >
                        + Ajouter
                      </button>
                    )}
                  </div>
                  {productForm.images.map((image, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateImageField(index, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        placeholder="https://exemple.com/image.jpg"
                      />
                      {productForm.images.length > 1 && (
                        <button
                          onClick={() => removeImageField(index)}
                          className="p-2 rounded-lg hover:bg-opacity-10"
                          style={{ color: '#dc2626' }}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="featured" className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Produit en vedette
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Save className="w-4 h-4" />
                    {editingProduct ? "Enregistrer" : "Créer"}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingProduct(false);
                      resetProductForm();
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Produits ({products.length})
              </h2>
              {!isAddingProduct && (
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                  Créer un produit
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Aucun produit trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Produit</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Catégorie</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Prix</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Vedette</th>
                      <th className="text-right py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      return (
                        <tr
                          key={product.id}
                          className="border-b transition-colors"
                          style={{ borderColor: 'var(--color-border)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                              )}
                              <div>
                                <div className="font-medium" style={{ color: 'var(--color-text)' }}>{product.name}</div>
                                <div className="text-xs line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {category ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }} />
                                <span className="text-sm" style={{ color: 'var(--color-text)' }}>{category.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>Aucune</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm" style={{ color: 'var(--color-text)' }}>
                            €{product.price.toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            {product.featured ? (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                                Oui
                              </span>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Non</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEditProduct(product)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: '#dc2626', color: 'white' }}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Add/Edit Category Form */}
          {isAddingCategory && (
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {editingCategory ? "Modifier la catégorie" : "Créer une catégorie"}
                </h2>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setCategoryForm({ name: "", color: "#8B5CF6" });
                    setEditingCategory(null);
                  }}
                  className="p-2 rounded-lg hover:bg-opacity-10"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Nom de la catégorie *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="Vêtements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Couleur *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-20 h-12 rounded-lg border cursor-pointer"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                    <input
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg border font-mono"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      placeholder="#8B5CF6"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                    <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{ backgroundColor: categoryForm.color, borderColor: 'var(--color-border)' }}>
                      <Tag className="w-6 h-6" style={{ color: categoryForm.color === '#ffffff' || categoryForm.color === '#FFFFFF' ? '#000' : '#fff' }} />
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Format hexadécimal (ex: #8B5CF6)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Save className="w-4 h-4" />
                    {editingCategory ? "Enregistrer" : "Créer"}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setCategoryForm({ name: "", color: "#8B5CF6" });
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Catégories ({categories.length})
              </h2>
              {!isAddingCategory && (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                  Créer une catégorie
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Aucune catégorie trouvée. Créez-en une pour commencer.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {categories.map((category) => {
                  const productsCount = products.filter(p => p.categoryId === category.id).length;
                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border p-4 transition-colors"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: category.color }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color }}>
                            <Tag className="w-5 h-5" style={{ color: category.color === '#ffffff' || category.color === '#FFFFFF' ? '#000' : '#fff' }} />
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{category.name}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {productsCount} produit{productsCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-mono" style={{ color: category.color }}>
                        {category.color}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}