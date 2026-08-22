from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.schemas.user import UserResponse
from backend.auth.dependencies import get_current_user
from backend.auth.security import hash_password
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/users", tags=["Users"])


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
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        current_user.full_name = data.full_name.strip()

    if data.password is not None:
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        current_user.password_hash = hash_password(data.password)

    if data.block is not None:
        if current_user.role.value != "staff":
            raise HTTPException(status_code=400, detail="Only staff accounts have a working block.")
        current_user.block = data.block

    db.commit()
    db.refresh(current_user)

    return current_user