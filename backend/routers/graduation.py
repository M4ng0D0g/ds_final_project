from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import get_db
from models.Accouunt import StudentAccount
from models.Course import CourseInformation, CourseRecord
from models.Department import Department, GraduationRequirements, RequirementRule, RequirementCourseMapping

router = APIRouter(
    tags=["StudentInformation"]
)

@router.post("/summary")
async def get_summary(Authorization: str = Header(None, description="Bearer Token"), db: AsyncSession = Depends(get_db)):
    """取得主頁儀表板 (Dashboard) 統計數據，僅包含學生資訊與各區塊學分進度，不包含課程明細"""
    pass

@router.get("/categories/{category_id}")
async def get_categories(category_id: str, db: AsyncSession = Depends(get_db)):
    """取得特定學分區塊的詳細進度與課程清單（用於點擊 Block 後跳轉的新頁面）"""
    match category_id:
        case "major_core":
            pass
        case "out_department":
            pass
        case "general_edu":
            pass
        case "common_compulsory":
            pass
        case _:
            pass