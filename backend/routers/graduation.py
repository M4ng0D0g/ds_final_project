from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
import re
from database import get_db
from models.Accouunt import StudentAccount
from models.Course import CourseInformation, CourseRecord
from models.Department import Department, GraduationRequirements, RequirementRule, RequirementCourseMapping
from utils.exceptions import APIFailException
from .authorization import get_user

router = APIRouter(
    tags=["StudentInformation"]
)

@router.post("/summary")
async def get_summary(user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    """取得主頁儀表板 (Dashboard) 統計數據，僅包含學生資訊與各區塊學分進度，不包含課程明細"""
    if not user["role"] == "student":
        raise APIFailException(
            code="BAD_REQUEST",
            message="使用者身份不是學生"
        )

    student_info = {
        "student_id": "",
        "name": "",
        "major1": "",
        "major2": None,
        "auxiliary1": None,
        "auxiliary2": None,
        "is_pass": True
    }    
    
    stmt = select(StudentAccount).where(StudentAccount.student_id == user["id"])
    result = await db.execute(stmt)
    student = result.scalar_one()
    
    student_info["student_id"] = student.student_id
    student_info["name"] = student.user_name
    
    stmt = select(Department.department_name).where(Department.department_id == student.department_major1)
    result = await db.execute(stmt)
    student_info["major1"] = result.scalar()
    if student.department_major2:
        stmt = select(Department.department_name).where(Department.department_id == student.department_major2)
        result = await db.execute(stmt)
        student_info["major2"] = result.scalar()
    
    if student.department_auxiliary1:
        stmt = select(Department.department_name).where(Department.department_id == student.department_auxiliary1)
        result = await db.execute(stmt)
        student_info["auxiliary1"] = result.scalar()
    
    if student.department_auxiliary2:
        stmt = select(Department.department_name).where(Department.department_id == student.department_auxiliary2)
        result = await db.execute(stmt)
        student_info["auxiliary2"] = result.scalar()
    
    total_credits = {"earned": 0, "required": 128}

    stmt = select(GraduationRequirements.required_course_credits).where(GraduationRequirements.department_id == student.department_major1)
    result = await db.execute(stmt)

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
    categories[0]["earned"], categories[0]["required"], categories[0]["hint"] = check_department_rule(student.student_id, student.department_major1, db)

    if categories[0]["earned"] < categories[0]["required"] or categories[0]["hint"] != "":
        student_info["is_pass"] = False
    total_credits["earned"] += categories[0]["earned"]
        
    # print("必修檢查正常")
    # 選修
    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
            CourseRecord.status == "passed",
            CourseInformation.course_type.in_(["R", "P", "E"]),
            CourseRecord.course_id.not_in(
                        select(RequirementCourseMapping.course_id)
                        .join(RequirementRule)
                        .where(RequirementRule.department_id == student.department_major1)
                    )
            )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(func.sum(CourseInformation.credits)).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)
    categories[1]["earned"] = result.scalar() or 0
    total_credits["earned"] += categories[1]["earned"]
    # print("選修檢查正常")
    # 中文
    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
               CourseRecord.status == "passed", 
               CourseInformation.course_type == "GC",
               )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(func.sum(CourseInformation.credits)).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)
    GC_earned = min(result.scalar() or 0, 6)
    if GC_earned < 3:
        student_info["is_pass"] = False
        categories[2]["hint"] += f"尚缺中文通{3 - GC_earned}學分、"
    # print("中文通檢查正常")
    # 外文
    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
               CourseRecord.status == "passed", 
               CourseInformation.course_type == "GF",
               )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(func.sum(CourseInformation.credits)).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)
    GF_earned = min(result.scalar() or 0, 6)
    if GF_earned < 6:
        student_info["is_pass"] = False
        categories[2]["hint"] += f"尚缺外文通{6 - GF_earned}學分、"
    # print("外文通檢查正常")
    # 一般
    general = {
        "CGH": False,
        "CGS": False,
        "CGN": False,
        "GH": 0,
        "GS": 0,
        "GN": 0,
        "GI": 0 
    }
    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
               CourseRecord.status == "passed", 
               CourseInformation.course_type.in_(["CGH", "CGS", "CGN", "GH", "GS", "GN", "GI"]),
               )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(CourseInformation.course_type, CourseInformation.credits).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)

    for row in result.mappings():
        match row["course_type"]:
            case "CGH":
                general["CGH"] = True
            case "CGS":
                general["CGS"] = True
            case "CGN":
                general["CGN"] = True
        general[row["course_type"].strip("C")] += row["credits"]

    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
               CourseRecord.status == "passed", 
               CourseInformation.course_type.ilike("G%"),
               CourseInformation.course_type.not_ilike("G_"),
               )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(CourseInformation.course_type, CourseInformation.credits).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)

    for row in result.mappings():
        domains = list(row["course_type"].strip("G"))
        credits = row["credits"]
        target_domain = min(domains, key=lambda d: general[f"G{d}"])
        general[f"G{target_domain}"] += credits
        
    general["GH"] = min(general["GH"], 7)
    general["GS"] = min(general["GS"], 7)
    general["GN"] = min(general["GN"], 7)
    general["GI"] = min(general["GI"], 3)
    
    if general["GH"] < 3:
        student_info["is_pass"] = False
        categories[2]["hint"] += f"尚缺人文通{3 - general["GH"]}學分、"
    if general["GS"] < 3:
        student_info["is_pass"] = False
        categories[2]["hint"] += f"尚缺社會通{3 - general["GS"]}學分、"
    if general["GN"] < 3:
        student_info["is_pass"] = False
        categories[2]["hint"] += f"尚缺自然通{3 - general["GN"]}學分、"
    if student.department_major1 not in ["304", "306", "703", "701", "ZU1"]:
        if general["GI"] < 3:
            student_info["is_pass"] = False
            categories[2]["hint"] += f"尚缺資訊通{2 - general["GI"]}學分、"
    
    categories[2]["earned"] = min(GC_earned + GF_earned + general["GH"] + general["GS"] + general["GN"] + general["GI"], 28)
    
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
    # 共同必修
    subquery = (select(CourseRecord.course_id)
        .join(CourseInformation)
        .where(CourseRecord.student_id == student.student_id, 
               CourseRecord.status == "passed", 
               CourseInformation.course_type == "RPE",
               )
        .group_by(CourseRecord.course_id)
    )
    stmt = select(func.count(CourseInformation.credits)).where(CourseInformation.course_id.in_(subquery))
    result = await db.execute(stmt)
    categories[3]["earned"] = min(result.scalar() or 0, 4)
    if categories[3]["earned"] < 4:
        student_info["is_pass"] = False
        categories[3]["hint"] = f"尚缺體育{4 - categories[3]["earned"]}學分"

    # print("共同必修檢查正常")
    # 雙主修
    if student.department_major2:
        major2 = {
            {
              "id": "major2",
              "name": "雙主修",
              "earned": 0,
              "required": 0,
              "hint": ""
            }
        }
        major2["earned"], major2["required"], major2["hint"] = check_department_rule(student.student_id, student.department_major2, db)

        if major2["earned"] < major2["required"] or major2["hint"] != "":
            student_info["is_pass"] = False
        total_credits["earned"] += major2["earned"]
        total_credits["required"] += major2["required"]
        
        categories.append(major2)

    # 輔系
    if student.department_auxiliary1:
        auxiliary1 = {
            {
              "id": "auxiliary1",
              "name": "輔系",
              "earned": 0,
              "required": 0,
              "hint": ""
            }
        }
        auxiliary1["earned"], auxiliary1["required"], auxiliary1["hint"] = check_department_rule(student.student_id, student.department_auxiliary1, db)

        if auxiliary1["earned"] < auxiliary1["required"] or auxiliary1["hint"] != "":
            student_info["is_pass"] = False
        total_credits["earned"] += auxiliary1["earned"]
        total_credits["required"] += auxiliary1["required"]
        
        categories.append(auxiliary1)
        
    if student.department_auxiliary2:
        auxiliary2 = {
            {
              "id": "auxiliary2",
              "name": "雙主修",
              "earned": 0,
              "required": 0,
              "hint": ""
            }
        }
        auxiliary2["earned"], auxiliary2["required"], auxiliary2["hint"] = check_department_rule(student.student_id, student.department_auxiliary2, db)

        if auxiliary2["earned"] < auxiliary2["required"] or auxiliary2["hint"] != "":
            student_info["is_pass"] = False
        total_credits["earned"] += auxiliary2["earned"]
        total_credits["required"] += auxiliary2["required"]
        
        categories.append(auxiliary2)
    
    if total_credits["earned"] < total_credits["required"]:
        student_info["is_pass"] = False
    
    return {
        "data": {
            "student_info": student_info,
            "total_credits": total_credits,
            "categories": categories
        }
    }

