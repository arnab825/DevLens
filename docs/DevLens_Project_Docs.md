# DevLens

## Developer Browser Extension + Python Analysis Platform

DevLens is a privacy-first browser extension for developers. It helps developers debug web applications, inspect API/network activity, analyze GitHub repositories, understand stack traces, and generate actionable developer reports.

The project is designed as a serious portfolio project, not as a simple AI wrapper.

---

# 1. Project Vision

### Problem

Developers constantly switch between browser DevTools, Postman, GitHub, terminal tools, documentation, and AI assistants while debugging applications.

Common problems include:

- confusing console errors
- failed API requests
- CORS errors
- authentication failures
- difficult stack traces
- poorly documented repositories
- missing environment configuration
- outdated dependencies
- unclear project setup instructions

### Solution

DevLens brings useful developer diagnostics into one browser extension.

The extension collects only the information required for the current analysis and communicates with a local Python backend.

### Core principle

> Local-first, developer-focused, explainable diagnostics.

The first version should work without a paid AI API.

---

# 2. Main Features

## MVP Features

### A. Console Error Detector

Detect JavaScript runtime errors from the current webpage.

Display:

- error message
- source file
- line number
- column number
- stack trace
- occurrence count
- first/last occurrence

Example:

```text
TypeError: Cannot read properties of undefined
File: UserProfile.jsx
Line: 42

Possible cause:
An object is undefined before accessing one of its properties.

Suggested checks:
1. Verify the API response.
2. Check whether user.profile exists.
3. Consider optional chaining where appropriate.
```

Do not claim that a suggested cause is definitely the cause.

---

## B. Network / API Inspector

Monitor requests made by the page.

Capture safe metadata such as:

- HTTP method
- URL
- status code
- duration
- request type
- response content type
- request size
- response size

Example:

```text
POST /api/login
Status: 401
Duration: 183 ms

Possible categories:
- Authentication failure
- Invalid credentials
- Expired token
```

### Security requirement

Never automatically store or transmit:

- cookies
- authorization headers
- passwords
- API keys
- access tokens
- session tokens
- sensitive request bodies

Provide explicit controls when sensitive information must be inspected.

---

## C. Stack Trace Analyzer

Accept stack traces from:

- JavaScript
- TypeScript
- Python
- Java
- C/C++
- PHP

Parse:

- exception type
- message
- file
- line
- function
- call chain

Example:

```text
Exception:
KeyError

File:
app/services/user.py

Line:
82

Function:
get_user()

Analysis:
The code attempted to access a dictionary key that does not exist.

Suggested checks:
- Verify the key exists.
- Inspect the API/database response.
- Use dict.get() when an optional key is expected.
```

---

## D. GitHub Repository Analyzer

When the user opens a public GitHub repository, DevLens should analyze repository structure.

Check for:

```text
README.md
LICENSE
.gitignore
.env.example
Dockerfile
docker-compose.yml
package.json
requirements.txt
pyproject.toml
pom.xml
tests/
.github/workflows/
```

Analyze:

- documentation completeness
- project structure
- dependency configuration
- testing presence
- CI/CD presence
- environment configuration
- large files
- repository activity
- common setup problems

Example:

```text
Repository Health

Documentation
42%

Testing
31%

Configuration
70%

CI/CD
100%

Detected issues:

⚠ No .env.example
⚠ README lacks installation instructions
⚠ No test directory detected
✓ GitHub Actions workflow detected
```

Avoid presenting these percentages as objective software quality scores. They should represent transparent checks defined by DevLens.

---

## E. Developer Report

Generate a report containing:

```text
DevLens Report

Project/Page:
example.com

Console:
3 errors
7 warnings

Network:
2 failed requests
1 slow request

Potential problems:
- API returned HTTP 500
- Missing frontend environment variable
- CORS configuration may be incorrect

Recommended checks:
1. Inspect backend logs.
2. Verify environment variables.
3. Check CORS configuration.
```

