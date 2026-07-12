"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { 
  TrendingUp, Users, Package, AlertTriangle, 
  DollarSign, ShoppingCart, ArrowDownLeft, ArrowUpRight, 
  PieChart, Activity 
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart as ReChartsPie, Pie
} from "recharts";

export default function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [cashSummary, setCashSummary] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summary = await api.reports.getSummary({ range_type: "last_30_days" });
      const cash = await api.cash.getSummary();
      const sales = await api.sales.getAll();
      const purchases = await api.purchases.getAll();
      const notifs = await api.notifications.getAll();
      
      setData(summary);
      setCashSummary(cash);
      setRecentSales(sales.slice(0, 5));
      setRecentPurchases(purchases.slice(0, 5));
      setNotifications(notifs.filter((n: any) => !n.is_read).slice(0, 3));
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="mr-3 text-muted-foreground text-sm font-semibold">جاري تحميل لوحة القيادة...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: "الخزينة الحالية",
      value: `${cashSummary?.current_cash || 0} جنيه`,
      desc: "صافي رصيد النقدية المتوفر",
      icon: DollarSign,
      color: "text-success bg-success/10"
    },
    {
      title: "قيمة المخزون",
      value: `${data.inventory_value || 0} جنيه`,
      desc: "إجمالي قيمة الشراء للمنتجات",
      icon: Package,
      color: "text-primary bg-primary/10"
    },
    {
      title: "مبيعات الشهر",
      value: `${data.revenue || 0} جنيه`,
      desc: "إجمالي مبيعات آخر 30 يوم",
      icon: ShoppingCart,
      color: "text-secondary bg-secondary/10"
    },
    {
      title: "أرباح الشهر",
      value: `${data.profit || 0} جنيه`,
      desc: "صافي الأرباح التجارية",
      icon: TrendingUp,
      color: "text-success bg-success/10"
    },
    {
      title: "الديون المستحقة",
      value: `${data.total_debt || 0} جنيه`,
      desc: "ديون العملاء المعلقة",
      icon: AlertTriangle,
      color: "text-warning bg-warning/10"
    },
    {
      title: "إشعارات النشاط",
      value: `${notifications.length} تنبيهات`,
      desc: "أحداث المخزون والمدفوعات",
      icon: Activity,
      color: "text-destructive bg-destructive/10"
    }
  ];

  const pieColors = ["#00F5FF", "#7C3AED", "#22C55E", "#FACC15", "#EF4444"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة القيادة والمؤشرات الرئيسية</h1>
        <p className="text-sm text-muted-foreground">مراجعة أداء السوبر ماركت الذكي لآخر 30 يوماً</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-md transition-all hover:border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">{card.title}</span>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-foreground tracking-tight">{card.value}</span>
              <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Block */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Sales Trend Chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">منحنى المبيعات والأرباح اليومية</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                <YAxis stroke="#71717A" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A" }} labelStyle={{ color: "#A1A1AA" }} />
                <Area type="monotone" name="الإيرادات" dataKey="revenue" stroke="#00F5FF" fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="الأرباح" dataKey="profit" stroke="#7C3AED" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">توزيع المبيعات حسب التصنيفات</h3>
          <div className="h-72 flex flex-col justify-between">
            {data.category_distribution.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPie>
                      <Pie
                        data={data.category_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {data.category_distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A" }} />
                    </ReChartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.category_distribution.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center space-x-1 space-x-reverse">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }}></span>
                      <span className="text-muted-foreground truncate">{entry.category}: {entry.revenue} ج.م</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                لا توجد تصنيفات مبيعات كافية لعرضها حالياً
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recents Block */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sales Invoices */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">آخر الفواتير الصادرة</h3>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sale.customer_name || "زبون نقدي"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sale.sale_date).toLocaleString("ar-EG")} | {sale.sale_type === "CASH" ? "نقدي" : "آجل"}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">+{sale.total_amount} جنيه</p>
                  {sale.remaining_amount > 0 && (
                    <p className="text-[10px] text-warning">متبقي: {sale.remaining_amount} جنيه</p>
                  )}
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد مبيعات مسجلة بعد</p>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">آخر المشتريات من الموردين</h3>
          <div className="space-y-4">
            {recentPurchases.map((pur) => (
              <div key={pur.id} className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{pur.supplier}</p>
                  <p className="text-xs text-muted-foreground">
                    فاتورة رقم {pur.invoice_number} | {new Date(pur.purchase_date).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-destructive">-{pur.total_amount} جنيه</p>
                </div>
              </div>
            ))}
            {recentPurchases.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد فواتير مشتريات مسجلة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
