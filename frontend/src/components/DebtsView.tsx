"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Search, DollarSign, AlertCircle, CheckCircle2, AlertTriangle, Plus } from "lucide-react";

export default function DebtsView() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Debt Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [addAmount, setAddAmount] = useState(0);
  const [addDueDate, setAddDueDate] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const handleOpenAddDebt = async () => {
    setAddAmount(0);
    setAddDueDate("");
    setAddNotes("");
    setAddError("");
    setAddSuccess("");
    setSelectedCustomerId("");
    setShowAddModal(true);
    try {
      const list = await api.customers.getAll();
      setCustomersList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!selectedCustomerId) {
      setAddError("يرجى اختيار العميل");
      return;
    }
    if (addAmount <= 0) {
      setAddError("قيمة الدين يجب أن تكون أكبر من الصفر");
      return;
    }

    try {
      await api.debts.addDebt({
        customer_id: Number(selectedCustomerId),
        amount: Number(addAmount),
        due_date: addDueDate || undefined,
        notes: addNotes || undefined
      });
      setAddSuccess("تمت إضافة الدين بنجاح!");
      setTimeout(() => {
        setShowAddModal(false);
        loadDebts();
      }, 1000);
    } catch (err: any) {
      setAddError(err.message || "فشل تسجيل الدين الجديد");
    }
  };

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await api.debts.getAll({ search: search || undefined });
      setDebts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [search]);

  const handleOpenPayment = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remaining_amount);
    setPaymentNotes("");
    setError("");
    setSuccessMsg("");
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (paymentAmount <= 0) {
      setError("قيمة الدفعة يجب أن تكون أكبر من الصفر");
      return;
    }

    try {
      await api.customers.addPayment(selectedDebt.customer_id, {
        amount: Number(paymentAmount),
        notes: paymentNotes || undefined
      });
      setSuccessMsg("تم تسجيل السداد بنجاح وتحديث حساب الدين!");
      setTimeout(() => {
        setShowPaymentModal(false);
        loadDebts();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل دفعة السداد");
    }
  };

  const statusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    green: {
      label: "مستقر / قريب",
      bg: "bg-success/10",
      text: "text-success",
      icon: CheckCircle2
    },
    yellow: {
      label: "يستحق قريباً",
      bg: "bg-warning/10",
      text: "text-warning",
      icon: AlertTriangle
    },
    red: {
      label: "متأخر جداً",
      bg: "bg-destructive/10",
      text: "text-destructive",
      icon: AlertCircle
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">جدول الديون والمدفوعات الآجلة للعملاء</h1>
          <p className="text-sm text-muted-foreground">مراقبة تواريخ الاستحقاق والديون المتبقية للعملاء مع درجات التنبيه اللوني</p>
        </div>
        <button
          onClick={handleOpenAddDebt}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          إضافة دين خارجي/سابق
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
                <th className="p-4">اسم العميل</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">قيمة المشتريات الآجلة</th>
                <th className="p-4">إجمالي المسدد</th>
                <th className="p-4">الدين المتبقي</th>
                <th className="p-4">تاريخ الاستحقاق</th>
                <th className="p-4">حالة الاستحقاق</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-sm text-foreground divide-y divide-border/40">
              {debts.map((d) => {
                const status = statusMap[d.status] || statusMap["green"];
                return (
                  <tr key={d.customer_id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold">{d.customer_name}</td>
                    <td className="p-4 text-muted-foreground">{d.phone || "غير مسجل"}</td>
                    <td className="p-4">{d.debt_amount} ج.م</td>
                    <td className="p-4 text-success">{d.paid_amount} ج.م</td>
                    <td className="p-4 font-bold text-destructive">{d.remaining_amount} ج.م</td>
                    <td className="p-4 text-muted-foreground">{d.due_date ? new Date(d.due_date).toLocaleDateString("ar-EG") : "غير محدد"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                        <status.icon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => handleOpenPayment(d)}
                        className="inline-flex items-center gap-1 rounded bg-success/15 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/25"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        سداد دفعة
                      </button>
                    </td>
                  </tr>
                );
              })}
              {debts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">لا يوجد عملاء لديهم ديون متبقية مستحقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">تسجيل سداد دفعة للعميل</h2>
            <p className="text-sm text-muted-foreground mb-4">
              العميل: <span className="font-bold text-foreground">{selectedDebt?.customer_name}</span>
            </p>
            
            {successMsg ? (
              <div className="rounded bg-success/10 p-3 text-center text-success border border-success/20 font-bold mb-4">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSavePayment} className="space-y-4">
                {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">مبلغ السداد المستلم (جنيه)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات الإيصال</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="سداد قسط أو دفعة مبيعات آجل"
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                  <button type="submit" className="rounded bg-success px-5 py-2 text-sm font-bold text-success-foreground hover:bg-success/90">تأكيد سداد الدفعة</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">إضافة دين جديد لعميل</h2>
            
            {addSuccess ? (
              <div className="rounded bg-success/10 p-3 text-center text-success border border-success/20 font-bold mb-4">
                {addSuccess}
              </div>
            ) : (
              <form onSubmit={handleSaveAddDebt} className="space-y-4">
                {addError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{addError}</p>}
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">اختر العميل</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- اختر من قائمة العملاء --</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">مبلغ الدين الجديد (جنيه)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={addAmount || ""}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">تاريخ استحقاق الدين (اختياري)</label>
                  <input
                    type="date"
                    value={addDueDate}
                    onChange={(e) => setAddDueDate(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات / سبب الدين</label>
                  <input
                    type="text"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="رصيد دين افتتاحي أو بضاعة خارجية"
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button type="button" onClick={() => setShowAddModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                  <button type="submit" className="rounded bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">حفظ الدين</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
