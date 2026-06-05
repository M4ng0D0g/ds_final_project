from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from pydantic import BaseModel, Field
from typing import Optional
from utils.exceptions import APIFailException
from utils.jsend_schemas import JSendSuccessResponse
from .authorization import get_user
from .graduation import check_department_rule

# 引入 Models
from models import (
    StudentAccount,
    TeacherAccount,
    CourseRecord, 
    CourseInformation, 
    Department, 
    GraduationRequirements,
    RequirementRule,
    RequirementCourseMapping
)

router = APIRouter(
    tags=["Teacher"]
)

class CreditProgressQuery(BaseModel):
    enrollment_year: Optional[str] = Field(None, description="入學年度")
    department_id: Optional[str] = Field(None, description="科系代碼")
    page: Optional[int] = Field(1, ge=1)
    size: Optional[int] = Field(20, ge=1, le=500)

@router.post(
    "/students/credit-progress"    
) 
async def get_credit_progress(
    payload: CreditProgressQuery,
    user: dict = Depends(get_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. 權限驗證
    if user.get("role") != "teacher":
        raise APIFailException(
            code="UNAUTHORIZED",
            message="使用者身份不是教師"
        )

    # 2. 建立基礎查詢條件 (Base Query)
    if not payload.department_id:
        result = await db.execute(select(TeacherAccount.department_id).where(TeacherAccount.teacher_id == user["id"]))
        payload.department_id = result.scalar() or "000"
    
    stmt = select(StudentAccount).where(StudentAccount.department_major1 == payload.department_id)
    stmt2 = select(func.count(StudentAccount.student_id)).where(StudentAccount.department_major1 == payload.department_id)
    if payload.enrollment_year:
            # 台灣的學號前幾碼通常是入學年度 (如: 113000000 -> 113)
            stmt = stmt.where(StudentAccount.student_id.startswith(payload.enrollment_year))
            stmt2 = stmt2.where(StudentAccount.student_id.startswith(payload.enrollment_year))


    result = await db.execute(stmt2)
    total_count = result.scalar()

    stmt = stmt.offset((payload.page - 1) * payload.size).limit(payload.size)
    result = await db.execute(stmt)
    students = result.scalars().all()  

    department_ids = set()  
    for student in students:  
        department_ids.add(student.department_major1)  
        if student.department_major2:  
            department_ids.add(student.department_major2)  
        if student.department_auxiliary1:  
            department_ids.add(student.department_auxiliary1)  
        if student.department_auxiliary2:  
            department_ids.add(student.department_auxiliary2)  

    department_name_map: dict[str, str] = {}  
    if department_ids:  
        # 一次性將所有需要的系所名稱載入成對照表，避免 N+1 查詢  
        department_result = await db.execute(  
            select(Department.department_id, Department.department_name).where(Department.department_id.in_(department_ids))  
        )  
        department_name_map = {  
            department[0]: department[1]  
            for department in department_result
        }
        
    data_list = []
    try:
        for student in students:
            student_info = {
                "student_id": "",
                "name": "",
                "major1": "",
                "major2": None,
                "auxiliary1": None,
                "auxiliary2": None,
                "is_pass": True
            }    
            
            student_info["student_id"] = student.student_id
            student_info["name"] = student.user_name

            student_info["major1"] = department_name_map.get(  
                student.department_major1
            )  

            if student.department_major2:  
                student_info["major2"] = department_name_map.get(  
                    student.department_major2  
                )  

            if student.department_auxiliary1:  
                student_info["auxiliary1"] = department_name_map.get(  
                    student.department_auxiliary1  
                )  

            if student.department_auxiliary2:  
                student_info["auxiliary2"] = department_name_map.get(  
                    student.department_auxiliary2  
                )
                
            total_credits = {"earned": 0, "required": 128}

            categories = [
                {
                    "id": "major1",
                    "name": "主修",
                    "earned": 0,
                    "required": 0,
                    "hint": ""
                },
                {
                    "id": "out_department",
                    "name": "外系選修",
                    "earned": 0,
                    "required": 0,
                    "hint": ""
                },
                {
                    "id": "general_edu",
                    "name": "通識課程",
                    "earned": 0,
                    "required": 28,
                    "hint": ""
                },
                {
                    "id": "common_compulsory",
                    "name": "共同必修",
                    "earned": 0,
                    "required": 4,
                    "hint": ""
                }
            ]
            
            # 必修
            categories[0]["earned"], categories[0]["required"], categories[0]["hint"] = await check_department_rule(student.student_id, student.department_major1, db)

            if categories[0]["earned"] < categories[0]["required"] or categories[0]["hint"] != "":
                student_info["is_pass"] = False
            total_credits["earned"] += categories[0]["earned"]
                
            # print("必修檢查正常")
            # 選修
            elective_subquery = (
                select(CourseRecord.course_id)
                .join(CourseInformation)
                .where(
                    CourseRecord.student_id == student.student_id,
                    CourseRecord.status == "passed",
                    CourseInformation.course_type.in_(["R", "P", "E"]),
                    CourseRecord.course_id.not_in(
                        select(RequirementCourseMapping.course_id)
                        .join(RequirementRule)
                        .where(RequirementRule.department_id == student.department_major1)
                    ),
                )
                .group_by(CourseRecord.course_id)
            )
            categories[1]["earned"] = int(
                await db.scalar(
                    select(func.sum(CourseInformation.credits)).where(CourseInformation.course_id.in_(elective_subquery))
                )
                or 0
            )
            total_credits["earned"] += categories[1]["earned"]
            # print("選修檢查正常")

            general_stmt = (
                select(CourseInformation.course_type, CourseInformation.credits)
                .join(CourseRecord, CourseInformation.course_id == CourseRecord.course_id)
                .where(
                    CourseRecord.student_id == student.student_id,
                    CourseRecord.status == "passed",
                    CourseInformation.course_type.ilike("%G%") | CourseInformation.course_type == "RPE"
                )
            )

            result = await db.execute(general_stmt)
            general = {
                "CGH": False,
                "CGS": False,
                "CGN": False,
                "GH": 0,
                "GS": 0,
                "GN": 0,
                "GI": 0,
            }
            GC_earned = 0
            GF_earned = 0
            rpe_credits = 0

            for row in result.mappings():
                course_type = row["course_type"]
                credits = row["credits"]

                if course_type == "GC":
                    GC_earned += credits
                elif course_type == "GF":
                    GF_earned += credits
                elif course_type in ("CGH", "CGS", "CGN"):
                    general[course_type] = True
                    general[course_type.strip("C")] += credits
                elif course_type in ("GH", "GS", "GN", "GI"):
                    general[course_type] += credits
                elif course_type == "RPE":
                    rpe_credits += credits

            GC_earned = min(GC_earned, 6)
            GF_earned = min(GF_earned, 6)
            general["GH"] = min(general["GH"], 7)
            general["GS"] = min(general["GS"], 7)
            general["GN"] = min(general["GN"], 7)
            general["GI"] = min(general["GI"], 3)

            if GC_earned < 3:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺中文通{3 - GC_earned}學分、"
            if GF_earned < 6:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺外文通{6 - GF_earned}學分、"

            if general["GH"] < 3:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺人文通{3 - general['GH']}學分、"
            if general["GS"] < 3:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺社會通{3 - general['GS']}學分、"
            if general["GN"] < 3:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺自然通{3 - general['GN']}學分、"
            if student.department_major1 not in ["304", "306", "703", "701", "ZU1"] and general["GI"] < 3:
                student_info["is_pass"] = False
                categories[2]["hint"] += f"尚缺資訊通{3 - general['GI']}學分、"

            categories[2]["earned"] = int(
                min(GC_earned + GF_earned + general["GH"] + general["GS"] + general["GN"] + general["GI"], 28)
            )

            core = 0
            tmp_hint = ""
            if not general["CGH"]:
                tmp_hint += "尚缺人文核通、"
            else:
                core += 1
            if not general["CGS"]:
                tmp_hint += "尚缺社會核通、"
            else:
                core += 1
            if not general["CGN"]:
                tmp_hint += "尚缺自然核通、"
            else:
                core += 1

            if core < 2:
                student_info["is_pass"] = False
                categories[2]["hint"] += tmp_hint
            if categories[2]["earned"] < 28:
                categories[2]["hint"] += f"尚缺{28 - categories[2]["earned"]}學分、"
            categories[2]["hint"] = categories[2]["hint"].strip("、")
            total_credits["earned"] += categories[2]["earned"]
            # print("一般通識檢查正常")

            categories[3]["earned"] = int(min(rpe_credits, 4))
            if categories[3]["earned"] < 4:
                student_info["is_pass"] = False
                categories[3]["hint"] = f"尚缺體育{4 - categories[3]["earned"]}學分"
            # print("共同必修檢查正常")

            # 雙主修
            if student.department_major2:
                major2 = {
                    "id": "major2",
                    "name": "雙主修",
                    "earned": 0,
                    "required": 0,
                    "hint": ""
                }
                major2["earned"], major2["required"], major2["hint"] = await check_department_rule(student.student_id, student.department_major2, db)

                if major2["earned"] < major2["required"] or major2["hint"] != "":
                    student_info["is_pass"] = False
                total_credits["earned"] += major2["earned"]
                total_credits["required"] += major2["required"]
                
                categories.append(major2)

            # 輔系
            if student.department_auxiliary1:
                auxiliary1 = {
                    "id": "auxiliary1",
                    "name": "第一輔系",
                    "earned": 0,
                    "required": 0,
                    "hint": ""
                }
                auxiliary1["earned"], auxiliary1["required"], auxiliary1["hint"] = await check_department_rule(student.student_id, student.department_auxiliary1, db)

                if auxiliary1["earned"] < auxiliary1["required"] or auxiliary1["hint"] != "":
                    student_info["is_pass"] = False
                total_credits["earned"] += auxiliary1["earned"]
                total_credits["required"] += auxiliary1["required"]
                
                categories.append(auxiliary1)
                
            if student.department_auxiliary2:
                auxiliary2 = {
                    "id": "auxiliary2",
                    "name": "第二輔系",
                    "earned": 0,
                    "required": 0,
                    "hint": ""
                }
                auxiliary2["earned"], auxiliary2["required"], auxiliary2["hint"] = await check_department_rule(student.student_id, student.department_auxiliary2, db)

                if auxiliary2["earned"] < auxiliary2["required"] or auxiliary2["hint"] != "":
                    student_info["is_pass"] = False
                total_credits["earned"] += auxiliary2["earned"]
                total_credits["required"] += auxiliary2["required"]
                
                categories.append(auxiliary2)
            
            if total_credits["earned"] < total_credits["required"]:
                student_info["is_pass"] = False
            
            data_list.append(
                {
                    "student_info": student_info,
                    "total_credits": total_credits,
                    "categories": categories
                }
            )
            
        return {
            "status": "success",
            "meta": {
                "current_page": payload.page,
                "total_pages": (total_count + payload.size - 1) // payload.size,
                "total_count": total_count,
                "limit": payload.size
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
