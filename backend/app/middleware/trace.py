import contextvars
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Contextvars allows us to securely store request-scoped trace IDs across async greenlets/tasks.
trace_id_var = contextvars.ContextVar("trace_id", default="-")


def get_trace_id() -> str:
    """Helper function to fetch the current async request's correlation trace ID."""
    return trace_id_var.get()


class TraceMiddleware(BaseHTTPMiddleware):
    """
    FastAPI HTTP Middleware that manages request correlation IDs.
    Captures X-Trace-Id from request headers or generates a new one, propagating it into
    all logs and returning it in responses to help developers track down issues easily.
    """
    async def dispatch(self, request: Request, call_next):
        # Prefer upstream trace headers (like from Vercel or a Gateway), or fall back to a fresh UUID
        trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
        
        # Set the trace ID for the lifetime of this async request execution flow
        token = trace_id_var.set(trace_id)
        
        try:
            response = await call_next(request)
            # Send the trace ID back in response headers for frontend/client diagnostic use
            response.headers["X-Trace-Id"] = trace_id
            return response
        finally:
            # Clean up/reset context variable to prevent data pollution across concurrent connections
            trace_id_var.reset(token)
