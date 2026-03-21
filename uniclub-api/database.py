from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from config import settings

# Create the SQLModel engine
# We use PostgreSQL strictly as a robust relational database capable of handling
# constraints and production-level loads.
engine = create_engine(settings.database_url, echo=settings.debug)

def create_db_and_tables():
    """
    Creates all defined SQLModel tables in the database.
    Note: If you run Alembic migrations (e.g., alembic upgrade head), you may not 
    need this. However, it is kept here for development convenience to quickly 
    bootstrap the initial schema.
    """
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """
    Provides a generator that yields a database session.
    Dependency injection in FastAPI will use this to automatically give each route a fresh Session.
    """
    with Session(engine) as session:
        yield session
