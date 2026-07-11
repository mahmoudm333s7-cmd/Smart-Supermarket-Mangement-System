from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

# --- User Schemas ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    username: str
    password: Optional[str] = None
    old_password: Optional[str] = None

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    purchase_price_carton: float
    pieces_per_carton: int = 1
    selling_price_piece: float
    selling_price_carton: float
    current_cartons: float = 0.0
    minimum_stock: int = 5
    notes: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Calculated Fields
    total_pieces: int = 0
    piece_cost: float = 0.0
    profit_per_piece: float = 0.0
    inventory_value: float = 0.0
    stock_status: str = "OK"

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_calculated(cls, db_obj):
        # Calculate properties manually for safety
        total_pieces = int(db_obj.current_cartons * db_obj.pieces_per_carton)
        piece_cost = db_obj.purchase_price_carton / db_obj.pieces_per_carton if db_obj.pieces_per_carton > 0 else 0.0
        profit_per_piece = db_obj.selling_price_piece - piece_cost
        inventory_value = db_obj.current_cartons * db_obj.purchase_price_carton
        stock_status = "LOW" if total_pieces <= (db_obj.minimum_stock * db_obj.pieces_per_carton) else "OK"
        
        resp = cls.model_validate(db_obj)
        resp.total_pieces = total_pieces
        resp.piece_cost = round(piece_cost, 2)
        resp.profit_per_piece = round(profit_per_piece, 2)
        resp.inventory_value = round(inventory_value, 2)
        resp.stock_status = stock_status
        return resp

# --- Customer & Payment Schemas ---
class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerPaymentBase(BaseModel):
    amount: float
    notes: Optional[str] = None

class CustomerPaymentCreate(CustomerPaymentBase):
    customer_id: int

class CustomerPaymentResponse(CustomerPaymentBase):
    id: int
    customer_id: int
    payment_date: datetime
    
    class Config:
        from_attributes = True

class CustomerResponse(CustomerBase):
    id: int
    current_debt: float
    is_deleted: bool
    created_at: datetime
    
    # Optional summaries
    total_purchases: Optional[float] = 0.0
    total_paid: Optional[float] = 0.0
    remaining_balance: Optional[float] = 0.0
    last_purchase_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Sales Schemas ---
class SaleItemBase(BaseModel):
    product_id: int
    quantity_pieces: int
    price_per_piece: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(SaleItemBase):
    id: int
    item_profit: float
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    customer_id: Optional[int] = None
    paid_amount: float
    sale_type: str  # CASH, CREDIT
    due_date: Optional[date] = None
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class SaleResponse(SaleBase):
    id: int
    sale_date: datetime
    total_amount: float
    remaining_amount: float
    calculated_profit: float
    customer_name: Optional[str] = None
    items: List[SaleItemResponse] = []
    
    class Config:
        from_attributes = True

# --- Purchases Schemas ---
class PurchaseItemBase(BaseModel):
    product_id: int
    quantity_cartons: float
    price_per_carton: float

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class PurchaseBase(BaseModel):
    supplier: str
    invoice_number: str
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]

class PurchaseResponse(PurchaseBase):
    id: int
    total_amount: float
    purchase_date: datetime
    items: List[PurchaseItemResponse] = []
    
    class Config:
        from_attributes = True

# --- Cash & Expenses ---
class ExpenseCreate(BaseModel):
    amount: float
    description: str
    notes: Optional[str] = None

class CashFlowResponse(BaseModel):
    id: int
    type: str  # INFLOW, OUTFLOW
    source: str  # SALE, PURCHASE, PAYMENT, EXPENSE
    amount: float
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Debt Schema ---
class DebtResponse(BaseModel):
    customer_id: int
    customer_name: str
    phone: Optional[str] = None
    debt_amount: float
    paid_amount: float
    remaining_amount: float
    due_date: Optional[date] = None
    status: str  # Green (سدد أو لا يوجد دين متأخر), Yellow (قريب الاستحقاق), Red (متأخر جداً)

# --- Notification Schema ---
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- System Settings Schema ---
class SystemSettingsBase(BaseModel):
    store_name: str
    logo_url: Optional[str] = None
    currency: str
    tax_rate: float

class SystemSettingsResponse(SystemSettingsBase):
    id: int
    
    class Config:
        from_attributes = True
