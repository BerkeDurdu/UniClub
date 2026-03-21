# UniClub API Setup Guide

## Architecture Overview
This is a layered FastAP + SQLModel backend heavily leveraging PostgreSQL. The stack uses `alembic` to smoothly apply database changes.

## 1. Create and activate a virtual environment

**Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 2. Install dependencies:
```bash
pip install -r requirements.txt
```

## 3. Database setup:
Ensure you have PostgreSQL installed. Create a database named `uniclub_db`.
```sql
CREATE DATABASE uniclub_db;
```

## 4. Environment Variables:
Copy `.env.example` to `.env`. Update the `DATABASE_URL` as needed inside the `.env` file.

## 5. Migrations (Alembic):
If you make any changes to the models, you should generate an Alembic migration:
```bash
alembic revision --autogenerate -m "Add new field"
```
To apply migrations against your PostgreSQL database:
```bash
alembic upgrade head
```
*Note*: During startup, `main.py` explicitly calls `create_db_and_tables()` for convenience to automatically deploy tables when migrations are non-essential for a rapid setup. However, once schemas stabilize, use Alembic correctly!

## 6. Run the app:
```bash
uvicorn main:app --reload
```

## 7. URLs to open:
- API Docs: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health/db`

[Screenshot place folder here for future reference]
