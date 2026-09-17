from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.analyzers.error_analyzer import analyze_error
from app.analyzers.network_analyzer import analyze_network_request
from app.analyzers.stacktrace_analyzer import parse_stacktrace
from app.analyzers.github_analyzer import analyze_github_repo
from app.db import init_db, save_error_event, get_recent_errors, save_report, get_reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="DevLens Diagnostic API",
    description="Privacy-first, local developer diagnostics engine",
    version="1.1.0",
    lifespan=lifespan
)

# Allow local browser extension and localhost web applications
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class ErrorPayload(BaseModel):
    message: str = Field(..., description="JavaScript runtime error message")
    stack: Optional[str] = Field("", description="Raw stack trace string")
    url: Optional[str] = Field("", description="Page URL where error was triggered")
    source_file: Optional[str] = Field("", description="Source filename")
    line: Optional[int] = Field(0, description="Source line number")
    col: Optional[int] = Field(0, description="Source column number")

class NetworkPayload(BaseModel):
    method: str = Field("GET", description="HTTP Method")
    url: str = Field(..., description="Requested URL")
    status: int = Field(..., description="HTTP response status code")
    duration_ms: Optional[float] = Field(0.0, description="Roundtrip duration in ms")

class StacktracePayload(BaseModel):
    raw_trace: str = Field(..., description="Raw stack trace text")

class GitHubPayload(BaseModel):
    repo: str = Field(..., description="GitHub repository slug (owner/repo) or URL")

class ReportPayload(BaseModel):
    title: str = Field(..., description="Report title")
    content: str = Field(..., description="Report markdown or json content")
    report_format: Optional[str] = Field("markdown", description="Format: markdown or json")

# --- Routes ---
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "version": "1.1.0",
        "service": "DevLens Analysis Engine",
        "mode": "local-first"
    }

@app.post("/api/analyze/error")
def analyze_error_endpoint(payload: ErrorPayload):
    analysis = analyze_error(
        message=payload.message,
        stack=payload.stack,
        source_file=payload.source_file,
        line=payload.line
    )
    # Save to local SQLite database asynchronously / background
    save_error_event(
        url=payload.url,
        message=payload.message,
        source_file=payload.source_file,
        line=payload.line,
        analysis=analysis
    )
    return analysis

@app.get("/api/errors/recent")
def recent_errors_endpoint(limit: int = 20):
    return get_recent_errors(limit=limit)

@app.post("/api/analyze/network")
def analyze_network_endpoint(payload: NetworkPayload):
    return analyze_network_request(
        method=payload.method,
        url=payload.url,
        status=payload.status,
        duration_ms=payload.duration_ms
    )

@app.post("/api/analyze/stacktrace")
def analyze_stacktrace_endpoint(payload: StacktracePayload):
    return parse_stacktrace(payload.raw_trace)

@app.post("/api/github/analyze")
async def analyze_github_endpoint(payload: GitHubPayload):
    result = await analyze_github_repo(payload.repo)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/reports")
def create_report_endpoint(payload: ReportPayload):
    report_id = save_report(payload.title, payload.content, payload.report_format)
    return {"id": report_id, "status": "saved"}

@app.get("/api/reports")
def list_reports_endpoint():
    return get_reports()
