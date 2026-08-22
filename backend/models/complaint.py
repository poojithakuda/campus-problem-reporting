from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, TIMESTAMP, func
import enum

from backend.database.connection import Base


class ComplaintStatus(str, enum.Enum):
    Pending = "Pending"
    Assigned = "Assigned"
    In_Progress = "In Progress"
    Resolved = "Resolved"
    Rejected = "Rejected"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_code = Column(String(20), unique=True, nullable=False)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    category = Column(String(50), nullable=False)
    block = Column(String(100), nullable=False)  # NEW — used for auto-assignment matching
    location = Column(String(150), nullable=False)  # specific spot, e.g. "Room 204"
    description = Column(Text, nullable=False)
    image_path = Column(String(255), nullable=True)

    status = Column(
        Enum(ComplaintStatus, values_callable=lambda x: [e.value for e in x]),
        default=ComplaintStatus.Pending,
        nullable=False
    )

    assigned_department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )