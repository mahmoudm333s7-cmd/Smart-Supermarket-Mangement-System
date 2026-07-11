from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.get("", response_model=List[schemas.SaleResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sales = db.query(models.Sale).order_by(models.Sale.sale_date.desc()).all()
    response = []
    for s in sales:
        customer_name = s.customer.name if s.customer else "زبون نقدي"
        sale_res = schemas.SaleResponse.model_validate(s)
        sale_res.customer_name = customer_name
        
        # Populate item product names
        items_res = []
        for item in s.items:
            item_res = schemas.SaleItemResponse.model_validate(item)
            item_res.product_name = item.product.name if item.product else "منتج محذوف"
            items_res.append(item_res)
        sale_res.items = items_res
        
        response.append(sale_res)
    return response

@router.post("", response_model=schemas.SaleResponse)
def create_sale(
    sale_in: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Basic Validation
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="لا يمكن إنشاء فاتورة مبيعات فارغة")
        
    total_amount = 0.0
    calculated_profit = 0.0
    sale_items = []
    
    # 1. Process items and verify stock
    for item_in in sale_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.is_deleted == False
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"المنتج ذو المعرف {item_in.product_id} غير موجود")
            
        # Calculate quantities
        total_pieces = int(product.current_cartons * product.pieces_per_carton)
        if total_pieces < item_in.quantity_pieces:
            raise HTTPException(
                status_code=400,
                detail=f"الكمية المطلوبة للمنتج ({product.name}) غير كافية. المتوفر: {total_pieces} حبة فقط."
            )
            
        # Cost Calculations
        piece_cost = product.purchase_price_carton / product.pieces_per_carton
        profit_per_piece = item_in.price_per_piece - piece_cost
        item_total = item_in.quantity_pieces * item_in.price_per_piece
        item_profit = item_in.quantity_pieces * profit_per_piece
        
        total_amount += item_total
        calculated_profit += item_profit
        
        # Subtract stock
        cartons_sold = item_in.quantity_pieces / product.pieces_per_carton
        product.current_cartons -= cartons_sold
        
        # Check stock warning trigger
        new_total_pieces = int(product.current_cartons * product.pieces_per_carton)
        if new_total_pieces <= (product.minimum_stock * product.pieces_per_carton):
            notif = models.Notification(
                type="LOW_STOCK",
                title=f"مخزون منخفض: {product.name}",
                message=f"المنتج '{product.name}' قارب على النفاد بعد حركة المبيعات الأخيرة. الكمية الحالية: {product.current_cartons:.2f} كرتونة ({new_total_pieces} حبة)."
            )
            db.add(notif)
            
        sale_items.append(
            models.SaleItem(
                product_id=product.id,
                quantity_pieces=item_in.quantity_pieces,
                price_per_piece=item_in.price_per_piece,
                item_profit=item_profit
            )
        )
        
    # 2. Financial adjustments based on sale type (CASH or CREDIT)
    remaining_amount = 0.0
    customer = None
    
    if sale_in.sale_type == "CREDIT":
        if not sale_in.customer_id:
            raise HTTPException(status_code=400, detail="العميل مطلوب للمبيعات الآجلة")
            
        customer = db.query(models.Customer).filter(
            models.Customer.id == sale_in.customer_id,
            models.Customer.is_deleted == False
        ).first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="العميل المحدد غير موجود")
            
        remaining_amount = total_amount - sale_in.paid_amount
        if remaining_amount < 0:
            remaining_amount = 0.0
            
        customer.current_debt += remaining_amount
        
        # Cash inflow for the down payment (if any)
        if sale_in.paid_amount > 0:
            cash_flow = models.CashFlow(
                type="INFLOW",
                source="SALE",
                amount=sale_in.paid_amount,
                description=f"دفعة مقدمة لمبيعات آجل - فاتورة رقم لعميل: {customer.name}"
            )
            db.add(cash_flow)
    else:
        # Cash Sale
        # Ensure cash is exactly paid
        # But we default the paid_amount to total_amount if it's cash sale
        paid_amt = total_amount
        cash_flow = models.CashFlow(
            type="INFLOW",
            source="SALE",
            amount=paid_amt,
            description="مبيعات نقدية"
        )
        db.add(cash_flow)
        
    # 3. Create Sale Record
    sale = models.Sale(
        customer_id=sale_in.customer_id if sale_in.sale_type == "CREDIT" else None,
        total_amount=total_amount,
        paid_amount=total_amount if sale_in.sale_type == "CASH" else sale_in.paid_amount,
        remaining_amount=remaining_amount,
        due_date=sale_in.due_date if sale_in.sale_type == "CREDIT" else None,
        sale_type=sale_in.sale_type,
        notes=sale_in.notes,
        calculated_profit=calculated_profit,
        items=sale_items
    )
    
    db.add(sale)
    db.commit()
    db.refresh(sale)
    
    # Map to schema response
    sale_res = schemas.SaleResponse.model_validate(sale)
    sale_res.customer_name = customer.name if customer else "زبون نقدي"
    
    # Populate item names in output
    for i, item in enumerate(sale.items):
        sale_res.items[i].product_name = item.product.name
        
    return sale_res