Allow export as:

- Markdown
- JSON
- text

PDF can be added later.

---

# 3. Future Features

Do not build these during the first MVP.

Potential future features:

- local LLM explanations
- Ollama integration
- LM Studio integration
- code snippet generation
- automatic curl generation
- GitHub pull request analysis
- dependency vulnerability analysis
- accessibility scanner
- performance diagnostics
- Docker project analyzer
- local project environment checker
- VS Code integration
- mobile companion dashboard
- team reports

---

# 4. Recommended Technology Stack

## Browser Extension

Use:

- TypeScript
- React
- Tailwind CSS
- Chrome Extension Manifest V3

The same extension should eventually support Chromium browsers such as:

- Google Chrome
- Microsoft Edge
- Brave

---

## Python Backend

Use:

- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic
- SQLite

Optional:

- SQLAlchemy
- Alembic

Python should be responsible for analysis and processing, not the browser UI.

---

## Storage

Start with:

```text
SQLite
```

Store only non-sensitive diagnostic information.

Later:

```text
PostgreSQL
```

can be introduced if a cloud/team version is required.

---

## Optional Local AI

Use:

```text
Ollama
```

or:

```text
LM Studio
```

AI should be an optional analysis layer.

The application must still function without AI.

---

# 5. High-Level Architecture

```text
                    ┌─────────────────────────┐
                    │      Browser Tab        │
                    │                         │
                    │ Web Application         │
                    └────────────┬────────────┘
                                 │
                         Browser APIs
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   DevLens Extension     │
                    │                         │
                    │ React UI                │
                    │ Content Scripts         │
                    │ Service Worker          │
                    │ Network Collector       │
                    └────────────┬────────────┘
                                 │
                       localhost HTTP/WebSocket
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      FastAPI            │
                    │    Python Backend       │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       Error Analyzer      API Analyzer      GitHub Analyzer
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │    SQLite    │
                         └──────────────┘
                                 │
                                 ▼
                       Optional Local LLM
```

---

# 6. Repository Structure

Recommended monorepo:

```text
devlens/
│
├── extension/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── background/
│   │   ├── content/
│   │   ├── popup/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── public/
│   ├── manifest.json
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── dependencies.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── analyzers/
│   │   │   ├── errors/
│   │   │   ├── network/
│   │   │   ├── github/
│   │   │   └── stacktrace/
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── security.md
│   └── development.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# 7. Development Phases

## Phase 1: Project Setup

### Extension

Create:

- React + TypeScript application
- Manifest V3
- popup page
- options page
- background service worker
- content script

### Backend

Create:

- FastAPI application
- `/api/health`
- CORS configuration for local development
- Pydantic schemas
- test setup

Expected result:

```text
GET http://127.0.0.1:8000/api/health

{
  "status": "ok"
}
```

---

# 8. Phase 2: Extension ↔ Python Communication

The extension should communicate with the local backend.

Example:

```text
Extension
   │
   │ POST /api/analyze/error
   ▼
FastAPI
   │
   ▼
Error Analyzer
   │
   ▼
