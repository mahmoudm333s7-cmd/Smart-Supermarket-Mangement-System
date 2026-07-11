from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/debts", tags=["Debts Management"])

@router.get("", response_model=List[schemas.DebtResponse])
def get_debts(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Customer).filter(
        models.Customer.is_deleted == False,
        models.Customer.current_debt > 0
    )
    
    if search:
        query = query.filter(
            (models.Customer.name.like(f"%{search}%")) |
            (models.Customer.phone.like(f"%{search}%"))
        )
        
    customers = query.all()
    debts = []
    
    today = date.today()
    
    for c in customers:
        # Sum of sales (credit invoices)
        credit_sales = db.query(models.Sale).filter(
            models.Sale.customer_id == c.id,
            models.Sale.sale_type == "CREDIT"
        ).all()
        
        total_debt = sum(s.total_amount for s in credit_sales)
        total_paid = sum(s.paid_amount for s in credit_sales)
        remaining = c.current_debt
        
        # Get nearest due date
        nearest_due = db.query(func.min(models.Sale.due_date)).filter(
            models.Sale.customer_id == c.id,
            models.Sale.remaining_amount > 0
        ).scalar()
        
        # Determine Status
        status_color = "green"  # Default
        if nearest_due:
            due_dt = nearest_due
            if due_dt < today:
                status_color = "red"  # Overdue
                # Create notification if not already created
                # To prevent spamming, we can just return it or seed notification
            elif (due_dt - today).days <= 3:
                status_color = "yellow"  # Due soon
        
        debts.append({
            "customer_id": c.id,
            "customer_name": c.name,
            "phone": c.phone,
            "debt_amount": round(total_debt, 2),
            "paid_amount": round(total_paid, 2),
            "remaining_amount": round(remaining, 2),
            "due_date": nearest_due,
            "status": status_color
        })
        
    return debts

@router.post("/add")
def add_custom_debt(
    customer_id: int,
    amount: float,
    due_date: Optional[date] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
        
    # Increase customer current debt
    customer.current_debt += amount
    
    # Create a dummy Sale representing this debt
    sale = models.Sale(
        customer_id=customer_id,
        total_amount=amount,
        paid_amount=0.0,
        remaining_amount=amount,
        due_date=due_date,
        sale_type="CREDIT",
        notes=notes or "دين خارجي / رصيد افتتاحي",
        calculated_profit=0.0
    )
    db.add(sale)
    db.commit()
    return {"message": "تمت إضافة الدين بنجاح"}
