from typing import List, Optional
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import INTEGER
from database import Base

class Department(Base):
    __tablename__ = "department"
    
    department_id: Mapped[str] = mapped_column(String(3), primary_key=True)
    department_name: Mapped[str] = mapped_column(String(255), nullable=False)

class GraduationRequirements(Base):
    __tablename__ = "graduation_requirements"
    
    department_id: Mapped[str] = mapped_column(
        String(3), 
        ForeignKey("department.department_id"),
        primary_key=True
    )
    required_course_credits: Mapped[int] = mapped_column(Integer, nullable=False)
    total_credits_threshold: Mapped[int] = mapped_column(Integer, nullable=False)

class RequirementRule(Base):
    __tablename__ = "requirement_rule"
    
    rule_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_id: Mapped[str] = mapped_column(
        String(3), 
        ForeignKey("department.department_id"),
        primary_key=True
    )
    rule_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    required_course_count: Mapped[int] = mapped_column(Integer, nullable=False)
    parent_rule_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("requirement_rule.rule_id"),
        nullable=True
    )

class RequirementCourseMapping(Base):
    __tablename__ = "requirement_course_mapping"
    
    rule_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("requirement_rule.rule_id"),
        primary_key=True
    )
    course_id: Mapped[str] = mapped_column(
        String(9), 
        ForeignKey("course_information.course_id"),
        primary_key=True
    )
    alternative_course_id: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)