JSON response
```

Example response:

```json
{
  "exception": "TypeError",
  "message": "Cannot read properties of undefined",
  "file": "UserProfile.jsx",
  "line": 42,
  "possible_causes": [
    "Object may be undefined",
    "API response may be incomplete"
  ]
}
```

---

# 9. Phase 3: Console Monitoring

Create a content/injected monitoring system.

Capture:

```text
window.onerror
unhandledrejection
```

Important:

The extension should not attempt to secretly capture unrelated private information.

Only collect diagnostic events needed by DevLens.

Data model:

```text
ConsoleError
-------------------------
id
timestamp
url
message
source_file
line
column
stack
severity
```

---

# 10. Phase 4: Network Monitoring

Implement network diagnostics.

Track:

```text
GET
POST
PUT
PATCH
DELETE
OPTIONS
```

Record:

```text
method
url
status
duration
resource_type
request_size
response_size
content_type
timestamp
```

Do not store credentials or authentication secrets.

Add a masking layer before data reaches the backend.

Example:

```text
Authorization: Bearer ********
Cookie: ********
api_key=********
password=********
token=********
```

---

# 11. Phase 5: API Analysis Engine

Create rules for common API problems.

Examples:

### 400

```text
Possible category:
Invalid request
```

### 401

```text
Possible category:
Authentication failure
```

### 403

```text
Possible category:
Authorization / permission problem
```

### 404

```text
Possible category:
Incorrect endpoint or resource
```

### 429

```text
Possible category:
Rate limiting
```

### 500

```text
Possible category:
Server-side failure
```

Do not tell users that an HTTP status code proves the exact underlying bug.

---

# 12. Phase 6: Stack Trace Parser

Implement separate parsers.

```text
JavaScriptParser
PythonParser
JavaParser
CppParser
PHPParser
```

Common interface:

```text
parse(stack_trace)
```

Return:

```json
{
  "language": "python",
  "exception": "KeyError",
  "message": "username",
  "frames": [
    {
      "file": "user.py",
      "line": 82,
      "function": "get_user"
    }
  ]
}
```

Use unit tests for every parser.

---

# 13. Phase 7: GitHub Analyzer

Use the GitHub API for repository metadata.

Analyze:

```text
Repository metadata
Languages
Branches
Commits
Issues
Pull requests
Releases
Workflows
Repository files
```

Check repository files.

Example:

```text
package.json
requirements.txt
README.md
Dockerfile
.env.example
.github/workflows/
tests/
```

Build independent checks.

Example:

```text
ReadmeCheck
LicenseCheck
EnvironmentCheck
TestingCheck
CICheck
DependencyCheck
DockerCheck
```

Each checker should return:

```json
{
  "check": "Environment configuration",
  "status": "warning",
  "message": "No .env.example detected",
  "evidence": [
    "Repository root was scanned"
  ]
}
```

---

# 14. Phase 8: Developer Dashboard

Dashboard sections:

```text
Overview
│
├── Console
├── Network
├── Errors
├── Stack Traces
├── GitHub
└── Reports
```

Recommended UI:

```text
┌─────────────────────────────────────────┐
│ DevLens                         Settings │
├─────────────────────────────────────────┤
│                                         │
│ Current Page                            │
│ example.com                             │
│                                         │
│ Errors        API Failures      Warnings │
│    3              2               7     │
│                                         │
├─────────────────────────────────────────┤
│ Recent Problems                         │
│                                         │
│ 500  POST /api/payment                  │
│ TypeError UserProfile.jsx:42            │
│ CORS  GET /api/user                     │
│                                         │
└─────────────────────────────────────────┘
```

Keep the UI simple.

Do not use excessive animations.

---

# 15. API Design

## Health

```http
GET /api/health
```

## Error Analysis

```http
POST /api/analyze/error
```

## Stack Trace Analysis

```http
POST /api/analyze/stacktrace
```

## Network Analysis

```http
POST /api/analyze/network
```

## GitHub Repository

```http
POST /api/github/analyze
```

## Reports

```http
GET /api/reports
POST /api/reports
GET /api/reports/{id}
DELETE /api/reports/{id}
```

---

# 16. API Request Example

```json
{
  "message": "Cannot read properties of undefined",
  "stack": "TypeError: ...",
  "url": "https://example.com/profile",
  "source_file": "UserProfile.jsx",
  "line": 42
}
```

Response:

```json
{
  "type": "TypeError",
  "summary": "A property was accessed on an undefined value.",
  "possible_causes": [
    "Missing API data",
    "Incorrect object path",
    "Component rendered before data was available"
  ],
  "suggested_checks": [
    "Inspect the API response",
    "Verify the object exists before property access"
  ]
}
```

---

# 17. AI Integration

AI should be added only after the rule-based system works.

Architecture:

```text
Input
 │
 ▼
