from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from pydantic import BaseModel, Field
from typing import Optional
from utils.exceptions import APIFailException
from .authorization import get_user

# 引入 Models
from models import (
    StudentAccount, 
    CourseRecord, 
    CourseInformation, 
    Department, 
    GraduationRequirements
)

router = APIRouter(
    tags=["Teacher"]
)

class CreditProgressQuery(BaseModel):
    enrollment_year: Optional[str] = Field(None, description="入學年度")
    department_id: Optional[str] = Field(None, description="科系代碼")
    category_id: Optional[str] = Field(None, description="學分類型篩選")
    is_pass: Optional[bool] = Field(None, description="篩選是否達標")
    page: Optional[int] = Field(1, ge=1)
    size: Optional[int] = Field(20, ge=1, le=100)

@router.post("/students/credit-progress")
async def get_credit_progress(
    payload: CreditProgressQuery, 
    #user: dict = Depends(get_user), 
    db: AsyncSession = Depends(get_db)
):
    # 1. 權限驗證
   #if user.get("role") != "teacher":
        #raise APIFailException(
            #code="UNAUTHORIZED",
            #message="使用者身份不是教師"
        #)
        
    try:
        # ==========================================
        # 步驟一：建立「已取得學分」的子查詢 (Subquery)
        # ==========================================
        earned_credits_query = select(
            CourseRecord.student_id,
            func.coalesce(func.sum(CourseInformation.credits), 0).label("earned_credits")
        ).join(
            CourseInformation, CourseRecord.course_id == CourseInformation.course_id
        ).where(
            # 假設 status 用 "pass" 或 "已通過" 代表取得學分，請依據你的實際資料庫內容調整
            CourseRecord.status == "pass" 
        )

        # 支援 category_id 篩選 (對應 course_type)
        if payload.category_id:
            earned_credits_query = earned_credits_query.where(
                CourseInformation.course_type == payload.category_id
            )

        earned_subq = earned_credits_query.group_by(CourseRecord.student_id).subquery()

        # ==========================================
        # 步驟二：建立主查詢 (整合學生、科系、畢業門檻與已取得學分)
        # ==========================================
        stmt = select(
            StudentAccount.student_id,
            StudentAccount.user_name.label("name"),
            Department.department_name.label("major1"),
            GraduationRequirements.required_course_credits.label("required_credits"),
            func.coalesce(earned_subq.c.earned_credits, 0).label("earned_credits")
        ).select_from(
            StudentAccount
        ).join(
            Department, StudentAccount.department_major1 == Department.department_id
        ).outerjoin( # 使用 outerjoin 避免該系尚未設定畢業門檻時查不到學生
            GraduationRequirements, StudentAccount.department_major1 == GraduationRequirements.department_id
        ).outerjoin( # 使用 outerjoin 避免學生還沒修過任何課時查不到
            earned_subq, StudentAccount.student_id == earned_subq.c.student_id
        )

        # ==========================================
        # 步驟三：動態加入條件篩選 (Filters)
        # ==========================================
        if payload.enrollment_year:
            # 台灣的學號前幾碼通常是入學年度 (如: 113000000 -> 113)
            stmt = stmt.where(StudentAccount.student_id.startswith(payload.enrollment_year))
            
        if payload.department_id:
            stmt = stmt.where(StudentAccount.department_major1 == payload.department_id)

        # 為了支援 is_pass 的運算篩選，我們把前面組好的 stmt 當作一個 CTE 再包一層
        main_subq = stmt.subquery()
        final_stmt = select(main_subq)

        if payload.is_pass is not None:
            if payload.is_pass:
                # 已達標：取得學分 >= 應修學分
                final_stmt = final_stmt.where(main_subq.c.earned_credits >= main_subq.c.required_credits)
            else:
                # 未達標：取得學分 < 應修學分
                final_stmt = final_stmt.where(main_subq.c.earned_credits < main_subq.c.required_credits)

        # ==========================================
        # 步驟四：計算總筆數與分頁 (Pagination)
        # ==========================================
        count_stmt = select(func.count()).select_from(final_stmt.subquery())
        total_count = (await db.execute(count_stmt)).scalar() or 0

        page = payload.page or 1
        limit = payload.size or 20
        total_pages = (total_count + limit - 1) // limit if limit > 0 else 1
        offset = (page - 1) * limit

        # 執行最終分頁查詢
        paginated_stmt = final_stmt.offset(offset).limit(limit)
        results = (await db.execute(paginated_stmt)).mappings().all()

        # ==========================================
        # 步驟五：整理回傳資料格式 (對齊 API 規格)
        # ==========================================
        data_list = []
        for row in results:
            required_credits = int(row["required_credits"] or 0)
            earned_credits = int(row["earned_credits"])
            is_pass_status = earned_credits >= required_credits if required_credits > 0 else False

            data_list.append({
                "student_info": {
                    "student_id": row["student_id"],
                    "name": row["name"],
                    "major1": row["major1"],
                    "major2": None,      # 雙主修與輔系需要額外 join 查詢，這裡先暫留 null
                    "auxiliary": None,
                    "is_pass": is_pass_status
                },
                "total_credits": {
                    "earned": earned_credits,
                    "required": required_credits
                }
            })

        return {
            "status": "success",
            "meta": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "limit": limit
            },
            "data": data_list
        }

    except APIFailException:
        raise
    except Exception as e:
        raise APIFailException(
            code="INTERNAL_SERVER_ERROR",
            message=f"系統發生非預期錯誤，請稍後再試。錯誤細節: {str(e)}"
        )