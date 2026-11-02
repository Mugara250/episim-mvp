"""FastAPI dependencies: database session, current user, permission checks."""

from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.rbac import access_level, has_any, has_level
from app.core.security import decode_token
from app.db import get_db
from app.models import User

bearer = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")
    try:
        payload = decode_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again."
        ) from None
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session token.") from None
    user = db.get(User, payload.get("sub"))
    if user is None or user.status != "Active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "This account is not active.")
    return user


def forbid(message: str = "Your role does not have access to this.") -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, message)


def require(module: str, minimum: str = "read") -> Callable[..., User]:
    """Dependency: the user's role must hold at least `minimum` on `module` (see core/rbac.py)."""

    def check(user: User = Depends(current_user)) -> User:
        if not has_level(user.role, module, minimum):
            raise forbid(
                f"Your role ({user.role}) has '{access_level(user.role, module)}' access to {module}; "
                f"'{minimum}' is needed."
            )
        return user

    return check


def require_any(modules: list[str], minimum: str = "read") -> Callable[..., User]:
    def check(user: User = Depends(current_user)) -> User:
        if not has_any(user.role, modules, minimum):
            raise forbid()
        return user

    return check
