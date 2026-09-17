from typing import Dict, Any

STATUS_CATEGORIES = {
    400: {
        "category": "Bad Request",
        "summary": "The server could not understand the request due to malformed syntax or validation errors.",
        "causes": ["Invalid request body/payload", "Missing required query parameters", "Schema validation failure"],
        "suggestions": ["Inspect request payload against API specification", "Verify query parameter encoding"]
    },
    401: {
        "category": "Unauthorized",
        "summary": "Authentication credentials are missing, invalid, or expired.",
        "causes": ["Missing Bearer token or Authorization header", "Expired session cookie or JWT", "Revoked API key"],
        "suggestions": ["Verify token presence in request headers", "Refresh auth token or re-authenticate session"]
    },
    403: {
        "category": "Forbidden",
        "summary": "Authenticated client does not have permission to access the requested resource.",
        "causes": ["Insufficient user role or ACL permissions", "CSRF token mismatch", "IP whitelist restriction"],
        "suggestions": ["Verify user privileges for this resource", "Ensure CSRF token is attached if mutating data"]
    },
    404: {
        "category": "Not Found",
        "summary": "The target endpoint URL or resource could not be found on the server.",
        "causes": ["Typo in API URL path", "Missing base URL prefix (e.g. missing /api/v1)", "Resource deleted"],
        "suggestions": ["Check URL path spelling and routing definitions", "Confirm backend route registration"]
    },
    422: {
        "category": "Unprocessable Entity",
        "summary": "The request was well-formed but contained semantic validation errors.",
        "causes": ["Missing required field in JSON payload", "Data type mismatch (e.g. string passed instead of int)"],
        "suggestions": ["Inspect response error body for field-level validation errors", "Check Pydantic/Zod schema"]
    },
    429: {
        "category": "Rate Limited",
        "summary": "Client has sent too many requests in a given amount of time.",
        "causes": ["Exceeded API rate quota", "Rapid polling or retry storm without exponential backoff"],
        "suggestions": ["Check Retry-After response header", "Implement client-side request throttling or debouncing"]
    },
    500: {
        "category": "Internal Server Error",
        "summary": "The server encountered an unexpected condition that prevented it from fulfilling the request.",
        "causes": ["Unhandled exception in backend route handler", "Database connection dropped or timed out"],
        "suggestions": ["Check backend application logs and error reporting service", "Verify database and service health"]
    },
    502: {
        "category": "Bad Gateway",
        "summary": "Reverse proxy or gateway received an invalid response from upstream server.",
        "causes": ["Upstream application process crashed or is restarting", "Nginx/Caddy misconfigured upstream port"],
        "suggestions": ["Check if backend app server (e.g. Uvicorn, Gunicorn, Node) is running"]
    },
    503: {
        "category": "Service Unavailable",
        "summary": "The server is currently unable to handle the request due to maintenance or overload.",
        "causes": ["Server overloaded or temporary maintenance in progress", "Health check failed in cluster"],
        "suggestions": ["Verify service status and resource capacity", "Retry with exponential backoff"]
    },
    504: {
        "category": "Gateway Timeout",
        "summary": "Upstream server failed to respond within the gateway's timeout window.",
        "causes": ["Long-running database query or external API dependency blocking", "Timeout threshold set too low"],
        "suggestions": ["Check for slow database queries or optimize upstream processing"]
    }
}

def analyze_network_request(method: str, url: str, status: int, duration_ms: float = 0.0) -> Dict[str, Any]:
    info = STATUS_CATEGORIES.get(status)
    if info:
        category = info["category"]
        summary = info["summary"]
        causes = info["causes"]
        suggestions = info["suggestions"]
    elif 200 <= status < 300:
        category = "Success"
        summary = f"Request succeeded with status {status}."
        causes = []
        suggestions = []
    elif status == 0:
        category = "Network / CORS Failure"
        summary = "Request was blocked by the browser or network connection failed completely."
        causes = ["CORS policy violation (missing Access-Control-Allow-Origin)", "Target host unreachable or DNS error"]
        suggestions = ["Verify CORS headers on the remote server", "Check network connection and protocol (HTTPS vs HTTP)"]
    else:
        category = f"HTTP {status}"
        summary = f"Server returned unexpected HTTP status code {status}."
        causes = ["Unexpected status code"]
        suggestions = ["Review server logs and API documentation"]

    # Latency evaluation
    latency_flag = None
    if duration_ms > 2000:
        latency_flag = "Critical: Request took > 2000ms. Consider caching or async processing."
    elif duration_ms > 800:
        latency_flag = "Warning: Slow response (> 800ms)."

    return {
        "method": method.upper(),
        "url": url,
        "status": status,
        "duration_ms": duration_ms,
        "category": category,
        "summary": summary,
        "possible_causes": causes,
        "suggested_checks": suggestions,
        "latency_warning": latency_flag
    }
