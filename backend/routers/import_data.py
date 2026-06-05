from fastapi import APIRouter, Depends, Header, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import json
from database import get_db
from models.Accouunt import StudentAccount
from models.Course import CourseInformation, CourseRecord
from models.Department import Department, GraduationRequirements, RequirementRule, RequirementCourseMapping
from utils.jsend_schemas import JSendSuccessResponse
from utils.exceptions import  APIFailException
from .authorization import get_user
router = APIRouter(
    tags=["Import data"]
)

@router.post(
    "/student_data",
    response_model=JSendSuccessResponse[dict]
)
async def import_student_data(file: UploadFile, user: dict = Depends(get_user), db: AsyncSession = Depends(get_db)):
    """導入全人系統課業學習資料"""
    if user["role"] != "student":
        raise APIFailException(
            code="Bad request",
            message="使用者身份不是學生"
        )
    
    if not file.filename.endswith('.json'):
        raise APIFailException(
            code="Bad Request",
            message="只允許上傳 .json 結尾的檔案"
        )
        
    try:
        contents = await file.read()
        data = json.loads(contents.decode("utf-8"))
    except Exception as e:
        print(e)
        raise APIFailException(
            code="Bad Request",
            message="json檔案不合法"
        )
        
    for dict in data:
        if "課業學習" in dict.keys():
            student_data = dict["課業學習"]
    if not student_data:
        raise APIFailException(
            code="Bad Request",
            message="json檔中沒有課業學習選項"
        )
    
    result = await db.execute(select(CourseInformation.course_id))
    course_information = set(result.scalars())
    
    course_records = 0
    try:        
        await db.execute(delete(CourseRecord).where(CourseRecord.student_id == user["id"]))
        for grade_record in student_data["gradeRecordList"]:
            for course in grade_record["GradeRecords"]:
                if course["courseCode"] in course_information:
                    course_records += 1
                    grade = 0
                    status = ""
                    try:
                        if float(course["score"]) >= 60:
                            status = "passed"
                        else:
                            status = "failed"
                        grade = float(course["score"])
                    except:
                        match course["score"]:
                            case "成績未到或無成績":
                                if course["credit"] == "0.0":
                                    status = "passed"
                                else:
                                    status = "unknown"
                            case "通過":
                                status = "passed"
                            case "停修":
                                status = "failed"
                                
                    new_course_record = CourseRecord(
                        student_id=student_data["aboutMe"]["studentNumber"],
                        course_id=course["courseCode"],
                        semester=f"{course["academicYear"]}-{course["semester"]}",
                        grade=grade,
                        status=status
                    )
                    db.add(new_course_record)
            await db.commit()
            
    except Exception as e:
        print(e)
        raise APIFailException(
            code="Bad Request",
            message="缺少鍵值"
        )

    return {
        "data": {
            "messgae": f"成功插入{course_records}筆資料"
        }
    }