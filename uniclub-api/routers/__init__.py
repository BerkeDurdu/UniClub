from .clubs import router as clubs_router
from .advisors import router as advisors_router
from .members import router as members_router
from .board_members import router as board_members_router
from .venues import router as venues_router
from .events import router as events_router
from .budgets import router as budgets_router
from .registrations import router as registrations_router
from .participants import router as participants_router
from .messages import router as messages_router
from .sponsorships import router as sponsorships_router
from .reports import router as reports_router

all_routers = [
    clubs_router, advisors_router, members_router, board_members_router,
    venues_router, events_router, budgets_router, registrations_router,
    participants_router, messages_router, sponsorships_router, reports_router
]
