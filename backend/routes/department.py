from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from backend.database.connection import get_db
from backend.models.department import Department
from backend.models.user import User
from backend.schemas.department import DepartmentResponse
from backend.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=List[DepartmentResponse])
async def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Department).all()


class AssignStaffRequest(BaseModel):
    user_id: int
    department_id: int


@router.post("/assign-staff")
async def assign_staff_to_department(
    data: AssignStaffRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    department = db.query(Department).filter(Department.id == data.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    user.department_id = data.department_id
    db.commit()

    return {"message": f"{user.full_name} assigned to {department.name}"}