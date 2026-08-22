from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database.connection import get_db
from backend.models.complaint import Complaint, ComplaintStatus
from backend.models.department import Department
from backend.models.user import User
from backend.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate
from backend.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.get("/", response_model=List[ComplaintResponse])
async def get_all_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    complaints = (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return complaints


@router.post("/", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    complaint_data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student", "staff"))
):
    last_complaint = (
        db.query(Complaint)
        .order_by(Complaint.id.desc())
        .first()
    )

    next_id = last_complaint.id + 1 if last_complaint else 1
    complaint_code = f"CMP{next_id:03d}"

    new_complaint = Complaint(
        complaint_code=complaint_code,
        student_id=current_user.id,
        category=complaint_data.category,
        location=complaint_data.location,
        description=complaint_data.description,
        image_path=complaint_data.image_path,
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@router.get("/my", response_model=List[ComplaintResponse])
async def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaints = (
        db.query(Complaint)
        .filter(Complaint.student_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return complaints


@router.get("/staff/assigned", response_model=List[ComplaintResponse])
async def get_staff_assigned_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff"))
):
    if current_user.department_id is None:
        return []

    complaints = (
        db.query(Complaint)
        .filter(Complaint.assigned_department_id == current_user.department_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return complaints


class AssignDepartmentRequest(BaseModel):
    department_id: Optional[int] = None
    status: Optional[str] = None


@router.patch("/{complaint_id}/assign", response_model=ComplaintResponse)
async def assign_complaint_to_department(
    complaint_id: int,
    data: AssignDepartmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if data.department_id is not None:
        department = db.query(Department).filter(Department.id == data.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        complaint.assigned_department_id = data.department_id
        complaint.status = ComplaintStatus.Assigned

    if data.status is not None:
        matched_status = None
        for s in ComplaintStatus:
            if s.value == data.status:
                matched_status = s
                break
        if matched_status is None:
            valid_values = [s.value for s in ComplaintStatus]
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_values}")
        complaint.status = matched_status

    db.commit()
    db.refresh(complaint)

    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: int,
    data: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff"))
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.assigned_department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized for this department's complaints")

    if data.status is None:
        raise HTTPException(status_code=400, detail="Status is required")

    matched_status = None
    for s in ComplaintStatus:
        if s.value == data.status:
            matched_status = s
            break

    if matched_status is None:
        valid_values = [s.value for s in ComplaintStatus]
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_values}")

    complaint.status = matched_status
    db.commit()
    db.refresh(complaint)

    return complaint


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint_details(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")

    if current_user.role == "staff" and complaint.assigned_department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")

    return complaint