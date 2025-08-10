from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
import jwt
from datetime import datetime, timedelta
import os
from typing import Optional

from database import get_db, User
from services.database_service import DatabaseService
from services.email_service import EmailService
from services.secret_service import get_optional_secret, get_required_secret
import random

router = APIRouter()

# JWT Configuration
SECRET_KEY = get_optional_secret("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1* 24 * 60 

# Google OAuth Configuration
def _google_client_id() -> str | None:
    try:
        return get_required_secret("GOOGLE_CLIENT_ID")
    except ValueError:
        return None

# Security scheme for optional authentication
security = HTTPBearer(auto_error=False)

class GoogleAuthRequest(BaseModel):
    credential: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return {"email": email}
    except jwt.PyJWTError:
        return None

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional authentication - returns None if not authenticated"""
    if not credentials:
        return None
    
    token_data = verify_token(credentials.credentials)
    if not token_data:
        return None
    
    user = db.query(User).filter(User.email == token_data["email"]).first()
    return user

def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Required authentication - raises exception if not authenticated"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
@router.get("/auth/google-client-id")
async def get_google_client_id_endpoint():
    """Expose Google OAuth client ID for frontend initialization."""
    client_id = _google_client_id()
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured")
    return {"client_id": client_id}


@router.post("/auth/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth token"""
    try:
        # Verify the Google ID token
        client_id = _google_client_id()
        idinfo = id_token.verify_oauth2_token(
            auth_request.credential, requests.Request(), client_id
        )
        
        # Extract user information
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Get or create user
        user = DatabaseService.get_or_create_user(db, email)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at
            }
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user_required)):
    """Get current authenticated user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at
    }

@router.post("/auth/logout")
async def logout():
    """Logout endpoint (client should remove token)"""
    return {"message": "Successfully logged out"} 

# In-memory OTP store: { email: (otp, expiry_datetime) }
# otp_store = {}

# class OTPRequest(BaseModel):
#     email: str

# class OTPVerifyRequest(BaseModel):
#     email: str
#     otp: str

# @router.post("/auth/request-otp")
# async def request_otp(request: OTPRequest):
#     email = request.email.strip().lower()
#     otp = f"{random.randint(100000, 999999)}"
#     expiry = datetime.utcnow() + timedelta(minutes=10)
#     print(otp)
#     otp_store[email] = (otp, expiry)
#     EmailService.send_otp_email(email, otp)
#     return {"message": "OTP sent"}

# @router.post("/auth/verify-otp", response_model=TokenResponse)
# async def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
#     email = request.email.strip().lower()
#     otp = request.otp.strip()
#     record = otp_store.get(email)
#     if not record:
#         raise HTTPException(status_code=400, detail="No OTP requested for this email")
#     stored_otp, expiry = record
#     # if datetime.utcnow() > expiry:
#     #     del otp_store[email]
#     #     raise HTTPException(status_code=400, detail="OTP expired")
#     # if otp != stored_otp:
#     #     raise HTTPException(status_code=400, detail="Invalid OTP")
#     # OTP valid, delete it
#     del otp_store[email]
#     # Get or create user
#     user = DatabaseService.get_or_create_user(db, email)
#     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(
#         data={"sub": user.email}, expires_delta=access_token_expires
#     )
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "id": user.id,
#             "email": user.email,
#             "created_at": user.created_at
#         }
#     } 