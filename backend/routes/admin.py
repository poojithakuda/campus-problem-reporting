from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database.connection import get_db
from backend.models.user import User, RoleEnum, StatusEnum
from backend.auth.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


class PendingStaffResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    block: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/pending-staff", response_model=list[PendingStaffResponse])
async def get_pending_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    pending_users = db.query(User).filter(
        User.role == RoleEnum.staff,
        User.status == StatusEnum.pending
    ).all()

    return pending_users


@router.patch("/approve-staff/{user_id}")
async def approve_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.role != RoleEnum.staff:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only staff accounts can be approved.")

    if user.department_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assign a department before approving this staff member.")

    user.status = StatusEnum.approved
    db.commit()

    return {"message": f"{user.full_name} has been approved."}


@router.patch("/reject-staff/{user_id}")
async def reject_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.role != RoleEnum.staff:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only staff accounts can be rejected.")

    user.status = StatusEnum.rejected
    db.commit()

    return {"message": f"{user.full_name} has been rejected."}