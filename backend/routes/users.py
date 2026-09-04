from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database.connection import get_db
from backend.models.user import User, RoleEnum
from backend.schemas.user import UserResponse
from backend.auth.dependencies import get_current_user, require_role
from backend.auth.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


# ============================================================
# MY PROFILE
# ============================================================

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    block: Optional[str] = None  # only meaningful for staff


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name is not None:
        if data.full_name.strip() == "":
            raise HTTPException(
                status_code=400,
                detail="Name cannot be empty."
            )

        current_user.full_name = data.full_name.strip()

    if data.password is not None:
        if len(data.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long."
            )

        current_user.password_hash = hash_password(data.password)

    if data.block is not None:
        if current_user.role.value != "staff":
            raise HTTPException(
                status_code=400,
                detail="Only staff accounts have a working block."
            )

        current_user.block = data.block

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# ADMIN - MANAGE STAFF AND ADMINS
# ============================================================

@router.get(
    "/staff",
    response_model=list[UserResponse]
)
async def get_staff_and_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = (
        db.query(User)
        .filter(
            User.role.in_([
                RoleEnum.staff,
                RoleEnum.admin
            ])
        )
        .all()
    )

    return users


# ============================================================
# UPDATE STAFF / ADMIN
# ============================================================

class StaffUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


@router.patch(
    "/staff/{user_id}",
    response_model=UserResponse
)
async def update_staff_or_admin(
    user_id: int,
    data: StaffUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Staff or admin account not found."
        )

    if user.role.value not in ["staff", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Only staff and admin accounts can be managed here."
        )

    # Prevent an admin from removing their own admin role
    if user.id == current_user.id:
        if data.role is not None and data.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="You cannot remove your own admin role."
            )

    if data.full_name is not None:
        if data.full_name.strip() == "":
            raise HTTPException(
                status_code=400,
                detail="Name cannot be empty."
            )

        user.full_name = data.full_name.strip()

    if data.email is not None:
        email = data.email.strip().lower()

        existing_user = (
            db.query(User)
            .filter(
                User.email == email,
                User.id != user_id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered."
            )

        user.email = email

    if data.password is not None:
        if len(data.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long."
            )

        user.password_hash = hash_password(data.password)

    if data.role is not None:
        if data.role not in ["staff", "admin"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be staff or admin."
            )

        if user.id == current_user.id and data.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="You cannot remove your own admin role."
            )

        user.role = RoleEnum(data.role)

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# DELETE STAFF / ADMIN
# ============================================================

@router.delete("/staff/{user_id}")
async def delete_staff_or_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Staff or admin account not found."
        )

    if user.role.value not in ["staff", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Only staff and admin accounts can be deleted here."
        )

    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own admin account."
        )

    db.delete(user)
    db.commit()

    return {
        "message": f"Account {user.email} deleted successfully."
    }