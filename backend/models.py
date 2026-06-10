from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="admin")
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    master_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    asset_type = Column(String, default="NEW")  # NEW, RETURN, MISCELLANEOUS
    company = Column(String)
    serial_number = Column(String, unique=True)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    current_location = Column(String)
    asset_images = Column(Text, nullable=True)
    permission_document = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)
    purchase_date = Column(String, nullable=True)
    status = Column(String, default="available")  # available, assigned
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="asset")
    requests = relationship("AssetRequest", back_populates="asset")


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
    requests = relationship("AssetRequest", back_populates="employee")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    assigned_by = Column(String)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    returned_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="active")  # active, returned

    asset = relationship("Asset", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")


class AssetRequest(Base):
    __tablename__ = "asset_requests"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    requested_by = Column(String)
    status = Column(String, default="Pending")
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    asset = relationship("Asset", back_populates="requests")
    employee = relationship("Employee", back_populates="requests")
