"""Password hashing (argon2) and JWT access tokens."""

from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.config import get_settings

_hasher = PasswordHasher()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except (VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: str, role: str, minutes: int | None = None) -> tuple[str, datetime]:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(
        minutes=minutes if minutes is not None else settings.jwt_expire_minutes
    )
    token = jwt.encode(
        {"sub": user_id, "role": role, "exp": expires}, settings.jwt_secret, algorithm=ALGORITHM
    )
    return token, expires


def decode_token(token: str) -> dict:
    """Raises jwt.PyJWTError (including ExpiredSignatureError) when invalid."""
    return jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM])
