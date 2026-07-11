"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Search, ShoppingCart, Trash2, UserPlus, Save, DollarSign } from "lucide-react";

export default function SalesView() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [saleType, setSaleType] = useState("CASH"); // CASH or CREDIT
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // Quick Customer Creation inline state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadInitialData = async () => {
    try {
      const prods = await api.products.getAll();
      const custs = await api.customers.getAll();
      setProducts(prods);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const addToCart = (product: any) => {
    const totalAvailable = product.total_pieces;
    if (totalAvailable <= 0) {
      alert("المنتج نافد من المخزن ولا يمكن بيعه!");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity_pieces;
      if (currentQty >= totalAvailable) {
        alert("الكمية المطلوبة تتعدى المتوفر في المخزن!");
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity_pieces += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price_per_piece: product.selling_price_piece,
          quantity_pieces: 1,
          max_available: totalAvailable
        }
      ]);
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.max_available) {
      alert("الكمية المطلوبة تتعدى المتوفر في المخزن!");
      return;
    }
    const updatedCart = [...cart];
    updatedCart[index].quantity_pieces = newQty;
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_per_piece * item.quantity_pieces), 0);

  const handleCheckoutOpen = () => {
    if (cart.length === 0) {
      alert("السلة فارغة!");
      return;
    }
    setSaleType("CASH");
    setPaidAmount(cartTotal);
    setSelectedCustomerId("");
    setDueDate("");
    setNotes("");
    setError("");
    setSuccessMsg("");
    setShowCheckout(true);
  };

  const handleQuickCustomerCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;
    try {
      const newCust = await api.customers.create({ name: newCustName, phone: newCustPhone || null });
      // Reload customers and select the newly created customer
      const custs = await api.customers.getAll();
      setCustomers(custs);
      setSelectedCustomerId(newCust.id);
      setShowAddCustomer(false);
      setNewCustName("");
      setNewCustPhone("");
    } catch (err: any) {
      alert("فشل إضافة العميل السريع: " + err.message);
    }
  };

  const handleSaveSale = async () => {
    setError("");
    if (saleType === "CREDIT" && !selectedCustomerId) {
      setError("يرجى اختيار عميل للمبيعات الآجلة");
      return;
    }

    const payload = {
      customer_id: saleType === "CREDIT" ? Number(selectedCustomerId) : undefined,
      paid_amount: saleType === "CASH" ? cartTotal : Number(paidAmount),
      sale_type: saleType,
      due_date: saleType === "CREDIT" && dueDate ? dueDate : undefined,
      notes: notes || undefined,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity_pieces: item.quantity_pieces,
        price_per_piece: item.price_per_piece
      }))
    };

    try {
      await api.sales.create(payload);
      setSuccessMsg("تم تسجيل عملية البيع بنجاح!");
      setCart([]);
      setTimeout(() => {
        setShowCheckout(false);
        loadInitialData();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الفاتورة");
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-300">
      {/* Products list selection */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">واجهة البيع السريع (نقطة بيع)</h2>
            <span className="text-xs text-muted-foreground">اضغط على المنتج لإضافته للسلة</span>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث عن منتج بالاسم أو القسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-4 text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const outOfStock = p.total_pieces <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={outOfStock}
                  className={`flex flex-col text-right justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-muted/10 transition group hover:border-primary/40 ${outOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <div>
                    <p className="font-semibold text-foreground truncate text-sm">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.category || "عام"}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between w-full">
                    <span className="text-sm font-bold text-primary">{p.selling_price_piece} ج.م</span>
                    <span className="text-[10px] text-muted-foreground">المتوفر: {p.total_pieces}</span>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-12">لا توجد نتائج مطابقة</p>
            )}
          </div>
        </div>
      </div>

      {/* Cart side block */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between h-[600px] shadow-lg">
        <div>
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">سلة المشتريات</h2>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
            {cart.map((item, index) => (
              <div key={item.product_id} className="flex items-center justify-between border-b border-border/40 pb-3 text-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.price_per_piece} ج.م للقطعة</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity_pieces}
                    onChange={(e) => updateQuantity(index, Number(e.target.value))}
                    className="w-14 rounded border border-border bg-background py-1 text-center text-foreground outline-none"
                  />
                  <button onClick={() => removeFromCart(index)} className="text-muted-foreground hover:text-destructive p-1 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">السلة فارغة حالياً</p>
            )}
          </div>
        </div>

        {/* Pricing Actions */}
        <div className="border-t border-border pt-4 mt-4 space-y-4">
          <div className="flex justify-between text-base font-bold">
            <span className="text-muted-foreground">الإجمالي الكلي:</span>
            <span className="text-primary text-xl">{cartTotal.toFixed(2)} ج.م</span>
          </div>

          <button
            onClick={handleCheckoutOpen}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
          >
            إتمام الفاتورة والدفع
          </button>
        </div>
      </div>

      {/* Checkout Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">خيارات سداد الفاتورة</h2>
            
            {successMsg ? (
              <div className="rounded bg-success/10 p-3 text-center text-success border border-success/20 font-bold mb-4">
                {successMsg}
              </div>
            ) : (
              <div className="space-y-4">
                {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
                
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-2 border border-border rounded p-1 bg-background">
                  <button
                    onClick={() => setSaleType("CASH")}
                    className={`py-2 rounded text-sm font-semibold transition ${saleType === "CASH" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    دفع نقدي (كاش)
                  </button>
                  <button
                    onClick={() => setSaleType("CREDIT")}
                    className={`py-2 rounded text-sm font-semibold transition ${saleType === "CREDIT" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    بيع بالآجل (دين)
                  </button>
                </div>

                {/* Cash flow specifics */}
                <div className="border-b border-border/40 pb-3">
                  <p className="text-xs text-muted-foreground">قيمة الفاتورة الكلية:</p>
                  <p className="text-lg font-bold text-primary">{cartTotal.toFixed(2)} جنيه</p>
                </div>

                {saleType === "CREDIT" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">اختر عميل آجل</label>
                      <button
                        onClick={() => setShowAddCustomer(!showAddCustomer)}
                        className="text-xs text-primary font-semibold flex items-center gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        سجل عميل سريع
                      </button>
                    </div>

                    {showAddCustomer ? (
                      <form onSubmit={handleQuickCustomerCreate} className="space-y-2 border border-border/60 p-3 rounded bg-muted/10">
                        <input
                          type="text"
                          required
                          value={newCustName}
                          onChange={(e) => setNewCustName(e.target.value)}
                          placeholder="اسم العميل الجديد"
                          className="w-full text-xs rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                        />
                        <input
                          type="text"
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          placeholder="رقم الهاتف (اختياري)"
                          className="w-full text-xs rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                        />
                        <div className="flex justify-end gap-2 text-[10px]">
                          <button type="button" onClick={() => setShowAddCustomer(false)} className="px-2 py-1 rounded bg-muted">إلغاء</button>
                          <button type="submit" className="px-2 py-1 rounded bg-primary text-primary-foreground">حفظ</button>
                        </div>
                      </form>
                    ) : (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                        className="w-full rounded border border-border bg-background px-3 py-2 text-foreground text-sm outline-none"
                      >
                        <option value="">-- اختر عميل من القائمة --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} (دين: {c.current_debt} جنيه)</option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">المبلغ المدفوع كاش</label>
                        <input
                          type="number"
                          step="any"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">المتبقي (الدين)</label>
                        <input
                          type="number"
                          disabled
                          value={(cartTotal - paidAmount).toFixed(2)}
                          className="w-full rounded border border-border bg-muted px-3 py-2 text-foreground outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">تاريخ الاستحقاق</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات الفاتورة</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button type="button" onClick={() => setShowCheckout(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                  <button onClick={handleSaveSale} className="rounded bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">حفظ الفاتورة</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
