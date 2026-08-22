from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta

from backend.database.connection import get_db
from backend.models.user import User, RoleEnum, StatusEnum
from backend.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse, OTPRequest, OTPVerify
from backend.auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    if user_data.role not in ["student", "admin", "staff"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be student, admin, or staff.")

    account_status = StatusEnum.pending if user_data.role == "staff" else StatusEnum.approved

    # staff only pick their working block at registration;
    # department is assigned later by admin during approval
    block = None
    if user_data.role == "staff":
        if user_data.block is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Staff accounts require a working block.")
        block = user_data.block

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=RoleEnum(user_data.role),
        status=account_status,
        department_id=None,  # set later by admin on approval
        block=block
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if user.status == StatusEnum.pending:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your staff account is pending admin approval.")

    if user.status == StatusEnum.rejected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account request was rejected. Contact admin.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/request-otp")
async def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile_number == payload.mobile_number).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found with this mobile number.")

    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)

    db.commit()

    print(f"[MOCK OTP] Mobile: {payload.mobile_number} -> OTP: {otp}")

    return {"message": "OTP sent successfully.", "otp_debug": otp}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile_number == payload.mobile_number).first()

    if not user or not user.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP was requested for this number.")

    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect OTP.")

    if user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    if user.status == StatusEnum.pending:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your staff account is pending admin approval.")

    if user.status == StatusEnum.rejected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account request was rejected. Contact admin.")

    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    return {"access_token": access_token, "token_type": "bearer", "user": user}