async def check_department_rule(student_id, department_id, db: AsyncSession):
    earned = 0
    required = 0
    hint = ""
    
    result = await db.execute(select(GraduationRequirements.required_course_credits).where(GraduationRequirements.department_id == department_id))
    required = result.scalar()
    
    stmt = (select(CourseRecord.course_id)
            .where(CourseRecord.student_id == student_id, 
                   CourseRecord.status == "passed", 
                   CourseRecord.course_id.in_(
                        select(RequirementCourseMapping.course_id)
                        .join(RequirementRule)
                        .where(RequirementRule.department_id == department_id)
                    )
            )
            .group_by(CourseRecord.course_id)
    )
    result = await db.execute(stmt)
    taken_set = set(result.scalars().all())
    
    stmt = select(RequirementRule).where(RequirementRule.department_id == department_id, RequirementRule.parent_rule_id.is_(None))
    result = await db.execute(stmt)
    root_rule = result.scalar()
    if root_rule:
        earned, hint = await rule_check(taken_set, root_rule, db)
    
    return earned, required, hint

async def rule_check(taken_set: set, rule: RequirementRule, db: AsyncSession):
    stmt = select(RequirementCourseMapping).where(RequirementCourseMapping.rule_id == rule.rule_id)
    result = await db.execute(stmt)

    alternative_course_id_set = set()
    total_earned = 0
    passed_course_count = 0
    missing_course_count = 0
    missing_courses = []
    for row in result.scalars():
        if row.alternative_course_id is None:
            if row.course_id in taken_set:
                stmt = select(CourseInformation.credits).where(CourseInformation.course_id == row.course_id)
                result = await db.execute(stmt)
                total_earned += result.scalar() or 0
                passed_course_count += 1
            else:
                missing_course_count = missing_course_count + 1
                stmt = select(CourseInformation.course_name).where(CourseInformation.course_id == row.course_id)
                result = await db.execute(stmt)
                missing_courses.append(result.scalar())
                
        elif row.alternative_course_id not in alternative_course_id_set:
            if row.course_id in taken_set:
                stmt = select(CourseInformation.credits).where(CourseInformation.course_id == row.course_id)
                result = await db.execute(stmt)
                total_earned += result.scalar() or 0
                passed_course_count += 1
            else:
                missing_course_count = missing_course_count + 1
                stmt = select(CourseInformation.course_name).where(CourseInformation.course_id == row.course_id)
                result = await db.execute(stmt)
                missing_courses.append(result.scalar())

            alternative_course_id_set.add(row.alternative_course_id)     
    
    hint_variables = {}
    if rule.required_course_count is None:
        hint_variables["missing_course_count"] = missing_course_count
    else:
        hint_variables["missing_course_count"] = rule.required_course_count - passed_course_count
    
    course_earned = total_earned
    if rule.required_credits:
        hint_variables["missing_credits"] = rule.required_credits - course_earned
    
    stmt = select(RequirementRule).where(RequirementRule.parent_rule_id == rule.rule_id)
    result = await db.execute(stmt)
    for row in result.scalars():
        a, b = await rule_check(taken_set, row, db)
        total_earned += a
        hint_variables[row.rule_name] = b
        if b == "":
            passed_course_count += 1
        else:
            missing_course_count += 1
    hint_variables["missing_courses"] = ""
    if rule.required_course_count is None:
        for course in missing_courses:
            hint_variables["missing_courses"] += f"、「{course}」"
    else:
        if passed_course_count < rule.required_course_count:
            for course in missing_courses:
                hint_variables["missing_courses"] += f"、「{course}」"
    hint_variables["missing_courses"] = re.sub(r'、+', '、', hint_variables["missing_courses"]).strip("、")

    hint = ""
    if ((rule.required_course_count is None and missing_course_count > 0) or
        (rule.required_course_count is not None and rule.required_course_count > passed_course_count) or
        (rule.required_credits is not None and rule.required_credits > course_earned)):
        if rule.hint is not None:
            hint = rule.hint.format(**hint_variables)
            hint = re.sub(r'、+', '、', hint).strip("、")
    
    return total_earned, hint.replace("\\n", "\n")

