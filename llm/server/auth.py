from fastapi import Header, HTTPException


def require_bearer_token(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: require a Bearer Authorization header.

    Returns the full 'Bearer <token>' string so it can be forwarded verbatim
    to the Node API server, which verifies the Firebase ID token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return authorization
