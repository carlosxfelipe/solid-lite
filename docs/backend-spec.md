# Backend Specification (SDD) - FastAPI Auth

This document outlines the implementation of a FastAPI backend to replace the mock authentication in the Solid Lite frontend.

## 1. Setup Instructions

The backend uses **Python 3.12** and **uv** for fast dependency management.

```bash
# Initialize the project
uv init solid-auth-backend --python 3.12
cd solid-auth-backend

# Add FastAPI and dependencies (using quotes for shell safety)
uv add "fastapi[standard]" "PyJWT" "passlib[bcrypt]"
```

## 2. Implementation (`main.py`)

Create a `main.py` file with the following content. This implementation includes CORS support, JWT token generation, and the endpoints required by the frontend.

```python
import uvicorn
import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import jwt

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

# IMPORTANT: Configure CORS for your Solid Lite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Updated to allow connections from any origin for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock User DB
USER_DB = {
    "admin@example.com": "admin123"
}

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/auth/login", response_model=Token)
async def login(request: LoginRequest):
    stored_password = USER_DB.get(request.email)
    if not stored_password or stored_password != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": request.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/user/profile")
async def get_profile():
    return {"email": "admin@example.com", "status": "active"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
```

## 3. Running the Server

The backend runs on its default port **8000**, while the Solid Lite frontend runs on port **3000**.

### Development Mode

Uses auto-reload for a better developer experience.

```bash
uv run fastapi dev main.py
```

### Production Mode

Optimized for performance.

```bash
uv run fastapi run main.py
```

## 4. Frontend Integration

Once the backend is running at `http://localhost:8000`, update `src/router/auth.ts` in the Solid Lite project:

1.  Set `API_BASE` to `http://localhost:8000`.
2.  The framework will automatically store the `access_token` in `sessionStorage` (as `authToken`) and handle JWT expiry checks.
3.  Use `authFetch()` for subsequent authenticated calls to endpoints like `/api/user/profile`.