@router.get("/categories/{category_id}")
async def get_categories(category_id: str, user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    """取得特定學分區塊的詳細進度與課程清單（用於點擊 Block 後跳轉的新頁面）"""
    if not user["role"] == "student":
        raise APIFailException(
            code="BAD_REQUEST",
            message="使用者身份不是學生"
        )
    stmt = select(StudentAccount).where(StudentAccount.student_id == user["id"])
    result = await db.execute(stmt)
    student = result.scalar_one()
    
    courses = []
    match category_id:
        case "major1":
            stmt = (select(CourseInformation, CourseRecord)
                    .where(CourseInformation.course_id == CourseRecord.course_id,
                        CourseRecord.student_id == student.student_id, 
                        CourseRecord.course_id.in_(
                                select(RequirementCourseMapping.course_id)
                                .join(RequirementRule)
                                .where(RequirementRule.department_id == student.department_major1)
                            )
                    )
            )
            
        case "out_department":
            stmt = (select(CourseInformation, CourseRecord)
                .where(CourseInformation.course_id == CourseRecord.course_id,
                    CourseRecord.student_id == student.student_id, 
                    CourseInformation.course_type.in_(["R", "P", "E"]),
                    CourseRecord.course_id.not_in(
                                select(RequirementCourseMapping.course_id)
                                .join(RequirementRule)
                                .where(RequirementRule.department_id == student.department_major1)
                            )
                )
            )
            
        case "general_edu":
            stmt = (select(CourseInformation, CourseRecord)
                .where(CourseInformation.course_id == CourseRecord.course_id,
                    CourseRecord.student_id == student.student_id, 
                    CourseInformation.course_type.ilike("%G%"),
                )
            )
            
        case "common_compulsory":
            stmt = (select(CourseInformation, CourseRecord)
                .where(CourseInformation.course_id == CourseRecord.course_id,
                    CourseRecord.student_id == student.student_id, 
                    CourseInformation.course_type == "RPE"
                )
            )
        case "major2":
            if student.department_major2:
                stmt = (select(CourseInformation, CourseRecord)
                        .where(CourseInformation.course_id == CourseRecord.course_id,
                            CourseRecord.student_id == student.student_id, 
                            CourseRecord.course_id.in_(
                                    select(RequirementCourseMapping.course_id)
                                    .join(RequirementRule)
                                    .where(RequirementRule.department_id == student.department_major2)
                                )
                        )
                )
            else:
                raise APIFailException(
                    code = "CATEGORY_NOT_FOUND",
                    message= "使用者沒有雙主修",
                    status_code=404
                )
        case "auxiliary1":
            if student.department_auxiliary1:
                stmt = (select(CourseInformation, CourseRecord)
                        .where(CourseInformation.course_id == CourseRecord.course_id,
                            CourseRecord.student_id == student.student_id, 
                            CourseRecord.course_id.in_(
                                    select(RequirementCourseMapping.course_id)
                                    .join(RequirementRule)
                                    .where(RequirementRule.department_id == student.department_auxiliary1)
                                )
                        )
                )
            else:
                raise APIFailException(
                    code = "CATEGORY_NOT_FOUND",
                    message= "使用者沒有輔系",
                    status_code=404
                )
        case "auxiliary2":
            if student.department_auxiliary2:
                stmt = (select(CourseInformation, CourseRecord)
                        .where(CourseInformation.course_id == CourseRecord.course_id,
                            CourseRecord.student_id == student.student_id, 
                            CourseRecord.course_id.in_(
                                    select(RequirementCourseMapping.course_id)
                                    .join(RequirementRule)
                                    .where(RequirementRule.department_id == student.department_auxiliary2)
                                )
                        )
                )
            else:
                raise APIFailException(
                    code = "CATEGORY_NOT_FOUND",
                    message= "使用者沒有第二個輔系",
                    status_code=404
                )
        case _:
            raise APIFailException(
                code = "CATEGORY_NOT_FOUND",
                message= "無效的類別 ID",
                status_code=404
            )
    result = await db.execute(stmt)
    for row in result.mappings():
        courses.append(
            {
                "course_id": row["CourseInformation"].course_id,
                "course_name": row["CourseInformation"].course_name,
                "course_type": row["CourseInformation"].course_type,
                "teacher_name": row["CourseInformation"].teacher_name,
                "department_id": row["CourseInformation"].department_id,
                "credits": row["CourseInformation"].credits,
                "grade": row["CourseRecord"].grade,
                "semester": row["CourseRecord"].semester,
                "status": row["CourseRecord"].status
            }
        )
    return {
        "data": {
            "id": category_id,
            "courses": courses
        }
    }