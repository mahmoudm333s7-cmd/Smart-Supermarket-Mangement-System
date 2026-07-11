from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")  # admin, cashier
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    category = Column(String(50), index=True)
    brand = Column(String(50))
    image_url = Column(String(500), nullable=True)
    
    purchase_price_carton = Column(Float, nullable=False)
    pieces_per_carton = Column(Integer, default=1, nullable=False)
    selling_price_piece = Column(Float, nullable=False)
    selling_price_carton = Column(Float, nullable=False)
    
    current_cartons = Column(Float, default=0.0, nullable=False)  # Float to support fractional cartons
    minimum_stock = Column(Integer, default=5, nullable=False)  # Minimum cartons
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sale_items = relationship("SaleItem", back_populates="product")
    purchase_items = relationship("PurchaseItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    current_debt = Column(Float, default=0.0)
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sales = relationship("Sale", back_populates="customer")
    payments = relationship("CustomerPayment", back_populates="customer")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())
    
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False)
    remaining_amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=True)
    sale_type = Column(String(20), nullable=False)  # CASH, CREDIT
    notes = Column(Text, nullable=True)
    calculated_profit = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_pieces = Column(Integer, nullable=False)
    price_per_piece = Column(Float, nullable=False)
    item_profit = Column(Float, default=0.0)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier = Column(String(100), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    total_amount = Column(Float, nullable=False)
    purchase_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_cartons = Column(Float, nullable=False)
    price_per_carton = Column(Float, nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product", back_populates="purchase_items")

class CashFlow(Base):
    __tablename__ = "cash_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False)  # INFLOW, OUTFLOW
    source = Column(String(20), nullable=False)  # SALE, PURCHASE, PAYMENT, EXPENSE
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CustomerPayment(Base):
    __tablename__ = "customer_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="payments")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # LOW_STOCK, OVERDUE_PAYMENT, LARGE_EXPENSE, NEGATIVE_CASH
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(100), default="سوبر ماركت الذكي")
    logo_url = Column(String(500), nullable=True)
    currency = Column(String(20), default="جنيه")
    tax_rate = Column(Float, default=0.0)
