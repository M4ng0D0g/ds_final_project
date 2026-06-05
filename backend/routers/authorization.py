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

class TeacherRegisterPayload(BaseModel):
    id: str
    name: str
    password: str
    password_confirm: str
    department_id: str
    
class LoginPayload(BaseModel):
    id: str
    password: str

class ResetPasswordPayload(BaseModel):
    id: str
    password: str
    password_confirm: str

@router.post(
    "/register/student",
    status_code=201,
    response_model=JSendSuccessResponse[dict]
)

# ==========================================
# 學生註冊
# ==========================================
async def register_student(payload: StudentRegisterPayload, db: AsyncSession = Depends(get_db)):
    """建立新使用者帳號 (學生)"""
    
    if payload.password != payload.password_confirm:
        raise APIFailException(
            code="VALIDATION_ERROR",
            message="兩次輸入的密碼不一致",
            status_code=400
        )

    try:
        # 檢查帳號是否已存在 (學生與老師表都要查，避免學號與教職員工號重複)
        if await check_user_exists(payload.id, db):
            raise APIFailException(
                code="AUTH_USER_ALREADY_EXISTS",
                message="此學號已註冊過系統",
                status_code=409
            )

        # 學生：自動從學號 (假設前 9 碼) 擷取系所代碼，長度不足則給預設值 "703"
        dept_id = payload.id[3:6] if len(payload.id) >= 6 else "703"

        new_user = StudentAccount(
            student_id=payload.id,
            password=payload.password,
            user_name=payload.name,
            department_major1=dept_id
        )


        db.add(new_user)
        await db.commit()
        
        return {
            "status": "success",
            "data": {
                "user": {
                    "id": payload.id,
                    "name": payload.name,
                    "role": "student",
                    "department_id": dept_id
                }
            }
        }

    except APIFailException:
        raise
    except Exception as e:
        await db.rollback() 
        print(f"[Fatal Error](register_student): {e}")
        raise APIFailException(
            code="INTERNAL_SERVER_ERROR",
            message="系統發生非預期錯誤，請稍後再試",
            status_code=500
        )

# ==========================================
# 教師註冊
# ==========================================
@router.post(
    "/register/teacher",
    status_code=201,
    response_model=JSendSuccessResponse[dict]
)
async def register_teacher(payload: TeacherRegisterPayload, db: AsyncSession = Depends(get_db)):
    """建立新使用者帳號 (教師)"""
    
    if payload.password != payload.password_confirm:
        raise APIFailException(
            code="VALIDATION_ERROR",
            message="兩次輸入的密碼不一致",
            status_code=400
        )

    try:
        # 檢查帳號是否已存在
        if await check_user_exists(payload.id, db):
            raise APIFailException(
                code="AUTH_USER_ALREADY_EXISTS",
                message="此教職員編號已註冊過系統",
                status_code=409
            )

        new_user = TeacherAccount(
            teacher_id=payload.id,
            password=payload.password, 
            user_name=payload.name,
            department_id=payload.department_id
        )

        db.add(new_user)
        await db.commit()
        
        return {
            "status": "success",
            "data": {
                "user": {
                    "id": payload.id,
                    "name": payload.name,
                    "role": "teacher",
                    "department_id": payload.department_id
                }
            }
        }

    except APIFailException:
        raise
    except Exception as e:
        await db.rollback() 
        print(f"[Fatal Error](register_teacher): {e}")
        raise APIFailException(
            code="INTERNAL_SERVER_ERROR",
            message="系統發生非預期錯誤，請稍後再試",
            status_code=500
        )
    
async def check_user_exists(user_id: str, db: AsyncSession) -> bool:
    stmt_student = select(StudentAccount).where(StudentAccount.student_id == user_id)
    existing_student = (await db.execute(stmt_student)).scalar()

    stmt_teacher = select(TeacherAccount).where(TeacherAccount.teacher_id == user_id)
    existing_teacher = (await db.execute(stmt_teacher)).scalar()

    return bool(existing_student or existing_teacher)

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
        