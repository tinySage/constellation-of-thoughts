from fastapi import FastAPI
from pydantic import BaseModel

from app.core.config import settings


class HealthResponse(BaseModel):
    status: str
    service: str


app = FastAPI(
    title=settings.app_name,
    description="Constellation of Thoughts backend service.",
    version=settings.app_version,
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name)