Rule-based Analyzer
 │
 ├── High-confidence result
 │
 └── Needs explanation
          │
          ▼
     Local LLM
          │
          ▼
     Explanation
```

Prefer:

```text
Ollama
LM Studio
```

The AI layer should receive sanitized information.

Never send secrets to the model.

---

# 18. Privacy & Security

This is one of the most important parts of DevLens.

## Never collect by default

```text
Passwords
Cookies
Session tokens
Authorization headers
API keys
Private repository source code
Personal form data
Credit card information
```

## Local-first behavior

Default architecture:

```text
Browser
  ↓
localhost
  ↓
Python
```

No cloud account should be required for the MVP.

## Data deletion

Provide:

```text
Clear current session
Clear all history
Export data
```

---

# 19. Permissions

Request the minimum browser permissions necessary.

Avoid:

```text
<all_urls>
```

unless the feature genuinely requires it.

Explain permissions clearly to users.

For example:

```text
DevLens needs access to page diagnostics so it can
detect console errors and network failures.
```

Do not request permissions simply because they may be useful later.

---

# 20. Testing Strategy

## Backend

Use:

```text
pytest
```

Test:

- API routes
- stack trace parsers
- error analyzers
- network rules
- GitHub checks
- sanitization
- database operations

Example:

```text
tests/
├── test_health.py
├── test_stacktrace.py
├── test_error_analyzer.py
├── test_network_analyzer.py
├── test_github_analyzer.py
└── test_sanitizer.py
```

## Extension

Test:

- popup rendering
- error collection
- message passing
- backend communication
- permissions
- failure states

---

# 21. Error Handling

Never allow the extension to fail silently.

Example:

```text
Python backend is not running.

DevLens cannot perform advanced analysis.

Start the local DevLens backend and try again.
```

Backend unavailable should not crash the extension.

---

# 22. Performance Requirements

The extension should remain lightweight.

Targets:

- popup opens quickly
- no continuous heavy CPU processing
- network monitoring should not block requests
- analysis should run asynchronously
- old diagnostic events should be cleaned up
- avoid sending every event immediately to Python

Use batching where appropriate.

---

# 23. GitHub Rate Limits

Do not repeatedly call GitHub APIs.

Use caching.

Example:

```text
Repository
     │
     ▼
Cache
     │
     ├── Fresh → return cached result
     │
     └── Expired → GitHub API
