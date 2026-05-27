from typing import List, Optional
from sqlalchemy import String, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import INTEGER
from database import Base

class StudentAccount(Base):
    __tablename__ = "student_account"
    
    student_id: Mapped[str] = mapped_column(String(9), primary_key=True)
    password: Mapped[str] = mapped_column(String(20), nullable=False)
    user_name: Mapped[str] = mapped_column(String(20), nullable=False)
    department_major1: Mapped[str] = mapped_column(
        String(3), 
        ForeignKey("department.department_id"),
        nullable=False,
    )
    department_major2: Mapped[Optional[int]] = mapped_column(String(3), ForeignKey("department.department_id"))
    department_auxiliary1: Mapped[Optional[int]] = mapped_column(String(3), ForeignKey("department.department_id"))
    department_auxiliary2: Mapped[Optional[int]] = mapped_column(String(3), ForeignKey("department.department_id"))
    
    __table_args__ = (
        CheckConstraint(
            "department_auxiliary1 IS NOT NULL OR department_auxiliary2 IS NULL", 
            name="check_auxiliary_2_requires_auxiliary_1"
        ),
    )
    
class TeacherAccount(Base):
    __tablename__ = "teacher_account"
    
    teacher_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    password: Mapped[str] = mapped_column(String(20), nullable=False)
    user_name: Mapped[str] = mapped_column(String(20), nullable=False)
    department_id: Mapped[str] = mapped_column(
        String(3), 
        ForeignKey("department.department_id"),
        nullable=False,
    )