"""Structured JSON logging setup with automatic trace_id injection."""

import logging
import sys
from pythonjsonlogger.json import JsonFormatter


class CustomJsonFormatter(JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        # Inject trace_id dynamically from contextvars
        try:
            from app.middleware.trace import get_trace_id
            log_record["trace_id"] = get_trace_id()
        except Exception:
            log_record["trace_id"] = "-"


def get_logger(name: str = "goalforge") -> logging.Logger:
    logger = logging.getLogger(name)
    # Clear existing handlers to prevent duplicate or unstructured output
    if logger.handlers:
        logger.handlers.clear()
        
    handler = logging.StreamHandler(sys.stdout)
    formatter = CustomJsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s %(trace_id)s %(provider)s %(execution_time_ms)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger
