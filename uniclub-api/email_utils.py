"""Email sender utility. Falls back to stdout when SMTP is not configured."""
import asyncio
import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


def _send_smtp(to_email: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    host = settings.smtp_host
    port = settings.smtp_port
    if not host:
        raise RuntimeError("SMTP not configured")

    if settings.smtp_use_tls:
        with smtplib.SMTP(host, port) as smtp:
            smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password or "")
            smtp.send_message(msg)
    else:
        with smtplib.SMTP_SSL(host, port) as smtp:
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password or "")
            smtp.send_message(msg)


def send_email(to_email: str, subject: str, body: str) -> None:
    """Send an email synchronously. If SMTP isn't configured, log to stdout."""
    if not settings.smtp_host:
        logger.warning("[EMAIL OTP] To: %s | Subject: %s\n%s", to_email, subject, body)
        print(f"\n[EMAIL OTP] To: {to_email}\nSubject: {subject}\n{body}\n", flush=True)
        return
    try:
        _send_smtp(to_email, subject, body)
    except Exception as e:  # noqa: BLE001
        logger.error("SMTP send failed: %s", e)
        print(f"\n[EMAIL OTP fallback] To: {to_email}\nSubject: {subject}\n{body}\n", flush=True)


async def send_email_async(to_email: str, subject: str, body: str) -> None:
    await asyncio.to_thread(send_email, to_email, subject, body)
