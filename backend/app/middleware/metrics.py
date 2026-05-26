import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram

# Initialize standard Prometheus metrics
HTTP_REQUESTS_TOTAL = Counter(
    "goalforge_http_requests_total",
    "Total HTTP requests processed",
    ["method", "endpoint", "status"]
)

HTTP_REQUEST_DURATION = Histogram(
    "goalforge_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["endpoint"]
)

AI_FALLBACK_REQUESTS_TOTAL = Counter(
    "goalforge_ai_fallback_requests_total",
    "Total AI chat requests by provider and actual execution source",
    ["provider", "source"]
)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        endpoint = request.url.path
        method = request.method
        
        # Don't record metrics endpoint latency to avoid recursion/noise
        if endpoint == "/metrics":
            return await call_next(request)
            
        start_time = time.time()
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status=response.status_code
            ).inc()
            
            HTTP_REQUEST_DURATION.labels(
                endpoint=endpoint
            ).observe(duration)
            
            return response
        except Exception as exc:
            duration = time.time() - start_time
            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status=500
            ).inc()
            
            HTTP_REQUEST_DURATION.labels(
                endpoint=endpoint
            ).observe(duration)
            raise exc
