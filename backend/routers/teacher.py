# TODO: API執行時應該有Bug

from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
import math

from database import get_db
from models.Accouunt import StudentAccount
from models.Department import Department
# 假設你有以下 Model，實作真實學分計算時請取消註解並依照實際名稱引入
# from models.CourseRecord import CourseRecord
# from models.GraduationRequirements import GraduationRequirements
from routers.authorization import get_user
from utils.exceptions import APIFailException
from utils.jsend_schemas import JSendSuccessResponse

router = APIRouter(
    tags=["Teacher"]
)

@router.get(
    "/students/credit-progress",
    response_model=JSendSuccessResponse[dict]
)
async def get_students_credit_progress(
    enrollment_year: Optional[str] = Query(None, description="入學年度"),
    department_id: Optional[str] = Query(None, description="科系代碼"),
    category_id: Optional[str] = Query(None, description="學分類型篩選"),
    is_pass: Optional[bool] = Query(None, description="是否達標"),
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(20, ge=1, le=100, description="每頁筆數"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_user) # 這裡會自動檢查 Token 並回傳 user info
):
    """取得學生總體學分進度列表"""
    
    # 1. 權限驗證：確保是老師
    if current_user.get("role") != "teacher":
        raise APIFailException(
            code="FORBIDDEN",
            message="權限不足，限教師身分存取",
            status_code=403
        )

    # 2. 建立基礎查詢條件 (Base Query)
    conditions = []
    
    if department_id:
        conditions.append(StudentAccount.department_major1 == department_id)
        
    if enrollment_year:
        # 假設學號前三碼為入學年度，例如 113703000 -> 113
        conditions.append(StudentAccount.student_id.startswith(enrollment_year))

    # 3. 計算總筆數 (Total Count) 用於分頁
    count_stmt = select(func.count(StudentAccount.student_id)).where(and_(*conditions))
    total_count_result = await db.execute(count_stmt)
    total_count = total_count_result.scalar() or 0
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

    # 4. 查詢當頁學生資料 (加入分頁 Offset & Limit)
    offset = (page - 1) * limit
    stmt = (
        select(StudentAccount)
        .where(and_(*conditions))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    students = result.scalars().all()

    # 5. 組裝回傳資料 (Data Aggregation)
    response_data = []
    for student in students:
        # TODO: 這裡的學分目前為假資料。
        # 實務上，你需要撰寫額外的 SQL JOIN (關聯 CourseRecord 等表) 來計算真實學分。
        mock_earned_credits = 129 
        mock_required_credits = 128 
        calculated_is_pass = mock_earned_credits >= mock_required_credits

        # 如果 API 有傳入 is_pass 篩選，且該學生不符合，則跳過不回傳
        if is_pass is not None and calculated_is_pass != is_pass:
            continue

        response_data.append({
            "student_info": {
                "student_id": student.student_id,
                "name": student.user_name,
                "major1": student.department_major1, 
                "major2": student.department_major2,
                "auxiliary": student.department_auxiliary,
                "is_pass": calculated_is_pass
            },
            "total_credits": {
                "earned": mock_earned_credits,
                "required": mock_required_credits
            }
        })

    # 6. 回傳格式化結果
    return {
        "status": "success",
        "meta": {
            "current_page": page,
            "total_pages": total_pages,
            "total_count": total_count,
            "limit": limit
        },
        "data": response_data
    }
