from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from pydantic import BaseModel, Field
from typing import List, Optional
from models.Course import CourseInformation
from models.Department import Department
from utils.jsend_schemas import JSendSuccessResponse

router = APIRouter(
    tags=["Course"]
)

class CourseSearchRequest(BaseModel):
    course_id: Optional[str] = Field(None, description="課程 ID，支援模糊查詢")
    course_name: Optional[str] = Field(None, description="課程名稱，支援模糊關鍵字查詢")
    teacher: Optional[str] = Field(None, description="授課教師姓名，支援模糊查詢")
    course_type: Optional[str] = Field(None, description="課程類型")
    department: Optional[str] = Field(None, description="開課單位，支援id查詢或名稱模糊查詢")
    page: int = Field(1)
    size: int = Field(10)

@router.post("/search")
async def search_courses(payload: CourseSearchRequest, db: AsyncSession = Depends(get_db)):
    """取得課程資訊"""
    # 1. 初始化基礎查詢
    stmt = select(CourseInformation)
    
    # 2. 動態檢查欄位，有傳值的才加入 where 條件
    if payload.course_id:
        stmt = stmt.where(CourseInformation.course_id.ilike(f"%{payload.course_id}%"))
        
    if payload.course_name:
        stmt = stmt.where(CourseInformation.course_name.ilike(f"%{payload.course_name}%"))
        
    if payload.teacher:
        stmt = stmt.where(CourseInformation.teacher_name.ilike(f"%{payload.teacher}%"))
    
    if payload.course_type:
        stmt = stmt.where(CourseInformation.course_type == payload.course_type)
    
    if payload.department:
        stmt = stmt.join(Department).where(CourseInformation.department_id == payload.department or Department.department_name.ilike(f"%{payload.department}%"))

    # 3. 處理分頁限制 (Pagination)
    payload.size = max(payload.size, 500)
    offset_value = (payload.page - 1) * payload.size
    stmt = stmt.offset(offset_value).limit(payload.size)
    
    # 4. 執行並回傳
    result = await db.execute(stmt)
    courses = result.scalars().all() # 撈出 ORM 物件清單
    
    return JSendSuccessResponse(data=courses)