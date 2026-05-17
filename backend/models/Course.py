from typing import List, Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import INTEGER
from database import Base

class CourseInformation(Base):
    __tablename__ = "course_information"
    
    course_id: Mapped[str] = mapped_column(String(9), primary_key=True)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_type: Mapped[str] = mapped_column(String(5), nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False)
    department_id: Mapped[str] = mapped_column(
        String(3), 
        ForeignKey("department.department_id"),
        nullable=False,
    )
    credits: Mapped[int] = mapped_column(INTEGER(display_width=3), nullable=False)

class CourseRecord(Base):
    __tablename__ = "course_record"
    
    student_id: Mapped[str] = mapped_column(
        String(9), 
        ForeignKey("student_account.student_id"),
        primary_key=True,
    )
    course_id: Mapped[str] = mapped_column(
        String(9), 
        ForeignKey("course_information.course_id"),
        primary_key=True
    )
    semester: Mapped[str] = mapped_column(String(5), primary_key=True)
    grade: Mapped[int] = mapped_column(INTEGER(display_width=3), nullable=False)
    passed_state: Mapped[str] = mapped_column(String(1), nullable=False)

