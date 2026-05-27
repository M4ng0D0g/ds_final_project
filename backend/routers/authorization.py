from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta, timezone
from models.Accouunt import StudentAccount, TeacherAccount
from utils.jsend_schemas import JSendSuccessResponse
from utils.exceptions import APIFailException
router = APIRouter(
    tags=["Authorization"]
)

TOKEN_SESSION_STORE = {}

class RegisterPayload(BaseModel):
    id: str
    name: str
    password: str
    password_confirm: str
class LoginPayload(BaseModel):
    id: str
    password: str
    

@router.post(
    "/register",
    response_model=JSendSuccessResponse[dict]
)
async def register_account(payload: RegisterPayload, db: AsyncSession = Depends(get_db)):
    "建立新使用者帳號 (學生或教師)"
    """
        如何判斷是學生還是教師呢?
        
        實作需求:
            檢查payload是否合法?(id格式、密碼一致)
            檢查帳號是否已被註冊
            依據角色 將帳號資料存入對應的資料庫
    """
    return {
        "data":{
            "user": {
                "id": payload.id,
                "name": payload.name,
                "role": "",
                "department_id": ""
          }
        }
    }

@router.post(
    "/login",
    response_model=JSendSuccessResponse[dict]
)
async def account_verify(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    """驗證是否登入成功並回傳身份"""
    existing_token = get_existing_valid_token(payload.id)
    try:
        stmt = select(StudentAccount).where(
            StudentAccount.student_id == payload.id, 
            StudentAccount.password == payload.password
        )
        result = await db.execute(stmt)
        user = result.scalar()

        if user:
            if existing_token:
                user_token = existing_token
                expire_time = TOKEN_SESSION_STORE[existing_token]["expires_at"]
            else:
                user_token = str(uuid.uuid4())
                expire_time = datetime.now(timezone.utc) + timedelta(minutes=60)
            TOKEN_SESSION_STORE[user_token] = {
                "id": user.student_id, 
                "role": "student",
                "expires_at": expire_time
            }
            
            return {
                "data":{
                    "token": user_token,
                    "user": {
                        "id": user.student_id,
                        "name": user.user_name,
                        "role": "student",
                        "expires_at": expire_time
                    }
                }
            }
            
        stmt = select(TeacherAccount).where(
            TeacherAccount.teacher_id == payload.id, 
            TeacherAccount.password == payload.password
        )
        result = await db.execute(stmt)
        user = result.scalar()
        
        if user:
            if existing_token:
                user_token = existing_token
                expire_time = TOKEN_SESSION_STORE[existing_token]["expires_at"]
            else:
                user_token = str(uuid.uuid4())
                expire_time = datetime.now(timezone.utc) + timedelta(minutes=60)
            TOKEN_SESSION_STORE[user_token] = {
                "id": user.teacher_id, 
                "role": "teacher",
                "expires_at": expire_time
            }
            return {
                "token": user_token,
                "user": {
                    "id": user.teacher_id,
                    "name": user.user_name,
                    "role": "teacher",
                    "expires_at": expire_time
                }
            }
    except Exception as e:
        print(f"[Fatal Error](login): {e}")
        
    raise APIFailException(
        code="unauthorized",
        message="帳號不存在或密碼錯誤",
        status_code = 401
    )
    
def get_existing_valid_token(id: str):
    now = datetime.now(timezone.utc)
    for token, info in list(TOKEN_SESSION_STORE.items()):
        if now > info["expires_at"]:
            TOKEN_SESSION_STORE.pop(token, None)
            continue
            
        if info["id"] == id:
            return token
            
    return None

def clean_expired_tokens():
    """主動清理：定時或被呼叫時清除所有超時 Token"""
    now = datetime.now(timezone.utc)
    for token, info in list(TOKEN_SESSION_STORE.items()):
        if now > info["expires_at"]:
            TOKEN_SESSION_STORE.pop(token, None)
    
async def get_user(token: str = Header(..., description="請傳入登入時拿到的 Token")):  
    user: dict = TOKEN_SESSION_STORE.get(token)
    if not user:
        raise APIFailException(
            code="unauthorized",
            message="Token 已過期或無效，請重新登入",
            status_code=401
        )
    return user
    
    