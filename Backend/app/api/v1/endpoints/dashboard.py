from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_current_user, get_dashboard_service
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_dashboard(current_user.id)