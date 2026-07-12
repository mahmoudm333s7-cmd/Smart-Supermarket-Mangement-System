from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="اسم المستخدم مسجل بالفعل"
        )
    
    # Create user
    new_user = models.User(
        username=user_in.username,
        hashed_password=auth.get_password_hash(user_in.password),
        role="admin"  # First registered user is admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": new_user.username,
        "role": new_user.role
    }

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Always check if admin user exists, if not, create it immediately.
    # This guarantees the default account works even if the SQLite database file in /tmp is wiped/re-created by Vercel serverless.
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        new_admin = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    req: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="كلمة المرور القديمة غير صحيحة"
        )
    
    current_user.hashed_password = auth.get_password_hash(req.new_password)
    db.commit()
    return {"message": "تم تغيير كلمة المرور بنجاح"}

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    req: schemas.UpdateProfileRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if req.username != current_user.username:
        existing_user = db.query(models.User).filter(models.User.username == req.username).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="اسم المستخدم الجديد مسجل بالفعل لمستخدم آخر"
            )
        current_user.username = req.username
        
    if req.password:
        if not req.old_password or not auth.verify_password(req.old_password, current_user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="كلمة المرور الحالية غير صحيحة لتغيير كلمة المرور"
            )
        current_user.hashed_password = auth.get_password_hash(req.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user
