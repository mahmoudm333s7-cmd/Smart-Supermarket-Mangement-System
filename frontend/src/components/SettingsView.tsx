"use client";
import React, { useEffect, useState } from "react";
import api from "../app/api";
import { Save, Download, Upload, Lock, Shield } from "lucide-react";

export default function SettingsView() {
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("جنيه");
  const [taxRate, setTaxRate] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  
  // User Profile Settings
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // File restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      setStoreName(data.store_name);
      setCurrency(data.currency);
      setTaxRate(data.tax_rate);
      setLogoUrl(data.logo_url || "");
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  useEffect(() => {
    loadSettings();
    if (typeof window !== "undefined") {
      setNewUsername(localStorage.getItem("username") || "");
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.settings.update({
        store_name: storeName,
        logo_url: logoUrl || null,
        currency,
        tax_rate: Number(taxRate)
      });
      setSuccess("تم حفظ الإعدادات العامة بنجاح!");
    } catch (err: any) {
      setError(err.message || "فشل حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.auth.updateProfile({
        username: newUsername,
        password: newPassword || undefined,
        old_password: oldPassword || undefined
      });
      localStorage.setItem("username", response.username);
      setSuccess("تم تحديث بيانات الحساب بنجاح!");
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "فشل تحديث بيانات الحساب الشخصي");
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = () => {
    const url = api.settings.getBackupUrl();
    window.open(url, "_blank");
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!restoreFile) return;

    if (!confirm("تحذير: استعادة قاعدة البيانات ستؤدي لاستبدال جميع البيانات الحالية بشكل نهائي. هل ترغب في المتابعة؟")) {
      return;
    }

    setLoading(true);
    try {
      await api.settings.restore(restoreFile);
      setSuccess("تم استعادة قاعدة البيانات وإعادة تحميل التطبيق بنجاح!");
      setRestoreFile(null);
    } catch (err: any) {
      setError(err.message || "فشل استعادة قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات النظام العامة والنسخ الاحتياطي</h1>
        <p className="text-sm text-muted-foreground">تخصيص هوية المتجر وتعديل كلمة المرور وأرشفة وحفظ قواعد البيانات</p>
      </div>

      {success && <p className="text-sm bg-success/10 text-success p-3 rounded-lg border border-success/20 font-bold">{success}</p>}
      {error && <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 font-bold">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Store Settings Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">بيانات وهوية المتجر</h2>
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم السوبر ماركت / المتجر</label>
              <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">العملة الافتراضية</label>
                <input type="text" required value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">الضريبة العامة (%)</label>
                <input type="number" step="any" required value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">رابط لوجو المتجر (صورة)</label>
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded bg-primary py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90">
              <Save className="h-4 w-4" />
              حفظ الهوية والبيانات
            </button>
          </form>
        </div>

        {/* Change Username & Password Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <Lock className="h-5 w-5 text-secondary" />
            <h2 className="text-base font-bold text-foreground">بيانات الحساب الشخصي (المستخدم والسر)</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">اسم المستخدم الحالي</label>
              <input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">كلمة المرور الجديدة (اختياري)</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary placeholder:text-xs" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">كلمة المرور الحالية (لتأكيد التعديلات)</label>
              <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="مطلوبة لحفظ التغييرات" className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary placeholder:text-xs" />
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 rounded bg-secondary py-2.5 font-bold text-secondary-foreground transition hover:bg-secondary/90">
              <Lock className="h-4 w-4" />
              حفظ تغييرات الحساب
            </button>
          </form>
        </div>
      </div>

      {/* Backup and Restore Area */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Shield className="h-5 w-5 text-warning" />
          <h2 className="text-base font-bold text-foreground">صيانة قاعدة البيانات (النسخ الاحتياطي والاستعادة)</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">تصدير وحفظ نسخة احتياطية</h3>
            <p className="text-xs text-muted-foreground">قم بتحميل نسخة احتياطية كاملة من قاعدة بيانات السوبر ماركت الخاصة بك في ملف مستقل على جهازك الشخصي لاستخدامها في حال الطوارئ.</p>
            <button
              onClick={handleBackup}
              className="flex items-center justify-center gap-1.5 rounded border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/10"
            >
              <Download className="h-4 w-4" />
              تحميل ملف قاعدة البيانات الحالي
            </button>
          </div>

          <form onSubmit={handleRestore} className="space-y-3 border-r border-border/40 pr-6">
            <h3 className="text-sm font-bold text-foreground">استيراد واستعادة قاعدة بيانات</h3>
            <p className="text-xs text-muted-foreground">قم برفع ملف قاعدة بيانات `.db` تم تحميله مسبقاً لاستبدال جميع بيانات السوبر ماركت الحالية ببيانات الملف المرفوع.</p>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept=".db"
                required
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
              />
              <button
                type="submit"
                disabled={loading || !restoreFile}
                className="flex items-center justify-center gap-1.5 rounded bg-warning px-4 py-2 text-xs font-bold text-warning-foreground hover:bg-warning/90 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                تأكيد الاستعادة
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
