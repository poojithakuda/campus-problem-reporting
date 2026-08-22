from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, func
from backend.database.connection import Base
import enum


class RoleEnum(str, enum.Enum):
    student = "student"
    admin = "admin"
    staff = "staff"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.student, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    # only set for staff — which block they're responsible for
    block = Column(String(100), nullable=True)

    # account approval status
    status = Column(Enum(StatusEnum), default=StatusEnum.approved, nullable=False)

    # mobile + OTP login
    mobile_number = Column(String(15), unique=True, nullable=True)
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(TIMESTAMP, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())