from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[schemas.CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Customer).filter(models.Customer.is_deleted == False)
    if search:
        query = query.filter(
            (models.Customer.name.like(f"%{search}%")) |
            (models.Customer.phone.like(f"%{search}%"))
        )
    
    customers = query.all()
    response = []
    
    for c in customers:
        # Calculate total purchases (Sales amounts)
        sales_summary = db.query(
            func.sum(models.Sale.total_amount).label("total_purchases"),
            func.max(models.Sale.sale_date).label("last_purchase")
        ).filter(models.Sale.customer_id == c.id).first()
        
        # Calculate total paid
        payments_summary = db.query(
            func.sum(models.CustomerPayment.amount).label("total_paid")
        ).filter(models.CustomerPayment.customer_id == c.id).first()
        
        total_purch = sales_summary.total_purchases or 0.0
        total_pd = payments_summary.total_paid or 0.0
        
        res = schemas.CustomerResponse.model_validate(c)
        res.total_purchases = total_purch
        res.total_paid = total_pd
        res.remaining_balance = c.current_debt
        res.last_purchase_date = sales_summary.last_purchase
        response.append(res)
        
    return response

@router.post("", response_model=schemas.CustomerResponse)
def create_customer(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = models.Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return schemas.CustomerResponse.model_validate(customer)

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
        
    # Summaries
    sales_summary = db.query(
        func.sum(models.Sale.total_amount).label("total_purchases"),
        func.max(models.Sale.sale_date).label("last_purchase")
    ).filter(models.Sale.customer_id == customer_id).first()
    
    payments_summary = db.query(
        func.sum(models.CustomerPayment.amount).label("total_paid")
    ).filter(models.CustomerPayment.customer_id == customer_id).first()
    
    res = schemas.CustomerResponse.model_validate(customer)
    res.total_purchases = sales_summary.total_purchases or 0.0
    res.total_paid = payments_summary.total_paid or 0.0
    res.remaining_balance = customer.current_debt
    res.last_purchase_date = sales_summary.last_purchase
    return res

@router.put("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
        
    for field, value in customer_in.model_dump().items():
        setattr(customer, field, value)
        
    db.commit()
    db.refresh(customer)
    return schemas.CustomerResponse.model_validate(customer)

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
        
    customer.is_deleted = True
    db.commit()
    return {"message": "تم حذف العميل بنجاح"}

# --- Add Customer Payment ---
@router.post("/{customer_id}/payments", response_model=schemas.CustomerPaymentResponse)
def add_payment(
    customer_id: int,
    payment_in: schemas.CustomerPaymentBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
        
    # Record payment
    payment = models.CustomerPayment(
        customer_id=customer_id,
        amount=payment_in.amount,
        notes=payment_in.notes
    )
    db.add(payment)
    
    # Update customer debt
    customer.current_debt -= payment_in.amount
    if customer.current_debt < 0:
        # In case they paid extra, we allow it (represented as negative debt/credit balance)
        pass
        
    # Record Cash Inflow
    cash_entry = models.CashFlow(
        type="INFLOW",
        source="PAYMENT",
        amount=payment_in.amount,
        description=f"سداد دفعة من العميل: {customer.name}"
    )
    db.add(cash_entry)
    
    db.commit()
    db.refresh(payment)
    return payment

# --- Get Customer Invoices & Payment History ---
@router.get("/{customer_id}/payments", response_model=List[schemas.CustomerPaymentResponse])
def get_customer_payments(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    payments = db.query(models.CustomerPayment).filter(
        models.CustomerPayment.customer_id == customer_id
    ).order_by(models.CustomerPayment.payment_date.desc()).all()
    return payments
