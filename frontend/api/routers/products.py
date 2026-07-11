from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductResponse])
def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Product).filter(models.Product.is_deleted == False)
    
    if search:
        query = query.filter(
            (models.Product.name.like(f"%{search}%")) |
            (models.Product.brand.like(f"%{search}%")) |
            (models.Product.category.like(f"%{search}%"))
        )
    
    if category:
        query = query.filter(models.Product.category == category)
        
    products = query.all()
    
    # Map to schema with calculated fields
    response_products = [schemas.ProductResponse.from_orm_calculated(p) for p in products]
    
    if low_stock:
        response_products = [p for p in response_products if p.stock_status == "LOW"]
        
    return response_products

@router.post("", response_model=schemas.ProductResponse)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify if name is unique
    existing = db.query(models.Product).filter(
        models.Product.name == product_in.name,
        models.Product.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="المنتج بهذا الاسم مسجل بالفعل")
        
    product = models.Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Check low stock and create notification if necessary
    total_pieces = int(product.current_cartons * product.pieces_per_carton)
    min_pieces = product.minimum_stock * product.pieces_per_carton
    if total_pieces <= min_pieces:
        notif = models.Notification(
            type="LOW_STOCK",
            title=f"مخزون منخفض: {product.name}",
            message=f"المنتج '{product.name}' قارب على النفاد. الكمية الحالية: {product.current_cartons} كرتونة ({total_pieces} حبة)."
        )
        db.add(notif)
        db.commit()

    return schemas.ProductResponse.from_orm_calculated(product)

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_deleted == False
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    return schemas.ProductResponse.from_orm_calculated(product)

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_deleted == False
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
        
    for field, value in product_in.model_dump().items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    
    # Check stock trigger
    total_pieces = int(product.current_cartons * product.pieces_per_carton)
    min_pieces = product.minimum_stock * product.pieces_per_carton
    if total_pieces <= min_pieces:
        notif = models.Notification(
            type="LOW_STOCK",
            title=f"مخزون منخفض: {product.name}",
            message=f"المنتج '{product.name}' قارب على النفاد. الكمية الحالية: {product.current_cartons} كرتونة ({total_pieces} حبة)."
        )
        db.add(notif)
        db.commit()
        
    return schemas.ProductResponse.from_orm_calculated(product)

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_deleted == False
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
        
    product.is_deleted = True
    db.commit()
    return {"message": "تم حذف المنتج بنجاح"}
