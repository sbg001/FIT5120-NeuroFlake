from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from behavior_engine import load_model
from core import close_db_pool, initialize_db_pool
from routes.assistant import router as assistant_router
from routes.auth import router as auth_router
from routes.emotions import router as emotions_router
from routes.parent_dashboard import router as parent_dashboard_router
from routes.rewards import router as rewards_router
from routes.routines import router as routines_router
from routes.support import router as support_router
from routes.tasks import router as tasks_router
from routes import emotion_engine

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    print("Booting up backend services...")
    load_model()
    initialize_db_pool()


@app.on_event("shutdown")
async def shutdown_event():
    close_db_pool()


app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(routines_router)
app.include_router(emotions_router)
app.include_router(parent_dashboard_router)
app.include_router(support_router)
app.include_router(assistant_router)
app.include_router(rewards_router)
app.include_router(emotion_engine.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)