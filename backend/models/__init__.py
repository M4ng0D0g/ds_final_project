# backend/models/__init__.py
# 這個檔案負責把分散在各處的 Model 收集並暴露出來

from database import Base
from .Accouunt import StudentAccount, TeacherAccount
from .Department import Department
from .Course import CourseInformation, CourseRecord
# from .filename import Class

# 這樣做可以方便外部直接 import
__all__ = ["Base", "StudentAccount", "TeacherAccount", "Department", "CourseInformation", "CourseRecord"]