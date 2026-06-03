from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import get_db
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta, timezone
from models.Accouunt import StudentAccount, TeacherAccount
from models.Department import Department
from utils.jsend_schemas import JSendSuccessResponse
from utils.exceptions import APIFailException

router = APIRouter(
    tags=["Authorization"]
)

TOKEN_SESSION_STORE = {}

class StudentRegisterPayload(BaseModel):
    id: str
    name: str
    password: str
    password_confirm: str
class LoginPayload(BaseModel):
    id: str
    password: str

class ResetPasswordPayload(BaseModel):
    id: str
    password: str
    password_confirm: str

@router.post(
    "/register",
    status_code=201,
    response_model=JSendSuccessResponse[dict]
)
async def student_register_account(payload: StudentRegisterPayload, db: AsyncSession = Depends(get_db)):
    """建立新使用者帳號 (學生或教師)"""
    
    if payload.password != payload.password_confirm:
        raise APIFailException(
            code="VALIDATION_ERROR",
            message="兩次輸入的密碼不一致",
            status_code=400
        )

    try:
        stmt_student = select(StudentAccount).where(StudentAccount.student_id == payload.id)
        result_student = await db.execute(stmt_student)
        existing_student = result_student.scalar()

        if existing_student:
            raise APIFailException(
                code="AUTH_USER_ALREADY_EXISTS",
                message="此學號或教職員編號已註冊過系統",
                status_code=409
            )

        is_student = len(payload.id) == 9

        if is_student:
            result = await db.execute(select(Department.department_id))
            departments = set(result.scalars())
            department_id = payload.id[3:6] if payload.id[3:6] in departments >= 6 else "000"
            new_user = StudentAccount(
                student_id=payload.id,
                password=payload.password, # 實務上建議在此處將密碼進行 Hash 處理 (例如使用 bcrypt)
                user_name=payload.name,
                department_major1=department_id
            )
        else:
            raise APIFailException(
                code="Bad request",
                message="id 長度不合法"
            )
        db.add(new_user)
        await db.commit()
        
        return {
            "data": {
                "user": {
                    "id": payload.id,
                    "name": payload.name,
                    "role": "student",
                    "department_id": department_id
                }
            }
        }

    except APIFailException:
        # 將業務邏輯的自定義 Exception 往上拋，交給全域 Exception Handler 處理
        raise
    except Exception as e:
        # 5. 處理伺服器內部錯誤 (500 Internal Server Error)
        print(f"[Fatal Error](register): {e}")
        # 若發生錯誤，退回資料庫交易
        await db.rollback() 
        raise APIFailException(
            code="INTERNAL_SERVER_ERROR",
            message="系統發生非預期錯誤，請稍後再試",
            status_code=500
        )

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
                "data": {
                    "token": user_token,
                    "user": {
                        "id": user.teacher_id,
                        "name": user.user_name,
                        "role": "teacher",
                        "expires_at": expire_time
                    }
                }
            }
    except Exception as e:
        print(f"[Fatal Error](login): {e}")
        
    raise APIFailException(
        code="Unauthorized",
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
            code="Unauthorized",
            message="Token 已過期或無效，請重新登入",
            status_code=401
        )
    return user

@router.post(
    "/reset_password",
    response_model=JSendSuccessResponse[dict]
)
async def reset_password(payload: ResetPasswordPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudentAccount).where(StudentAccount.student_id == payload.id))
    user = result.scalar()
    if not user:
        result = await db.execute(select(TeacherAccount).where(TeacherAccount.teacher_id == payload.id))
        user = result.scalar()
    if user:
        if payload.password == payload.password_confirm:
            user.password = payload.password
            await db.commit()
            return {
                "data": {
                    "message": "密碼重設成功"
                }
            }
        else:
            raise APIFailException(
                code="Password Mismatch",
                message="密碼與確認密碼不同"
            )
    else:
        raise APIFailException(
            code="Unauthorized",
            message="帳號不存在",
            status_code = 401
        )
        