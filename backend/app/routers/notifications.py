from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Dynamic checks before returning list:
    today = date.today()
    
    # 1. Check for overdue credit sales
    overdue_sales = db.query(models.Sale).filter(
        models.Sale.sale_type == "CREDIT",
        models.Sale.remaining_amount > 0,
        models.Sale.due_date < today
    ).all()
    
    for sale in overdue_sales:
        cust_name = sale.customer.name if sale.customer else "زبون آجل"
        notif_msg = f"الفاتورة رقم {sale.id} المستحقة على العميل '{cust_name}' متأخرة الدفع بقيمة {sale.remaining_amount} جنيه. تاريخ الاستحقاق كان {sale.due_date}."
        
        # Check if notification already exists to avoid duplication
        exists = db.query(models.Notification).filter(
            models.Notification.type == "OVERDUE_PAYMENT",
            models.Notification.message.like(f"%الفاتورة رقم {sale.id}%"),
            models.Notification.is_read == False
        ).first()
        
        if not exists:
            db.add(models.Notification(
                type="OVERDUE_PAYMENT",
                title=f"دفعة متأخرة: {cust_name}",
                message=notif_msg
            ))
            
    # 2. Check for low stock
    low_stock_products = db.query(models.Product).filter(
        models.Product.is_deleted == False
    ).all()
    
    for p in low_stock_products:
        total_pieces = int(p.current_cartons * p.pieces_per_carton)
        min_pieces = p.minimum_stock * p.pieces_per_carton
        if total_pieces <= min_pieces:
            exists = db.query(models.Notification).filter(
                models.Notification.type == "LOW_STOCK",
                models.Notification.message.like(f"%المنتج '{p.name}'%"),
                models.Notification.is_read == False
            ).first()
            
            if not exists:
                db.add(models.Notification(
                    type="LOW_STOCK",
                    title=f"مخزون منخفض: {p.name}",
                    message=f"المنتج '{p.name}' قارب على النفاد. الكمية الحالية: {p.current_cartons:.2f} كرتونة ({total_pieces} حبة)."
                ))
                
    db.commit()
    
    # Retrieve all notifications ordered by date
    notifs = db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()
    return notifs

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
    notif.is_read = True
    db.commit()
    return {"message": "تم تحديد الإشعار كمقروء"}

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.Notification).filter(models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "تم تحديد كل الإشعارات كمقروءة"}
