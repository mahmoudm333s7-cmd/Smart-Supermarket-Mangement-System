from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/purchases", tags=["Purchases"])

@router.get("", response_model=List[schemas.PurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = db.query(models.Purchase).order_by(models.Purchase.purchase_date.desc()).all()
    response = []
    for p in purchases:
        purch_res = schemas.PurchaseResponse.model_validate(p)
        
        # Populate item product names
        items_res = []
        for item in p.items:
            item_res = schemas.PurchaseItemResponse.model_validate(item)
            item_res.product_name = item.product.name if item.product else "منتج محذوف"
            items_res.append(item_res)
        purch_res.items = items_res
        
        response.append(purch_res)
    return response

@router.post("", response_model=schemas.PurchaseResponse)
def create_purchase(
    purchase_in: schemas.PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not purchase_in.items:
        raise HTTPException(status_code=400, detail="لا يمكن تسجيل فاتورة مشتريات فارغة")
        
    total_amount = 0.0
    purchase_items = []
    
    # 1. Process items and increase stock
    for item_in in purchase_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.is_deleted == False
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=404, 
                detail=f"المنتج ذو المعرف {item_in.product_id} غير موجود"
            )
            
        item_total = item_in.quantity_cartons * item_in.price_per_carton
        total_amount += item_total
        
        # Update product inventory
        product.current_cartons += item_in.quantity_cartons
        
        # Update product latest purchase price
        product.purchase_price_carton = item_in.price_per_carton
        
        purchase_items.append(
            models.PurchaseItem(
                product_id=product.id,
                quantity_cartons=item_in.quantity_cartons,
                price_per_carton=item_in.price_per_carton
            )
        )
        
    # 2. Record Cash Outflow
    cash_flow = models.CashFlow(
        type="OUTFLOW",
        source="PURCHASE",
        amount=total_amount,
        description=f"فاتورة مشتريات من المورد: {purchase_in.supplier} - رقم الفاتورة: {purchase_in.invoice_number}"
    )
    db.add(cash_flow)
    
    # 3. Create Purchase Record
    purchase = models.Purchase(
        supplier=purchase_in.supplier,
        invoice_number=purchase_in.invoice_number,
        total_amount=total_amount,
        notes=purchase_in.notes,
        items=purchase_items
    )
    
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    
    # Map to schema response
    purch_res = schemas.PurchaseResponse.model_validate(purchase)
    
    # Populate item names in output
    for i, item in enumerate(purchase.items):
        purch_res.items[i].product_name = item.product.name
        
    return purch_res
