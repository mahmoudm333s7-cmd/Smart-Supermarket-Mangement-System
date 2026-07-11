"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Download, Calendar, Printer, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function ReportsView() {
  const [rangeType, setRangeType] = useState("last_90_days"); // last_90_days, today, yesterday, last_7_days, last_30_days, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const report = await api.reports.getSummary({
        range_type: rangeType,
        custom_start: rangeType === "custom" ? customStart : undefined,
        custom_end: rangeType === "custom" ? customEnd : undefined,
      });
      setData(report);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rangeType !== "custom" || (customStart && customEnd)) {
      fetchReport();
    }
  }, [rangeType, customStart, customEnd]);

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const url = api.reports.getExcelUrl(rangeType, customStart, customEnd);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-8 print:bg-white print:text-black animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير التحليلية والمالية</h1>
          <p className="text-sm text-muted-foreground">مراقبة الأرباح والإيرادات وإجمالي المدخلات والمخرجات المالية للمحل</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/10 transition"
          >
            <Printer className="h-4 w-4" />
            طباعة تقرير (PDF)
          </button>
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/10"
          >
            <Download className="h-4 w-4" />
            تصدير إلى Excel
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between print:hidden">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "today", label: "اليوم" },
            { id: "yesterday", label: "أمس" },
            { id: "last_7_days", label: "آخر 7 أيام" },
            { id: "last_30_days", label: "آخر 30 يوم" },
            { id: "last_90_days", label: "آخر 90 يوم" },
            { id: "this_month", label: "هذا الشهر" },
            { id: "this_year", label: "هذا العام" },
            { id: "custom", label: "فترة مخصصة" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeType(r.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${rangeType === r.id ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {rangeType === "custom" && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded border border-border bg-background px-2.5 py-1.5 text-foreground outline-none"
            />
            <span className="text-muted-foreground">إلى</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded border border-border bg-background px-2.5 py-1.5 text-foreground outline-none"
            />
          </div>
        )}
      </div>

      {/* Print header (visible only on print) */}
      <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تقرير الأداء السنوي والشهري للمتجر</h1>
        <p className="text-sm text-gray-500 mt-1">تاريخ توليد التقرير: {new Date().toLocaleDateString("ar-EG")}</p>
        <p className="text-xs text-gray-500">من {customStart || "البداية"} إلى {customEnd || "اليوم"}</p>
      </div>

      {/* Financial aggregates grid */}
      {loading || !data ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300 print:text-black">
              <p className="text-xs font-semibold text-muted-foreground print:text-gray-500">إجمالي الإيرادات (المبيعات)</p>
              <p className="text-2xl font-extrabold text-primary mt-2 print:text-black">{data.revenue} ج.م</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300 print:text-black">
              <p className="text-xs font-semibold text-muted-foreground print:text-gray-500">أرباح المبيعات التجارية</p>
              <p className="text-2xl font-extrabold text-success mt-2 print:text-black">{data.profit} ج.م</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300 print:text-black">
              <p className="text-xs font-semibold text-muted-foreground print:text-gray-500">إجمالي المصروفات العامة</p>
              <p className="text-2xl font-extrabold text-destructive mt-2 print:text-black">{data.expenses} ج.م</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300 print:text-black">
              <p className="text-xs font-semibold text-muted-foreground print:text-gray-500">صافي الربح الفعلي</p>
              <p className={`text-2xl font-extrabold mt-2 ${data.net_profit >= 0 ? "text-success" : "text-destructive"} print:text-black`}>
                {data.net_profit} ج.م
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sales Cash vs Credit breakdown */}
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300">
              <h3 className="text-base font-bold text-foreground print:text-black mb-4">هيكلية الإيرادات (نقدي / آجل)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground print:text-gray-600">إيراد المبيعات النقدية:</span>
                  <span className="font-bold text-success">+{data.cash_sales} جنيه</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground print:text-gray-600">إيراد المبيعات الآجلة (ديون مسجلة):</span>
                  <span className="font-bold text-warning">+{data.credit_sales} جنيه</span>
                </div>
                <div className="border-t border-border/40 my-2 pt-2 flex justify-between font-bold">
                  <span className="text-sm text-muted-foreground print:text-gray-600">المجموع الكلي:</span>
                  <span>{data.revenue} ج.م</span>
                </div>
              </div>
            </div>

            {/* Inventory Value */}
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300">
              <h3 className="text-base font-bold text-foreground print:text-black mb-4">التقييم الفعلي للمخازن</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground print:text-gray-600">القيمة المالية للمخزون حالياً:</span>
                  <span className="font-extrabold text-primary text-lg">{data.inventory_value} جنيه</span>
                </div>
                <p className="text-xs text-muted-foreground print:text-gray-500">تم احتساب قيمة المخزون الحالي بضرب الكميات الحالية المتوفرة بسعر كرتونة الشراء الأخير المسجل.</p>
              </div>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top selling products */}
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300">
              <h3 className="text-sm font-bold text-foreground print:text-black mb-3 pb-2 border-b border-border/40">المنتجات الأكثر مبيعاً</h3>
              <div className="space-y-3">
                {data.top_selling.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground print:text-black truncate max-w-[120px]">{p.name}</span>
                    <span className="text-muted-foreground print:text-gray-600">بيعت: {p.total_sold} حبة</span>
                  </div>
                ))}
                {data.top_selling.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">لا توجد مبيعات</p>}
              </div>
            </div>

            {/* Best Customers */}
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300">
              <h3 className="text-sm font-bold text-foreground print:text-black mb-3 pb-2 border-b border-border/40">العملاء الأكثر شراءً</h3>
              <div className="space-y-3">
                {data.best_customers.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground print:text-black truncate">{c.name}</span>
                    <span className="text-primary font-bold">{c.total_purchased} ج.م</span>
                  </div>
                ))}
                {data.best_customers.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">لا توجد حركات شراء</p>}
              </div>
            </div>

            {/* Highest debt */}
            <div className="rounded-xl border border-border bg-card p-6 print:border-gray-300">
              <h3 className="text-sm font-bold text-foreground print:text-black mb-3 pb-2 border-b border-border/40">أعلى العملاء مديونية</h3>
              <div className="space-y-3">
                {data.highest_debt.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground print:text-black truncate">{c.name}</span>
                    <span className="text-destructive font-bold">{c.debt} ج.م</span>
                  </div>
                ))}
                {data.highest_debt.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">لا توجد ديون مستحقة</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
