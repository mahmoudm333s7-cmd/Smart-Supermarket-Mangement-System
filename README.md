# نظام إدارة السوبر ماركت الذكي 🛒
### Smart Supermarket Management System

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.111-green?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-3-cyan?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2-orange?style=for-the-badge" />
</p>

نظام إدارة سوبر ماركت متكامل واحترافي بواجهة مستخدم داكنة فاخرة، يتيح للمالك إدارة عمليات المحل بالكامل بسهولة تامة.

---

## ✨ المميزات الرئيسية

- **🔐 نظام مصادقة JWT** - دخول آمن بصلاحيات المسؤول والكاشير
- **📦 إدارة المخزون** - تتبع الكراتين والقطع مع تنبيهات المخزون المنخفض
- **🛒 نقطة البيع (POS)** - مبيعات نقدية وآجلة مع تحديث المخزون تلقائياً
- **👥 إدارة العملاء والديون** - متابعة الديون وتواريخ الاستحقاق والمدفوعات
- **🛍️ المشتريات والتوريد** - تسجيل الفواتير وتحديث المخزن والخزينة
- **💰 إدارة الخزينة** - سجل الدخل والمصروفات اليومية
- **📊 تقارير مالية** - تقارير شاملة مع تصدير Excel/PDF
- **🔔 الإشعارات الذكية** - تنبيهات آلية عند نقص المخزون أو تأخر الديون
- **⚙️ الإعدادات** - تخصيص المتجر وإدارة الحسابات والنسخ الاحتياطي

---

## 🖥️ التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** - تصميم داكن فاخر مع دعم RTL
- **Recharts** - رسومات بيانية تفاعلية
- **Lucide React** - أيقونات احترافية

### الواجهة الخلفية (Backend)
- **FastAPI** - إطار عمل Python سريع
- **SQLAlchemy 2** - ORM قاعدة البيانات
- **Pydantic 2** - التحقق من البيانات
- **JWT** - مصادقة آمنة
- **SQLite** (للتطوير) / **PostgreSQL** (للإنتاج)
- **openpyxl** - تصدير ملفات Excel
- **ReportLab** - توليد ملفات PDF

---

## 🚀 تشغيل المشروع محلياً

### المتطلبات
- Python 3.10+
- Node.js 18+
- npm

### الخطوة 1: تشغيل الخلفية (Backend)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

الخادم سيعمل على: `http://localhost:8000`
توثيق الـ API متاح على: `http://localhost:8000/docs`

### الخطوة 2: تشغيل الواجهة الأمامية (Frontend)

```bash
cd frontend
npm install
npm run dev
```

التطبيق سيعمل على: `http://localhost:3000`

---

## 🔑 بيانات الدخول الافتراضية

| الحقل | القيمة |
|-------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `admin123` |

> يتم إنشاء حساب المسؤول تلقائياً عند أول تشغيل للخادم

---

## 📁 هيكل المشروع

```
Market/
├── backend/
│   ├── app/
│   │   ├── routers/         # مسارات الـ API
│   │   │   ├── auth.py      # المصادقة
│   │   │   ├── products.py  # المنتجات
│   │   │   ├── customers.py # العملاء
│   │   │   ├── sales.py     # المبيعات
│   │   │   ├── purchases.py # المشتريات
│   │   │   ├── cash.py      # الخزينة
│   │   │   ├── debts.py     # الديون
│   │   │   ├── reports.py   # التقارير
│   │   │   └── settings.py  # الإعدادات
│   │   ├── models.py        # نماذج قاعدة البيانات
│   │   ├── schemas.py       # تحقق البيانات
│   │   ├── auth.py          # JWT والتشفير
│   │   ├── config.py        # الإعدادات
│   │   ├── database.py      # الاتصال بقاعدة البيانات
│   │   └── main.py          # نقطة البداية
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/
        │   ├── api.ts       # طبقة الاتصال بالـ API
        │   └── layout.tsx   # التخطيط العام
        └── components/      # مكونات الواجهة
            ├── LoginView.tsx
            ├── DashboardView.tsx
            ├── ProductsView.tsx
            ├── SalesView.tsx
            ├── CustomersView.tsx
            ├── DebtsView.tsx
            ├── PurchasesView.tsx
            ├── CashView.tsx
            ├── ReportsView.tsx
            └── SettingsView.tsx
```

---

## 🌐 النشر (Deployment)

### الواجهة الأمامية - Vercel
```bash
cd frontend
npx vercel --prod
```

### الواجهة الخلفية - Railway / Render
1. عيّن `DATABASE_URL` للاتصال بـ PostgreSQL
2. عيّن `JWT_SECRET` بقيمة سرية قوية
3. شغّل: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

---

## 📝 متغيرات البيئة (Environment Variables)

### Backend `.env`
```
DATABASE_URL=sqlite:///./market.db
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📜 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

<p align="center">
  صُنع بـ ❤️ | Smart Supermarket Management System
</p>
