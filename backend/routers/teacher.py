from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime, timedelta, timezone
from models.Accouunt import StudentAccount, TeacherAccount
from utils.jsend_schemas import JSendSuccessResponse
from utils.exceptions import APIFailException
from .authorization import get_user

router = APIRouter(
    tags=["Teacher"]
)

class CreditProgressQuery(BaseModel):
    enrollment_year: Optional[str] = Field(None, description="入學年度")
    department_id: Optional[str] = Field(None, description="科系代碼")
    category_id: Optional[str] = Field(None, description="學分類型篩選")
    is_pass: Optional[bool] = Field(None, description="篩選是否達標")
    page: Optional[int] = Field(1)
    size: Optional[int] = Field(20)

@router.post(
    "/students/credit-progress",
    response_model=JSendSuccessResponse[list]
)
async def get_credit_progress(payload: CreditProgressQuery, user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    if not user["role"] == "teacher":
        raise APIFailException(
            code="Bad request",
            message="使用者身份不是教師"
        )
        
    return {
        "data": [
            
        ]
    }