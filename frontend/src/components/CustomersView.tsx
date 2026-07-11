"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Plus, Search, Edit2, Trash2, DollarSign, History, Calendar } from "lucide-react";

export default function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  
  // Customer Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");
  
  // History lists
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.customers.getAll({ search: search || undefined });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setNotes(c.notes || "");
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const payload = { name, phone: phone || null, address: address || null, notes: notes || null };
    try {
      if (editingCustomer) {
        await api.customers.update(editingCustomer.id, payload);
      } else {
        await api.customers.create(payload);
      }
      setShowModal(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا العميل؟")) return;
    try {
      await api.customers.delete(id);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || "فشل حذف العميل");
    }
  };

  const handleOpenPayment = (c: any) => {
    setActiveCustomer(c);
    setPaymentAmount(c.current_debt || 0);
    setPaymentNotes("");
    setError("");
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (paymentAmount <= 0) {
      setError("قيمة الدفعة يجب أن تكون أكبر من الصفر");
      return;
    }
    
    try {
      await api.customers.addPayment(activeCustomer.id, {
        amount: Number(paymentAmount),
        notes: paymentNotes || undefined
      });
      setShowPaymentModal(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "فشل تسجيل دفعة السداد");
    }
  };

  const handleOpenProfile = async (c: any) => {
    setActiveCustomer(c);
    try {
      const history = await api.customers.getPayments(c.id);
      setPaymentHistory(history);
      setShowProfileModal(true);
    } catch (err) {
      console.error("Failed to load customer profile history", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">العملاء والديون والمدفوعات</h1>
          <p className="text-sm text-muted-foreground">إدارة سجلات العملاء وسداد الأقساط والديون المتبقية</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          إضافة عميل جديد
        </button>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="بحث باسم العميل أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2.5 pr-10 pl-4 text-foreground placeholder-muted-foreground outline-none focus:border-primary"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className="relative rounded-xl border border-border bg-card p-6 shadow-md transition hover:border-primary/40">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.phone || "بدون رقم هاتف"}</p>
                </div>
                <div className="flex space-x-1 space-x-reverse">
                  <button onClick={() => handleOpenEdit(c)} className="p-1 hover:text-primary transition" title="تعديل">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 hover:text-destructive transition" title="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-4 border-t border-b border-border/40 py-3 text-xs">
                <div>
                  <p className="text-muted-foreground">إجمالي المشتريات:</p>
                  <p className="font-bold text-foreground">{c.total_purchases || 0} ج.م</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المدفوع الكلي:</p>
                  <p className="font-bold text-success">{c.total_paid || 0} ج.م</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">الدين المتبقي المعلق:</p>
                  <p className={`text-base font-extrabold ${c.current_debt > 0 ? "text-destructive" : "text-success"}`}>
                    {c.current_debt} جنيه
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenProfile(c)}
                    className="flex items-center gap-1 rounded bg-secondary/10 px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/20"
                  >
                    <History className="h-3.5 w-3.5" />
                    السجل
                  </button>
                  {c.current_debt > 0 && (
                    <button
                      onClick={() => handleOpenPayment(c)}
                      className="flex items-center gap-1 rounded bg-success px-2.5 py-1.5 text-xs font-bold text-success-foreground hover:bg-success/90"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      سداد دين
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-12">لا يوجد عملاء مطابقين للبحث</p>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم العميل بالكامل</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">رقم الهاتف</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">العنوان</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات الحساب</label>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">تسجيل سداد دفعة دين للعميل</h2>
            <p className="text-sm text-muted-foreground mb-4">العميل: <span className="font-bold text-foreground">{activeCustomer?.name}</span></p>
            <form onSubmit={handleSavePayment} className="space-y-4">
              {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">قيمة سداد الدفعة (جنيه)</label>
                <input type="number" step="any" required value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات إيصال الدفعة</label>
                <input type="text" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="مثال: سداد نقدي جزئي" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                <button type="submit" className="rounded bg-success px-5 py-2 text-sm font-bold text-success-foreground hover:bg-success/90">تأكيد السداد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">سجل مدفوعات وتاريخ العميل</h2>
            <p className="text-sm text-muted-foreground mb-4">العميل: <span className="font-bold text-foreground">{activeCustomer?.name}</span></p>
            
            <div className="max-h-60 overflow-y-auto space-y-3">
              {paymentHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">تم سداد: {h.amount} جنيه</p>
                      {h.notes && <p className="text-xs text-muted-foreground">{h.notes}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(h.payment_date).toLocaleString("ar-EG")}</span>
                </div>
              ))}
              {paymentHistory.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">لا توجد مدفوعات سابقة مسجلة</p>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setShowProfileModal(false)} className="rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
