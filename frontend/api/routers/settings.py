from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import shutil
import os
from ..database import get_db, engine
from .. import models, schemas, auth

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=schemas.SystemSettingsResponse)
def get_settings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    settings_obj = db.query(models.SystemSettings).first()
    if not settings_obj:
        # Default seed
        settings_obj = models.SystemSettings(
            store_name="سوبر ماركت الذكي",
            currency="جنيه",
            tax_rate=0.0
        )
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

@router.put("", response_model=schemas.SystemSettingsResponse)
def update_settings(
    settings_in: schemas.SystemSettingsBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    settings_obj = db.query(models.SystemSettings).first()
    if not settings_obj:
        settings_obj = models.SystemSettings()
        db.add(settings_obj)
        
    for field, value in settings_in.model_dump().items():
        setattr(settings_obj, field, value)
        
    db.commit()
    db.refresh(settings_obj)
    return settings_obj

@router.get("/backup")
def backup_database(
    current_user: models.User = Depends(auth.get_current_user)
):
    # Determine the database file path. For safety, we only support SQLite backup here
    # since it's local. If PostgreSQL, they download standard dumps.
    db_file = "market.db"
    if not os.path.exists(db_file):
        raise HTTPException(status_code=404, detail="ملف قاعدة بيانات SQLite غير موجود للنسخ الاحتياطي")
        
    backup_file = "market_backup.db"
    shutil.copy2(db_file, backup_file)
    
    return FileResponse(
        backup_file,
        media_type="application/octet-stream",
        filename="market_backup.db"
    )

@router.post("/restore")
def restore_database(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow SQLite database restore
    db_file = "market.db"
    
    # Close connections first to prevent lock issues on Windows
    engine.dispose()
    
    try:
        with open(db_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"message": "تم استعادة قاعدة البيانات بنجاح"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء الاستعادة: {str(e)}")
