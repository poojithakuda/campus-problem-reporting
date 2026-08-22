from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComplaintCreate(BaseModel):
    category: str
    location: str
    description: str
    image_path: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    complaint_code: str
    student_id: int
    category: str
    location: str
    description: str
    image_path: Optional[str]
    status: str
    assigned_department_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_department_id: Optional[int] = None