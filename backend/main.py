from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import sys

# Load env before importing routers so they read correct values
print(f"DEBUG: Current working directory: {os.getcwd()}")
print(f"DEBUG: Python path: {sys.executable}")
print(f"DEBUG: Loading .env file...")
load_result = load_dotenv()
print(f"DEBUG: load_dotenv() result: {load_result}")
explicit_path = os.path.join(os.getcwd(), '.env')
print(f"DEBUG: Trying explicit path: {explicit_path}")
explicit_result = load_dotenv(explicit_path)
print(f"DEBUG: load_dotenv(explicit_path) result: {explicit_result}")
api_key_test = os.getenv("OPENAI_API_KEY")
print(f"DEBUG: API key after load_dotenv: {'[REDACTED]' if api_key_test else 'None'}")

from routers import simulate, ai_advice, journey, auth
from database import create_tables

app = FastAPI(
    title="FinSight API",
    description="AI-Powered Personal Financial Planner",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        create_tables()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
        # Don't fail startup if database is not available yet

# Configure CORS with production origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    # Firebase Hosting domains
    "https://finsight-frontend-e2012.web.app",
    "https://finsight-frontend-e2012.firebaseapp.com",
    "https://finsight.life"
    # Add your production domain here
    # "https://yourdomain.com",
    # "https://www.yourdomain.com",
]

# Add Cloud Run URLs dynamically
if os.getenv('GOOGLE_CLIENT_PROJECT_ID'):
    project_id = os.getenv('GOOGLE_CLIENT_PROJECT_ID')
    region = os.getenv('GCP_REGION', 'us-central1')
    origins.extend([
        f"https://finsight-frontend-{project_id}.run.app",
        f"https://finsight-backend-{project_id}.run.app"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(simulate.router, prefix="/api/v1", tags=["simulation"])
app.include_router(ai_advice.router, prefix="/api/v1", tags=["ai-advice"])
app.include_router(journey.router, tags=["journey"])

@app.get("/")
async def root():
    return {"message": "Welcome to FinSight API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable (Cloud Run requirement) or default to 8080
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port) 