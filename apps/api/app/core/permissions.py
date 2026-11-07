from typing import Dict, Any
from app.core.exceptions import ForbiddenError

def assert_resource_owner(user_context: Dict[str, Any], resource_user_id: str) -> None:
    """
    Enforces tenant resource ownership check.
    Prevents cross-user access to documents, chats, or personal evaluations.
    """
    current_uid = user_context.get("sub") or user_context.get("id")
    if not current_uid:
        raise ForbiddenError("User context missing identity claims.")
    if str(current_uid) != str(resource_user_id):
        raise ForbiddenError("Access to this resource is prohibited.")
