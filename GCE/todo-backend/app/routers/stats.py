from fastapi import APIRouter, Query
from typing import Optional

from app.models import (
    StatsResponse,
    TaskStatistics,
    ContributionResponse,
    ContributionDay,
    ContributionSummary,
)
from app.storage import storage

router = APIRouter(tags=["Statistics"])


@router.get("/stats", response_model=StatsResponse)
def get_statistics():
    """Get task statistics"""
    stats = storage.get_statistics()
    return StatsResponse(data=TaskStatistics(**stats))


@router.get("/contributions", response_model=ContributionResponse)
def get_contributions(
    startDate: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(365, ge=1, le=365, description="Number of days back"),
):
    """Get contribution data for the contribution graph"""
    contributions, summary = storage.get_contributions(
        start_date=startDate, end_date=endDate, days=days
    )

    return ContributionResponse(
        data=[ContributionDay(**c) for c in contributions],
        summary=ContributionSummary(**summary),
    )
