from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api import router
from backend.app.api_newa import router_newa
from backend.app.config import FRONTEND_ORIGINS, KOL_PORTRAIT_DIR


app = FastAPI(title="DragonWay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(router_newa)

if KOL_PORTRAIT_DIR.exists():
    app.mount("/assets/kols", StaticFiles(directory=KOL_PORTRAIT_DIR), name="kol-assets")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
