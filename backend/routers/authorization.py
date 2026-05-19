from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from pydantic import BaseModel
from models.Accouunt import StudentAccount, TeacherAccount

router = APIRouter(
    tags=["Authorization"]
)


class LoginInfo(BaseModel):
    user_name: str
    password: str
@router.get("/login")
async def account_verify(login_info: LoginInfo, db: AsyncSession = Depends(get_db)):
    """驗證是否登入成功並回傳身份"""
    pass
