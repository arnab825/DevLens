# DevLens - Technical Requirements Document (TRD)

## 1. System Architecture
DevLens uses a decoupled, local-first hybrid architecture:
```text
┌─────────────────────────────────────────────────────────────┐
│                       Browser Tab Context                   │
│  Web Application Under Debugging                            │
│  └─► [content/collector.js] (Monitors Error & Network)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ chrome.runtime.sendMessage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DevLens Chrome Extension                 │
│  ├─► [background/service_worker.js] (Badge & Event routing) │
│  └─► [popup/popup.html] (Interactive Developer UI)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP fetch (http://127.0.0.1:8000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   DevLens Python Backend                    │
│  FastAPI (Uvicorn ASGI)                                     │
│  ├── /api/health                                            │
│  ├── /api/analyze/error                                     │
│  ├── /api/analyze/network                                   │
│  ├── /api/analyze/stacktrace                                │
│  ├── /api/github/analyze                                    │
│  └── /api/reports                                           │
│  Engine Modules:                                            │
│  ├── ErrorAnalyzer (Deterministic regex & rule heuristics)  │
│  ├── NetworkAnalyzer (HTTP semantics & CORS detection)      │
│  ├── StacktraceAnalyzer (JS/Python parser)                  │
│  └── DB (stdlib sqlite3 with WAL mode)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Specifications

### 2.1 Health Check
- **Route**: `GET /api/health`
- **Response** `200 OK`:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "service": "DevLens Analysis Engine"
}
```

### 2.2 Error Analysis Endpoint
- **Route**: `POST /api/analyze/error`
- **Request Body**:
```json
{
  "message": "TypeError: Cannot read properties of undefined (reading 'avatar')",
  "stack": "TypeError: Cannot read properties of undefined...\n at UserProfile (UserProfile.jsx:42:15)",
  "url": "http://localhost:3000/profile",
  "source_file": "UserProfile.jsx",
  "line": 42,
  "col": 15
}
```
- **Response** `200 OK`:
```json
{
  "type": "TypeError",
  "category": "Undefined Property Access",
  "summary": "An attempt was made to read a property ('avatar') from an object that evaluated to undefined or null.",
  "possible_causes": [
    "Asynchronous data has not finished loading before initial render",
    "API payload contract changed or returned an unexpected null value",
    "Incorrect object nesting or typo in field name"
  ],
  "suggested_checks": [
    "Add optional chaining (e.g. user?.avatar) or a loading state guard",
    "Log the incoming payload immediately before accessing the property",
    "Inspect the Network tab to ensure API returned the expected object schema"
  ]
}
```

### 2.3 Network Inspection Endpoint
- **Route**: `POST /api/analyze/network`
- **Request Body**:
```json
{
  "url": "http://api.internal/v1/users",
  "method": "POST",
  "status": 401,
  "duration_ms": 142,
  "content_type": "application/json"
}
```
- **Response** `200 OK`:
```json
{
  "status": 401,
  "category": "Authentication Failure",
  "summary": "The target endpoint requires valid user authentication credentials.",
  "possible_causes": [
    "Missing Authorization header or expired JWT bearer token",
    "Invalid API key or session cookie expired"
  ],
  "suggested_checks": [
    "Verify Authorization header is being attached to the outgoing request",
    "Check token expiration timestamp in local storage or session"
  ]
}
```

### 2.4 Stack Trace Parsing Endpoint
- **Route**: `POST /api/analyze/stacktrace`
- **Request Body**:
```json
{
  "raw_trace": "Traceback (most recent call last):\n  File \"app/service.py\", line 42, in get_user\n    return db[user_id]\nKeyError: 'user_123'"
}
```
- **Response** `200 OK`:
```json
{
  "language": "python",
  "exception_type": "KeyError",
  "message": "'user_123'",
  "frames": [
    {
      "file": "app/service.py",
      "line": 42,
      "function": "get_user",
      "code": "return db[user_id]"
    }
  ],
  "root_cause_summary": "Accessing dictionary key that does not exist in the map."
}
```

### 2.5 GitHub Repository Analysis Endpoint
- **Route**: `POST /api/github/analyze`
- **Request Body**:
```json
{
  "repo_url": "https://github.com/torvalds/linux"
}
```
- **Response** `200 OK`:
```json
{
  "owner": "torvalds",
  "repo": "linux",
  "health_score": 85,
  "categories": {
    "documentation": 90,
    "testing": 80,
    "configuration": 95,
    "ci_cd": 75
  },
  "checks": [
    {"name": "README.md", "passed": true, "details": "Found in repository root"},
    {"name": "LICENSE", "passed": true, "details": "GPL-2.0 detected"},
    {"name": ".env.example", "passed": false, "details": "No environment example file found"}
  ]
}
```

---

## 3. Data Sanitization & Security Architecture
Content scripts apply deterministic regex filters prior to saving in `chrome.storage.local` or transmitting over loopback:
```javascript
function sanitizeData(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1********')
    .replace(/(api[_-]?key|secret|token|password)[\s]*[=:][\s]*["']?[^"'\s&]+["']?/gi, '$1=********')
    .replace(/cookie:\s*([^;\r\n]+)/gi, 'cookie: ********');
}
```

---

## 4. SQLite Storage Schema
The local database uses SQLite with WAL (Write-Ahead Logging) enabled.
```sql
CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    page_url TEXT,
    error_message TEXT,
    source_file TEXT,
    line_number INTEGER,
    stack_trace TEXT,
    analysis_json TEXT
);

CREATE TABLE IF NOT EXISTS network_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    page_url TEXT,
    method TEXT,
    status_code INTEGER,
    duration_ms REAL,
    category TEXT
);
```
