from typing import Callable, Iterable

from fastapi import Depends, HTTPException

from app.api.deps import get_current_user
from app.models.user import User


def require_roles(roles: Iterable[str]) -> Callable:
    allowed = set(roles)

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role not in allowed:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user

    return dependency


def ensure_self_or_roles(target_user_id: int, current_user: User, roles: Iterable[str]) -> None:
    allowed = set(roles)
    if current_user.id == target_user_id:
        return
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Access denied")
