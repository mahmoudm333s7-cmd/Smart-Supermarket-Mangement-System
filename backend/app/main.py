from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, products, customers, sales, purchases, cash, debts, reports, notifications, settings

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Supermarket Management System API",
    description="نظام إدارة السوبر ماركت الذكي - لوحة تحكم ومحرك إدارة البيع والديون والمخزون",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(cash.router)
app.include_router(debts.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(settings.router)

@app.get("/")
def home():
    return {"message": "مرحباً بك في نظام إدارة السوبر ماركت الذكي API"}
