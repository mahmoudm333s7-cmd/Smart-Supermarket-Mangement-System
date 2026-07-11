"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Plus, Search, Edit2, Trash2, AlertTriangle, Eye } from "lucide-react";

export default function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [brand, setBrand] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [purchasePriceCarton, setPurchasePriceCarton] = useState(0);
  const [piecesPerCarton, setPiecesPerCarton] = useState(1);
  const [sellingPricePiece, setSellingPricePiece] = useState(0);
  const [sellingPriceCarton, setSellingPriceCarton] = useState(0);
  const [currentCartons, setCurrentCartons] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll({ 
        search: search || undefined, 
        category: category || undefined 
      });
      setProducts(data);
      
      // Extract unique categories for filtering
      const uniqueCats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
      setCategories(uniqueCats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, category]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setCategoryInput("");
    setBrand("");
    setImageInput("");
    setPurchasePriceCarton(0);
    setPiecesPerCarton(1);
    setSellingPricePiece(0);
    setSellingPriceCarton(0);
    setCurrentCartons(0);
    setMinimumStock(5);
    setNotes("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryInput(p.category || "");
    setBrand(p.brand || "");
    setImageInput(p.image_url || "");
    setPurchasePriceCarton(p.purchase_price_carton);
    setPiecesPerCarton(p.pieces_per_carton);
    setSellingPricePiece(p.selling_price_piece);
    setSellingPriceCarton(p.selling_price_carton);
    setCurrentCartons(p.current_cartons);
    setMinimumStock(p.minimum_stock);
    setNotes(p.notes || "");
    setError("");
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج؟")) return;
    try {
      await api.products.delete(id);
      loadProducts();
    } catch (err: any) {
      alert(err.message || "فشل حذف المنتج");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (piecesPerCarton <= 0) {
      setError("عدد القطع في الكرتونة يجب أن يكون أكبر من الصفر");
      return;
    }

    const payload = {
      name,
      category: categoryInput || null,
      brand: brand || null,
      image_url: imageInput || null,
      purchase_price_carton: Number(purchasePriceCarton),
      pieces_per_carton: Number(piecesPerCarton),
      selling_price_piece: Number(sellingPricePiece),
      selling_price_carton: Number(sellingPriceCarton),
      current_cartons: Number(currentCartons),
      minimum_stock: Number(minimumStock),
      notes: notes || null,
    };

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message || "فشل حفظ المنتج");
    }
  };

  // Helper Calculations for Modal UI feedback
  const pieceCost = purchasePriceCarton / (piecesPerCarton || 1);
  const profitPerPiece = sellingPricePiece - pieceCost;
  const cartonCost = purchasePriceCarton;
  const profitPerCarton = sellingPriceCarton - cartonCost;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المنتجات والمخزون</h1>
          <p className="text-sm text-muted-foreground">عرض وتعديل وإضافة منتجات السوبر ماركت</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث باسم المنتج أو الماركة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pr-10 pl-4 text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-foreground outline-none focus:border-primary"
        >
          <option value="">جميع التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-sm font-semibold text-muted-foreground">
                <th className="p-4">المنتج</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">سعر الكرتونة</th>
                <th className="p-4">سعر الحبة</th>
                <th className="p-4">المخزون (كرتونة)</th>
                <th className="p-4">القطع الإجمالية</th>
                <th className="p-4">ربح الحبة</th>
                <th className="p-4">حالة المخزون</th>
                <th className="p-4 text-left">خيارات</th>
              </tr>
            </thead>
            <tbody className="text-sm text-foreground divide-y divide-border/40">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold">{p.name} {p.brand && <span className="text-xs text-muted-foreground">({p.brand})</span>}</td>
                  <td className="p-4 text-muted-foreground">{p.category || "-"}</td>
                  <td className="p-4">{p.purchase_price_carton} ج.م</td>
                  <td className="p-4">{p.selling_price_piece} ج.م</td>
                  <td className="p-4 font-bold">{p.current_cartons}</td>
                  <td className="p-4 text-muted-foreground">{p.total_pieces} حبة</td>
                  <td className="p-4 text-success">{p.profit_per_piece} ج.م</td>
                  <td className="p-4">
                    {p.stock_status === "LOW" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        منخفض
                      </span>
                    ) : (
                      <span className="rounded bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                        كافي
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-left space-x-2 space-x-reverse">
                    <button onClick={() => handleOpenEdit(p)} className="inline-flex p-1.5 hover:text-primary transition">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="inline-flex p-1.5 hover:text-destructive transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">لا توجد منتجات مطابقة للمواصفات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingProduct ? "تعديل بيانات منتج" : "إضافة منتج جديد للمخزن"}
            </h2>
            
            {error && (
              <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم المنتج</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">التصنيف</label>
                  <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} placeholder="مثال: ألبان، مشروبات" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">العلامة التجارية / الماركة</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">رابط صورة المنتج (اختياري)</label>
                  <input type="text" value={imageInput} onChange={(e) => setImageInput(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>
              </div>

              <div className="border-t border-border/40 my-4 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">حسابات المخزون والتكلفة</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">سعر كرتونة الشراء</label>
                    <input type="number" step="any" required value={purchasePriceCarton} onChange={(e) => setPurchasePriceCarton(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">عدد القطع بالكرتونة</label>
                    <input type="number" required value={piecesPerCarton} onChange={(e) => setPiecesPerCarton(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">الكمية الحالية بالكرتونة</label>
                    <input type="number" step="any" required value={currentCartons} onChange={(e) => setCurrentCartons(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">سعر بيع الحبة</label>
                    <input type="number" step="any" required value={sellingPricePiece} onChange={(e) => setSellingPricePiece(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">سعر بيع الكرتونة</label>
                    <input type="number" step="any" required value={sellingPriceCarton} onChange={(e) => setSellingPriceCarton(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">حد المخزون الأدنى (كرتونة)</label>
                    <input type="number" required value={minimumStock} onChange={(e) => setMinimumStock(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* Real-time Math Summary Feedback */}
              <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-4 text-sm grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">تكلفة الحبة الواحدة:</p>
                  <p className="font-bold text-foreground">{pieceCost ? pieceCost.toFixed(2) : 0} جنيه</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صافي ربح الحبة الواحدة:</p>
                  <p className={`font-bold ${profitPerPiece >= 0 ? "text-success" : "text-destructive"}`}>
                    {profitPerPiece ? profitPerPiece.toFixed(2) : 0} جنيه
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صافي ربح الكرتونة الواحدة:</p>
                  <p className={`font-bold ${profitPerCarton >= 0 ? "text-success" : "text-destructive"}`}>
                    {profitPerCarton ? profitPerCarton.toFixed(2) : 0} جنيه
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي قيمة مخزون المنتج:</p>
                  <p className="font-bold text-primary">
                    {(currentCartons * purchasePriceCarton).toFixed(2)} جنيه
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات المنتج</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                <button type="submit" className="rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
