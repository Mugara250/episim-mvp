from datetime import datetime

from app.schemas.base import CamelModel


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str
    title: str | None = None
    institution_id: str | None = None
    institution_name: str | None = None
    status: str
    can_edit_builtins: bool = False
    is_demo: bool = False
    last_login: datetime | None = None

    @classmethod
    def of(cls, u) -> "UserOut":
        return cls(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            title=u.title,
            institution_id=u.institution_id,
            institution_name=u.institution.name if u.institution else None,
            status=u.status,
            can_edit_builtins=u.can_edit_builtins,
            is_demo=u.is_demo,
            last_login=u.last_login,
        )
