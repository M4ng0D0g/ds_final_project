from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
import re
from database import get_db
from models.Accouunt import StudentAccount
from models.Course import CourseInformation, CourseRecord
from models.Department import Department, GraduationRequirements, RequirementRule, RequirementCourseMapping
from utils.jsend_schemas import JSendSuccessResponse, JSendErrorResponse
from utils.exceptions import APIFailException
from .authorization import get_user

router = APIRouter(
    tags=["StudentInformation"]
)
@router.post(
    "/summary",
    response_model=JSendSuccessResponse[dict]
)
async def get_summary(user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    """取得主頁儀表板 (Dashboard) 統計數據，僅包含學生資訊與各區塊學分進度，不包含課程明細"""
    if user["role"] != "student":
        raise APIFailException(
            code="Bad request",
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
    
    student = await db.scalar(select(StudentAccount).where(StudentAccount.student_id == user["id"]))
    if student is None:
        raise APIFailException(
            code="INTERNAL_SERVER_ERROR",
            message="學生資料損壞"
        )
    
    student_info["student_id"] = student.student_id
    student_info["name"] = student.user_name
    
    department_ids = set()  
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
            CourseInformation.course_type.ilike("%G%") | (CourseInformation.course_type == "RPE")
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
        
    return {
        "data": {
            "student_info": student_info,
            "total_credits": total_credits,
            "categories": categories
        }
    }
    
async def check_department_rule(student_id, department_id, db: AsyncSession):
    hint = ""

    required = await db.scalar(
        select(GraduationRequirements.required_course_credits)
        .where(GraduationRequirements.department_id == department_id)
    ) or 0

    taken_set = set(
        (await db.scalars(
            select(CourseRecord.course_id)
            .where(
                CourseRecord.student_id == student_id,
                CourseRecord.status == "passed",
                CourseRecord.course_id.in_(
                    select(RequirementCourseMapping.course_id)
                    .join(RequirementRule)
                    .where(RequirementRule.department_id == department_id)
                ),
            )
            .group_by(CourseRecord.course_id)
        )).all()
    )

    rules_result = await db.execute(
        select(RequirementRule).where(RequirementRule.department_id == department_id)
    )
    all_rules = rules_result.scalars().all()
    root_rule = next((rule for rule in all_rules if rule.parent_rule_id is None), None)

    mapping_stmt = (
        select(
            RequirementCourseMapping.rule_id,
            RequirementCourseMapping.course_id,
            RequirementCourseMapping.alternative_course_id,
            CourseInformation.credits,
            CourseInformation.course_name,
        )
        .join(CourseInformation, RequirementCourseMapping.course_id == CourseInformation.course_id)
        .join(RequirementRule, RequirementCourseMapping.rule_id == RequirementRule.rule_id)
        .where(RequirementRule.department_id == department_id)
    )
    mapping_result = await db.execute(mapping_stmt)
    mappings_by_rule: dict[int, list[tuple[str, str | None, int, str]]] = {}
    for rule_id, course_id, alternative_course_id, credits, course_name in mapping_result:
        mappings_by_rule.setdefault(rule_id, []).append(
            (course_id, alternative_course_id, credits, course_name)
        )

    child_rules: dict[int, list[RequirementRule]] = {}
    for rule in all_rules:
        if rule.parent_rule_id is not None:
            child_rules.setdefault(rule.parent_rule_id, []).append(rule)

    earned = 0
    if root_rule:
        earned, hint = await rule_check(taken_set, root_rule, child_rules, mappings_by_rule)

    return int(earned), int(required), hint

async def rule_check(
    taken_set: set,
    rule: RequirementRule,
    child_rules: dict[int, list[RequirementRule]],
    mappings_by_rule: dict[int, list[tuple[str, str | None, int, str]]],
):
    rule_rows = mappings_by_rule.get(rule.rule_id, [])
    total_earned = 0
    passed_course_count = 0
    missing_course_count = 0
    missing_courses: list[str] = []
    alternative_course_id_set: set[str] = set()

    for course_id, alternative_course_id, credits, course_name in rule_rows:
        if alternative_course_id is None or alternative_course_id not in alternative_course_id_set:
            if course_id in taken_set:
                total_earned += credits
                passed_course_count += 1
            else:
                missing_course_count += 1
                missing_courses.append(course_name)

            if alternative_course_id is not None:
                alternative_course_id_set.add(alternative_course_id)

    hint_variables = {}
    if rule.required_course_count is None:
        hint_variables["missing_course_count"] = missing_course_count
    else:
        hint_variables["missing_course_count"] = rule.required_course_count - passed_course_count

    course_earned = total_earned
    if rule.required_credits is not None:
        hint_variables["missing_credits"] = rule.required_credits - course_earned

    for child_rule in child_rules.get(rule.rule_id, []):
        child_earned, child_hint = await rule_check(
            taken_set,
            child_rule,
            child_rules,
            mappings_by_rule,
        )
        total_earned += child_earned
        hint_variables[child_rule.rule_name] = child_hint
        if child_hint == "":
            passed_course_count += 1
        else:
            missing_course_count += 1

    hint_variables["missing_courses"] = ""
    if rule.required_course_count is None or passed_course_count < (rule.required_course_count or 0):
        for course in missing_courses:
            hint_variables["missing_courses"] += f"、「{course}」"
    hint_variables["missing_courses"] = re.sub(r'、+', '、', hint_variables["missing_courses"]).strip("、")

    hint = ""
    if (
        (rule.required_course_count is None and missing_course_count > 0)
        or (rule.required_course_count is not None and rule.required_course_count > passed_course_count)
        or (rule.required_credits is not None and rule.required_credits > course_earned)
    ):
        if rule.hint is not None:
            hint = rule.hint.format(**hint_variables)
            hint = re.sub(r'、+', '、', hint).strip("、")

    return total_earned, hint.replace("\\n", "\n")

@router.get(
    "/categories/{category_id}", 
    response_model=JSendSuccessResponse[dict]
)
async def get_categories(category_id: str, user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    """取得特定學分區塊的詳細進度與課程清單（用於點擊 Block 後跳轉的新頁面）"""
    if not user["role"] == "student":
        raise APIFailException(
            code="Bad request",
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
                    code = "Category Not Found",
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
                    code = "Category Not Found",
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
                    code = "Category Not Found",
                    message= "使用者沒有第二輔系",
                    status_code=404
                )
        case _:
            raise APIFailException(
                code = "Category Not Found",
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