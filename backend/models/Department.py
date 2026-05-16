from datetime import datetime
from typing import List, Optional
from sqlalchemy import Integer, String, ForeignKey, DateTime, func
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
    admit_year: Mapped[int] = mapped_column(Integer, primary_key=True)
    required_major_credits: Mapped[int] = mapped_column(Integer, nullable=False)
    required_optional_credits: Mapped[int] = mapped_column(Integer, nullable=False)
    total_credits_threshold: Mapped[int] = mapped_column(Integer, nullable=False)