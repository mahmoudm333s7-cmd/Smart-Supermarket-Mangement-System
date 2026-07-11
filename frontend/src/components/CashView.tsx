"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Plus, DollarSign, ArrowUpRight, ArrowDownLeft, Calendar, FileText } from "lucide-react";

export default function CashView() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const summ = await api.cash.getSummary();
      const hist = await api.cash.getHistory();
      setSummary(summ);
      setHistory(hist);
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
    setAmount(0);
    setDescription("");
    setNotes("");
    setError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (amount <= 0) {
      setError("المبلغ يجب أن يكون أكبر من الصفر");
      return;
    }
    if (!description) {
      setError("الوصف مطلوب لتسجيل المصروف");
      return;
    }

    try {
      await api.cash.addExpense({
        amount: Number(amount),
        description,
        notes: notes || undefined
      });
      setSuccessMsg("تم تسجيل المصروف بنجاح وتحديث رصيد الخزينة!");
      setTimeout(() => {
        setShowModal(false);
        loadData();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل المصروف");
    }
  };

  const sourceLabels: Record<string, string> = {
    SALE: "فاتورة مبيعات",
    PURCHASE: "فاتورة مشتريات",
    PAYMENT: "سداد دين عميل",
    EXPENSE: "مصروفات عامة"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الخزينة والسيولة النقدية</h1>
          <p className="text-sm text-muted-foreground">متابعة التدفقات المالية وتسجيل المصروفات التشغيلية للمتجر</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          تسجيل مصروف يدوياً
        </button>
      </div>

      {/* Cash Stats Cards */}
      {loading || !summary ? (
        <div className="flex h-16 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold text-muted-foreground">رصيد النقدية الحالي</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{summary.current_cash} ج.م</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold text-muted-foreground">المتحصلات (مبيعات/سداد)</p>
            <p className="text-2xl font-extrabold text-success mt-2">+{summary.sales_income} ج.م</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold text-muted-foreground">مدفوعات المشتريات</p>
            <p className="text-2xl font-extrabold text-destructive mt-2">-{summary.purchase_expenses} ج.م</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold text-muted-foreground">المصروفات الأخرى</p>
            <p className="text-2xl font-extrabold text-warning mt-2">-{summary.other_expenses}  ج.م</p>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">سجل العمليات المالية والتدفقات النقدية</h2>
        
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-sm font-semibold text-muted-foreground">
                  <th className="p-4">النوع</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">البيان / الحركة</th>
                  <th className="p-4">طبيعة المعاملة</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="text-sm text-foreground divide-y divide-border/40">
                {history.map((h) => {
                  const isInflow = h.type === "INFLOW";
                  return (
                    <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        {isInflow ? (
                          <span className="inline-flex items-center gap-1 rounded bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                            دخل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            خرج
                          </span>
                        )}
                      </td>
                      <td className={`p-4 font-bold ${isInflow ? "text-success" : "text-destructive"}`}>
                        {isInflow ? "+" : "-"}{h.amount} ج.م
                      </td>
                      <td className="p-4 font-semibold">{h.description || "-"}</td>
                      <td className="p-4 text-muted-foreground">{sourceLabels[h.source] || h.source}</td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("ar-EG")}</td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد عمليات مالية مسجلة بعد</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">تسجيل مصروفات تشغيلية يدوية</h2>
            
            {successMsg ? (
              <div className="rounded bg-success/10 p-3 text-center text-success border border-success/20 font-bold mb-4">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSaveExpense} className="space-y-4">
                {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">المبلغ (جنيه)</label>
                  <input type="number" step="any" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">وصف المصروف</label>
                  <select
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- اختر البند --</option>
                    <option value="إيجار المحل">إيجار المحل</option>
                    <option value="فاتورة الكهرباء">فاتورة الكهرباء</option>
                    <option value="اشتراك الإنترنت">اشتراك الإنترنت</option>
                    <option value="مصاريف نقل وتوصيل">مصاريف نقل وتوصيل</option>
                    <option value="رواتب الموظفين">رواتب الموظفين</option>
                    <option value="أخرى">أخرى (سجل التفاصيل بالملاحظات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">ملاحظات وتفاصيل إضافية</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="تفاصيل المصروف..." className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/10">إلغاء</button>
                  <button type="submit" className="rounded bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">حفظ الحركة</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
