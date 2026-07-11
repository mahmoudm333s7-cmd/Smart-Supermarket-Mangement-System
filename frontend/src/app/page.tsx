"use client";
import React, { useEffect, useState } from "react";
import LoginView from "../components/LoginView";
import DashboardView from "../components/DashboardView";
import ProductsView from "../components/ProductsView";
import SalesView from "../components/SalesView";
import PurchasesView from "../components/PurchasesView";
import CustomersView from "../components/CustomersView";
import DebtsView from "../components/DebtsView";
import CashView from "../components/CashView";
import ReportsView from "../components/ReportsView";
import SettingsView from "../components/SettingsView";
import api from "./api";
import { 
  LayoutDashboard, Package, ShoppingCart, 
  ShoppingBag, Users, AlertTriangle, 
  DollarSign, BarChart2, Bell, Settings, LogOut, Search, User
} from "lucide-react";

export default function RootPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [storeName, setStoreName] = useState("سوبر ماركت الذكي");
  
  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Global search modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ products: any[]; customers: any[] }>({ products: [], customers: [] });
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  // Notifications popup
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    try {
      const user = await api.auth.getMe();
      setUsername(user.username);
      setRole(user.role);
      setIsAuthenticated(true);
      loadGlobalData();
    } catch (err) {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    }
  };

  const loadGlobalData = async () => {
    try {
      const settings = await api.settings.get();
      setStoreName(settings.store_name);
      
      const notifs = await api.notifications.getAll();
      setNotifications(notifs);

      const prods = await api.products.getAll();
      setAllProducts(prods);

      const custs = await api.customers.getAll();
      setAllCustomers(custs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLoginSuccess = (usr: string, rl: string) => {
    setUsername(usr);
    setRole(rl);
    setIsAuthenticated(true);
    loadGlobalData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults({ products: [], customers: [] });
      return;
    }
    const matchedProducts = allProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);

    const matchedCustomers = allCustomers.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone && c.phone.includes(query))
    ).slice(0, 5);

    setSearchResults({ products: matchedProducts, customers: matchedCustomers });
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markReadAll();
      const notifs = await api.notifications.getAll();
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const sidebarLinks = [
    { id: "dashboard", label: "لوحة القيادة", icon: LayoutDashboard },
    { id: "products", label: "المنتجات والمخزون", icon: Package },
    { id: "sales", label: "مبيعات (نقطة البيع)", icon: ShoppingCart },
    { id: "purchases", label: "المشتريات والتوريد", icon: ShoppingBag },
    { id: "customers", label: "سجلات العملاء", icon: Users },
    { id: "debts", label: "ديون العملاء", icon: AlertTriangle },
    { id: "cash", label: "الخزينة والمصروفات", icon: DollarSign },
    { id: "reports", label: "التقارير المالية", icon: BarChart2 },
    { id: "settings", label: "إعدادات النظام", icon: Settings },
  ];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* Sidebar (Right side for RTL layout) */}
      <aside className="w-64 border-l border-border bg-card flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="flex items-center gap-3 p-6 border-b border-border/60">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
              S
            </div>
            <div>
              <h2 className="font-extrabold text-foreground tracking-tight text-sm truncate max-w-[150px]">{storeName}</h2>
              <span className="text-[10px] text-primary/80 uppercase font-bold tracking-wider">نظام ذكي</span>
            </div>
          </div>

          {/* Links */}
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-secondary/20 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-primary" : ""}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile / Logout bottom sidebar */}
        <div className="p-4 border-t border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8.5 w-8.5 rounded-full bg-secondary/15 flex items-center justify-center text-primary">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{username}</p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{role === "admin" ? "مدير النظام" : "كاشير"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between">
          {/* Global search launcher */}
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults({ products: [], customers: [] });
              setShowSearchModal(true);
            }}
            className="flex items-center gap-2 bg-muted/15 border border-border rounded-lg px-4 py-2 text-xs text-muted-foreground w-64 hover:border-primary/50 transition text-right"
          >
            <Search className="h-4 w-4" />
            <span>بحث سريع في النظام... (Ctrl+K)</span>
          </button>

          {/* Action buttons (Notifications) */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/15 transition"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-primary" />
                    تنبيهات وإشعارات النظام
                  </h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:underline font-semibold">
                      تحديد كالمقروء
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`p-2 rounded text-xs border ${n.is_read ? "border-border bg-card" : "border-primary/20 bg-primary/5"}`}>
                      <p className="font-bold text-foreground">{n.title}</p>
                      <p className="text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-6">لا توجد إشعارات جديدة حالياً</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "products" && <ProductsView />}
          {activeTab === "sales" && <SalesView />}
          {activeTab === "purchases" && <PurchasesView />}
          {activeTab === "customers" && <CustomersView />}
          {activeTab === "debts" && <DebtsView />}
          {activeTab === "cash" && <CashView />}
          {activeTab === "reports" && <ReportsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Command Search Overlay */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-20">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative mb-4">
              <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="ابحث عن منتجات، عملاء..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-3 pr-10 pl-4 text-foreground placeholder-muted-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 text-sm">
              {/* Products Section */}
              {searchResults.products.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">المنتجات المطابقة</h3>
                  <div className="space-y-1">
                    {searchResults.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveTab("products");
                          setShowSearchModal(false);
                        }}
                        className="w-full text-right p-2 rounded hover:bg-muted/10 flex justify-between"
                      >
                        <span className="font-semibold">{p.name} {p.brand && `(${p.brand})`}</span>
                        <span className="text-muted-foreground text-xs">{p.selling_price_piece} جنيه</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Section */}
              {searchResults.customers.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">العملاء المطابقين</h3>
                  <div className="space-y-1">
                    {searchResults.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveTab("customers");
                          setShowSearchModal(false);
                        }}
                        className="w-full text-right p-2 rounded hover:bg-muted/10 flex justify-between"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-destructive text-xs">الدين: {c.current_debt} جنيه</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.products.length === 0 && searchResults.customers.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">لا توجد نتائج مطابقة لبحثك</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/40 mt-3">
              <button
                onClick={() => setShowSearchModal(false)}
                className="rounded border border-border px-4 py-1.5 text-xs text-muted-foreground hover:bg-muted/10"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
