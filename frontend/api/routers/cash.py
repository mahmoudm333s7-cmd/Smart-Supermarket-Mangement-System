from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/cash", tags=["Cash Management"])

@router.get("/summary")
def get_cash_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Total Inflow & Outflow
    inflow_sum = db.query(func.sum(models.CashFlow.amount)).filter(models.CashFlow.type == "INFLOW").scalar() or 0.0
    outflow_sum = db.query(func.sum(models.CashFlow.amount)).filter(models.CashFlow.type == "OUTFLOW").scalar() or 0.0
    
    current_cash = inflow_sum - outflow_sum
    
    # Breakdowns
    sales_income = db.query(func.sum(models.CashFlow.amount)).filter(
        models.CashFlow.type == "INFLOW",
        models.CashFlow.source.in_(["SALE", "PAYMENT"])
    ).scalar() or 0.0
    
    purchase_expenses = db.query(func.sum(models.CashFlow.amount)).filter(
        models.CashFlow.type == "OUTFLOW",
        models.CashFlow.source == "PURCHASE"
    ).scalar() or 0.0
    
    other_expenses = db.query(func.sum(models.CashFlow.amount)).filter(
        models.CashFlow.type == "OUTFLOW",
        models.CashFlow.source == "EXPENSE"
    ).scalar() or 0.0
    
    return {
        "current_cash": round(current_cash, 2),
        "sales_income": round(sales_income, 2),
        "purchase_expenses": round(purchase_expenses, 2),
        "other_expenses": round(other_expenses, 2),
        "net_cash": round(current_cash, 2)
    }

@router.post("/expenses", response_model=schemas.CashFlowResponse)
def add_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if cash becomes negative and create warning if so
    inflow_sum = db.query(func.sum(models.CashFlow.amount)).filter(models.CashFlow.type == "INFLOW").scalar() or 0.0
    outflow_sum = db.query(func.sum(models.CashFlow.amount)).filter(models.CashFlow.type == "OUTFLOW").scalar() or 0.0
    current_cash = inflow_sum - outflow_sum
    
    if current_cash < expense.amount:
        notif = models.Notification(
            type="NEGATIVE_CASH",
            title="تحذير: رصيد الخزينة بالسالب",
            message=f"تم تسجيل مصروف بقيمة {expense.amount} جنيه بينما رصيد الخزينة المتبقي هو {current_cash} جنيه فقط."
        )
        db.add(notif)
        
    cash_entry = models.CashFlow(
        type="OUTFLOW",
        source="EXPENSE",
        amount=expense.amount,
        description=f"{expense.description} - {expense.notes}" if expense.notes else expense.description
    )
    db.add(cash_entry)
    db.commit()
    db.refresh(cash_entry)
    
    # Large expense notification check (> 5000 EGP)
    if expense.amount >= 5000:
        notif = models.Notification(
            type="LARGE_EXPENSE",
            title="مصروف كبير مسجل",
            message=f"تم تسجيل مصروف كبير بقيمة {expense.amount} جنيه لوصف: {expense.description}."
        )
        db.add(notif)
        db.commit()
        
    return cash_entry

@router.get("/history", response_model=List[schemas.CashFlowResponse])
def get_cash_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    history = db.query(models.CashFlow).order_by(models.CashFlow.created_at.desc()).all()
    return history
