from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from pydantic import ConfigDict

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    asset_type = Column(String)  # laptop or mobile
    company = Column(String)
    model_no = Column(String)
    serial_number = Column(String, unique=True)
    warranty = Column(String)
    condition = Column(String)
    purchase_date = Column(String)
    location = Column(String)
    status = Column(String, default="available")  # available, assigned
    created_at = Column(DateTime, default=datetime.utcnow)
    assignments = relationship("Assignment", back_populates="asset")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    employee_id = Column(String, unique=True)
    department = Column(String)
    rank = Column(String)
    email = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    assignments = relationship("Assignment", back_populates="employee")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    assigned_by = Column(String)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    expected_return_date = Column(DateTime, nullable=True)
    returned_date = Column(DateTime, nullable=True)
    condition_on_return = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="active")  # active, returned
    asset = relationship("Asset", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")
