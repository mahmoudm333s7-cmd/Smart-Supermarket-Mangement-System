"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Plus, Search, Trash2, Save, ShoppingBag, PlusCircle } from "lucide-react";

export default function PurchasesView() {
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Items State (multi-item purchase)
  const [items, setItems] = useState<any[]>([
    { product_id: "", quantity_cartons: 1, price_per_carton: 0 }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const prods = await api.products.getAll();
      const purchs = await api.purchases.getAll();
      setProducts(prods);
      setPurchases(purchs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSupplier("");
    setInvoiceNumber("");
    setNotes("");
    setItems([{ product_id: "", quantity_cartons: 1, price_per_carton: 0 }]);
    setError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: "", quantity_cartons: 1, price_per_carton: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    
    // Auto-fill price_per_carton when product is selected
    if (field === "product_id" && value) {
      const prod = products.find((p) => p.id === Number(value));
      if (prod) {
        newItems[idx]["price_per_carton"] = prod.purchase_price_carton;
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity_cartons * item.price_per_carton), 0);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Verify all rows have products selected
    const invalid = items.some((item) => !item.product_id || item.quantity_cartons <= 0 || item.price_per_carton < 0);
    if (invalid) {
      setError("يرجى التأكد من تعبئة جميع الأسطر واختيار المنتجات بكميات وأسعار صحيحة");
      return;
    }

    const payload = {
      supplier,
      invoice_number: invoiceNumber,
      notes: notes || undefined,
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity_cartons: Number(item.quantity_cartons),
        price_per_carton: Number(item.price_per_carton)
      }))
    };

    try {
      await api.purchases.create(payload);
      setSuccessMsg("تم تسجيل فاتورة المشتريات وتحديث المخزون بنجاح!");
      setTimeout(() => {
        setShowModal(false);
        loadData();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل المشتريات");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المشتريات (الموردين)</h1>
          <p className="text-sm text-muted-foreground">تسجيل فواتير الشراء لزيادة مخزون المنتجات وتحديث رصيد الخزينة</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          تسجيل فاتورة توريد
        </button>
      </div>

      {/* History table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-sm font-semibold text-muted-foreground">
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">اسم المورد</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">عدد المنتجات</th>
                <th className="p-4">إجمالي التكلفة</th>
                <th className="p-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="text-sm text-foreground divide-y divide-border/40">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold text-primary">{p.invoice_number}</td>
                  <td className="p-4">{p.supplier}</td>
                  <td className="p-4 text-muted-foreground">{new Date(p.purchase_date).toLocaleString("ar-EG")}</td>
                  <td className="p-4">{p.items.length} منتجات</td>
                  <td className="p-4 font-bold text-destructive">-{p.total_amount} ج.م</td>
                  <td className="p-4 text-muted-foreground">{p.notes || "-"}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد عمليات توريد مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">تسجيل فاتورة توريد جديدة</h2>
            </div>
            
            {successMsg ? (
              <div className="rounded bg-success/10 p-3 text-center text-success border border-success/20 font-bold mb-4">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSavePurchase} className="space-y-4">
                {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم المورد</label>
                    <input type="text" required value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="مثال: شركة بيبسي" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">رقم الفاتورة الورقية</label>
                    <input type="text" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="رقم فاتورة المورد" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Items Dynamic Rows */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">قائمة السلع الموردة</h3>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      إضافة سطر منتج
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] text-muted-foreground mb-1">المنتج</label>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-sm outline-none"
                          >
                            <option value="">-- اختر منتج --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.current_cartons} كرتونة حالياً)</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] text-muted-foreground mb-1">الكمية (كرتونة)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={item.quantity_cartons}
                            onChange={(e) => handleItemChange(idx, "quantity_cartons", Number(e.target.value))}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] text-muted-foreground mb-1">سعر شراء الكرتونة</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={item.price_per_carton}
                            onChange={(e) => handleItemChange(idx, "price_per_carton", Number(e.target.value))}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="bg-destructive/10 hover:bg-destructive/20 text-destructive p-2 rounded mb-[1px]"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">التكلفة الكلية للفاتورة:</p>
                    <p className="text-lg font-bold text-destructive">{calculateTotal().toFixed(2)} جنيه</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">بيان إضافي / ملاحظات</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: تسليم المستودع" className="w-48 rounded border border-border bg-background px-3 py-2 text-foreground outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                  <button type="submit" className="rounded bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">حفظ الفاتورة</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