```

Respect GitHub API limits and terms.

---

# 24. Configuration

Backend `.env.example`:

```env
APP_ENV=development
HOST=127.0.0.1
PORT=8000
DATABASE_URL=sqlite:///./devlens.db
GITHUB_TOKEN=
AI_PROVIDER=none
OLLAMA_URL=http://127.0.0.1:11434
```

Never commit:

```text
.env
API keys
GitHub tokens
private certificates
database files
```

---

# 25. Git Workflow

Use:

```text
main
develop
feature/*
fix/*
```

Example:

```text
feature/console-monitor
feature/api-inspector
feature/github-analyzer
feature/stacktrace-parser
fix/network-sanitization
```

Use meaningful commits:

```text
feat: add console error collector
feat: add Python stack trace parser
fix: mask authorization headers
test: add GitHub repository checks
docs: add local setup instructions
```

---

# 26. Development Order

Follow this exact order.

```text
1. Repository setup
        ↓
2. FastAPI health endpoint
        ↓
3. Browser extension skeleton
        ↓
4. Extension ↔ FastAPI communication
        ↓
5. Console error collection
        ↓
6. Error analysis
        ↓
7. Network monitoring
        ↓
8. API analysis
        ↓
9. Stack trace parser
        ↓
10. GitHub analyzer
        ↓
11. Dashboard
        ↓
12. Report generation
        ↓
13. Tests
        ↓
14. Security hardening
        ↓
15. Optional local AI
```

Do not start with AI.

---

# 27. MVP Definition

The MVP is complete when a developer can:

```text
1. Install DevLens locally.
2. Start the Python backend.
3. Open a web application.
4. See console errors.
5. See failed API requests.
6. Select an error.
7. Receive a structured analysis.
8. Analyze a public GitHub repository.
9. See repository checks.
10. Export a Markdown/JSON report.
```

If these work reliably, the MVP is strong enough to demonstrate.

---

# 28. Version Roadmap

## v0.1

Project skeleton.

## v0.2

Console error detection.

## v0.3

API/network diagnostics.

## v0.4

Stack trace analysis.

## v0.5

GitHub repository analyzer.

## v0.6

Dashboard and reports.

## v0.7

Security and privacy hardening.

## v0.8

Testing and performance improvements.

## v0.9

Local AI integration.

## v1.0

Stable public release.

---

# 29. What NOT to Build Initially

Avoid scope explosion.

Do not initially build:

- user accounts
- payments
- cloud infrastructure
- team collaboration
- mobile application
- social features
- complicated AI agents
- automatic code modification
- full Postman replacement
- full GitHub replacement
- browser automation

The goal is a focused developer tool.

---

# 30. Portfolio Positioning

Project title:

```text
DevLens
```

Subtitle:

```text
Privacy-first developer diagnostics browser extension
```

Resume description:

```text
Built a privacy-first Chromium browser extension with a
Python FastAPI analysis backend for detecting console errors,
inspecting API failures, parsing stack traces, and analyzing
GitHub repositories using rule-based developer diagnostics.
```

Technologies:

```text
TypeScript
React
Tailwind CSS
Chrome Extension Manifest V3
Python
FastAPI
SQLite
GitHub API
pytest
Ollama / LM Studio
```

---

# 31. Interview Talking Points

Be prepared to explain:

### Why Python?

Python provides a strong ecosystem for:

- parsing
- static analysis
- API development
- automation
- AI/ML integration

### Why FastAPI?

It provides:

- typed request/response models
- asynchronous support
- automatic OpenAPI documentation
- simple Python integration

### Why Manifest V3?

Because modern Chromium extensions use the Manifest V3 architecture.

### Why local-first?

Developer diagnostic data can contain sensitive information. Local processing reduces unnecessary data exposure.

### Why rule-based analysis before AI?

Because deterministic rules are:

- faster
- cheaper
- easier to test
- easier to explain
- available offline

AI can be used where probabilistic explanation actually adds value.

---

# 32. Definition of Done

A feature is not finished just because it works once.

Every feature should have:

```text
✓ Implementation
✓ Error handling
✓ Input validation
✓ Tests
✓ Security review
✓ Documentation
✓ Loading state
✓ Empty state
✓ Failure state
```

Example:

For GitHub analysis:

```text
✓ Valid repository
✓ Invalid repository
✓ Private repository
✓ Repository not found
✓ API rate limit
✓ Network failure
✓ Empty repository
✓ Large repository
```

---

# 33. Final Product Goal

DevLens should feel like a real developer tool.

The user should be able to open a broken web application and quickly answer:

```text
What failed?
        ↓
Where did it fail?
        ↓
What information supports that diagnosis?
        ↓
What should I check next?
```

For a GitHub repository:

```text
How is this project structured?
        ↓
What configuration is required?
        ↓
What common setup problems exist?
        ↓
What should I inspect first?
```

The system should provide evidence and suggestions, not pretend that static diagnostics can always identify the exact root cause.

---

# 34. First Milestone

Start with only this:

```text
DevLens v0.1

Chrome Extension
      +
React popup
      +
FastAPI backend
      +
/api/health
      +
Console error collector
      +
POST /api/analyze/error
      +
Basic error explanation
```

Once this works end-to-end, move to network/API inspection.

That gives you a working vertical slice instead of spending weeks building infrastructure before anything useful exists.
