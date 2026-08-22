from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from backend.database.connection import engine, Base
from backend.models import user  # importing registers the model with Base
from backend.routes import auth
from backend.routes import complaints
from backend.routes import department
from backend.routes import users
from backend.routes import admin

app = FastAPI(title="Campus Problem Reporting API")

# Allow the frontend (served from a different origin/port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development only — restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our routes
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(department.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/api")
async def root():
    return {"message": "Campus Problem Reporting API is running!"}


@app.get("/test-db")
async def test_db():
    try:
        connection = engine.connect()
        connection.close()
        return {"status": "success", "message": "Database connected successfully!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Root URL redirects straight to the login page — must be registered
# BEFORE the static files mount below, or the mount will swallow "/" first
@app.get("/")
async def root_redirect():
    return RedirectResponse(url="/login.html")


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")