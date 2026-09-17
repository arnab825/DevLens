// DevLens Internal Browser Diagnostics Engine
// Provides 100% full analytical capabilities natively inside the browser extension
// without requiring a local Python backend or batch file to be running.
'use strict';

const InternalEngine = {
  // 1. Full Heuristic JavaScript Error Analyzer
  analyzeError: function(message, stack) {
    message = String(message || '');
    stack = String(stack || '');

    // Rule 1: Cannot read properties of undefined/null
    const nullMatch = message.match(/Cannot read propert(y|ies) of (undefined|null)(?: \(reading '?(.*?)'?\))?/i);
    if (nullMatch) {
      const prop = nullMatch[3] || 'property';
      return {
        type: "TypeError",
        category: "Null or Undefined Property Access",
        summary: `Attempted to access property '${prop}' on an object that evaluates to undefined or null.`,
        possible_causes: [
          "Asynchronous API request has not completed yet when component rendered.",
          "Object hierarchy was omitted, empty, or undefined in payload.",
          `Typo in '${prop}' or unexpected API schema mismatch.`
        ],
        suggested_checks: [
          `Use optional chaining: 'data?.${prop}' instead of direct access.`,
          `Provide fallback default: '(data || {}).${prop}' or initialize with default state.`,
          "Inspect network payload to verify key spelling and nested structure."
        ]
      };
    }

    // Rule 2: Function invocation on non-callable
    const fnMatch = message.match(/(.*?) is not a function/i);
    if (fnMatch) {
      const prop = fnMatch[1] || 'identifier';
      return {
        type: "TypeError",
        category: "Invalid Function Call",
        summary: `Attempted to invoke '${prop}', but its current runtime value is not callable.`,
        possible_causes: [
          "Callback or function prop was not provided, exported, or bound properly.",
          "Imported default export as named export (or vice-versa).",
          "Variable reassigned to primitive or null before invocation."
        ],
        suggested_checks: [
          "Check import statement (e.g. 'import { fn }' vs 'import fn').",
          `Add callable guard: 'typeof ${prop} === "function" && ${prop}()'.`,
          "Log target value right before invocation to inspect actual runtime type."
        ]
      };
    }

    // Rule 3: Undeclared identifier
    const defMatch = message.match(/(.*?) is not defined/i);
    if (defMatch) {
      const prop = defMatch[1] || 'identifier';
      return {
        type: "ReferenceError",
        category: "Undeclared Identifier",
        summary: `Variable or identifier '${prop}' was referenced before declaration or outside its scope.`,
        possible_causes: [
          "Missing 'import', 'const', or 'let' declaration.",
          "Referenced outside the block or function scope where it was declared.",
          `Typo in spelling '${prop}'.`
        ],
        suggested_checks: [
          `Ensure '${prop}' is imported or declared in accessible scope.`,
          "Verify spelling across import and usage sites.",
          "Check build bundler transpile targets."
        ]
      };
    }

    // Rule 4: Network & CORS failures
    if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(message)) {
      return {
        type: "NetworkError",
        category: "Network / CORS Failure",
        summary: "Asynchronous HTTP/Fetch request was blocked by browser or failed to reach destination.",
        possible_causes: [
          "Cross-Origin Resource Sharing (CORS) header missing ('Access-Control-Allow-Origin').",
          "Destination server is offline, crashed, or port is unreachable.",
          "Mixed content restriction (HTTPS origin calling HTTP endpoint)."
        ],
        suggested_checks: [
          "Check server responses for 'Access-Control-Allow-Origin: *'.",
          "Verify API server status and network endpoint reachability.",
          "Ensure protocol match (https:// vs http://)."
        ]
      };
    }

    // Rule 5: Recursion & Stack overflow
    if (/Maximum call stack size exceeded/i.test(message)) {
      return {
        type: "RangeError",
        category: "Infinite Recursion / Render Loop",
        summary: "Call stack limit exceeded due to infinite recursion or uncontrolled state render loop.",
        possible_causes: [
          "Recursive function without a valid terminating base case.",
          "In React: invoking state updater directly inside render body instead of inside useEffect or event handler.",
          "Circular references in JSON serialization."
        ],
        suggested_checks: [
          "Verify recursion terminating conditions.",
          "Ensure event handlers wrap dispatch: 'onClick={() => setState(...)}'.",
          "Check for circular object dependencies."
        ]
      };
    }

    return {
      type: "RuntimeError",
      category: "Unclassified Runtime Error",
      summary: message,
      possible_causes: ["Unhandled runtime exception in application bundle."],
      suggested_checks: [
        "Inspect call stack trace in DevTools console.",
        "Check line and column location in source map."
      ]
    };
  },

  // 2. Full HTTP Status & Network Inspector
  analyzeNetwork: function(method, url, status, duration_ms) {
    const statusMap = {
      400: {
        category: "Bad Request",
        summary: "Server could not understand request due to malformed syntax or schema validation failure.",
        causes: ["Malformed request JSON body", "Missing required query parameters", "Invalid data types"],
        suggestions: ["Inspect payload against API schema", "Validate query parameter encoding"]
      },
      401: {
        category: "Unauthorized",
        summary: "Authentication credentials are missing, invalid, or expired.",
        causes: ["Missing Bearer token or Authorization header", "Expired JWT or session cookie", "Revoked credentials"],
        suggestions: ["Verify Authorization header presence", "Refresh session token or re-authenticate"]
      },
      403: {
        category: "Forbidden",
        summary: "Authenticated user does not have permission to access this resource.",
        causes: ["Insufficient role or ACL privileges", "CSRF token missing or mismatch", "IP whitelist restriction"],
        suggestions: ["Check user permission roles", "Verify CSRF token if performing POST/PUT/DELETE"]
      },
      404: {
        category: "Not Found",
        summary: "Target endpoint or resource was not found on the server.",
        causes: ["Typo in API URL path", "Missing route prefix (e.g. /api/v1)", "Resource deleted"],
        suggestions: ["Verify URL path spelling and routing definitions", "Check backend route table"]
      },
      422: {
        category: "Unprocessable Entity",
        summary: "Request was well-formed but contained semantic validation errors.",
        causes: ["Missing required fields in payload", "Data validation constraint violation"],
        suggestions: ["Inspect response error body for field-level errors", "Verify Zod/Pydantic schema"]
      },
      429: {
        category: "Rate Limited",
        summary: "Client sent too many requests in a given amount of time.",
        causes: ["Exceeded rate limit quota", "Rapid polling or retry storm without backoff"],
        suggestions: ["Check Retry-After response header", "Implement request debouncing or exponential backoff"]
      },
      500: {
        category: "Internal Server Error",
        summary: "Target server encountered an unhandled exception.",
        causes: ["Server-side crash or unhandled exception in route handler", "Database connection timeout"],
        suggestions: ["Inspect backend server logs", "Check database and upstream service connectivity"]
      },
      502: {
        category: "Bad Gateway",
        summary: "Gateway or reverse proxy received an invalid response from upstream server.",
        causes: ["Backend process is crashed or restarting", "Reverse proxy misconfigured upstream port"],
        suggestions: ["Check if application server process is running", "Inspect proxy error logs"]
      },
      503: {
        category: "Service Unavailable",
        summary: "Server is temporarily unable to handle the request due to maintenance or overload.",
        causes: ["Server overloaded", "Service maintenance or deployment in progress"],
        suggestions: ["Retry with exponential backoff", "Check health status of target cluster"]
      },
      504: {
        category: "Gateway Timeout",
        summary: "Upstream server failed to respond within gateway timeout limit.",
        causes: ["Slow backend database query", "Deadlock or blocking CPU computation"],
        suggestions: ["Profile backend endpoint query performance", "Increase proxy timeout if expected"]
      }
    };

    if (status === 0) {
      return {
        category: "CORS / Network Blocked",
        summary: "Request was aborted or blocked before receiving an HTTP response.",
        possible_causes: [
          "Target server is offline or unreachable.",
          "Browser blocked cross-origin request due to missing Access-Control-Allow-Origin header.",
          "Request was blocked by an ad-blocker or content security policy."
        ],
        suggested_checks: [
          "Verify target server is up and listening.",
          "Check browser console for CORS error messages.",
          "Ensure preflight OPTIONS requests return status 200/204."
        ]
      };
    }

    const matched = statusMap[status] || {
      category: `HTTP ${status}`,
      summary: `HTTP request finished with status ${status}.`,
      causes: ["Server returned error or redirection status."],
      suggestions: ["Check response payload and server logs."]
    };

    return {
      category: matched.category,
      summary: matched.summary,
      possible_causes: matched.causes,
      suggested_checks: matched.suggestions
    };
  },

  // 3. Full V8 & Python Call Stack Parser
  parseStacktrace: function(rawTrace) {
    rawTrace = String(rawTrace || '').trim();
    if (!rawTrace) return null;

    const lines = rawTrace.split('\n').map(l => l.trim()).filter(Boolean);
    const isPython = rawTrace.includes('Traceback (most recent call last):') || /File ".*?", line \d+/.test(rawTrace);

    if (isPython) {
      const frames = [];
      const pyPattern = /File "(.*?)", line (\d+)(?:, in (.*))?/;
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(pyPattern);
        if (m) {
          frames.push({
            file: m[1],
            line: parseInt(m[2], 10),
            function: m[3] || '<module>'
          });
        }
      }
      const lastLine = lines[lines.length - 1] || 'Exception';
      const parts = lastLine.includes(':') ? lastLine.split(':') : ['Exception', lastLine];
      const topFrame = frames[frames.length - 1];

      return {
        language: 'python',
        exception_type: parts[0].trim(),
        message: parts.slice(1).join(':').trim(),
        total_frames: frames.length,
        frames: frames,
        root_cause_hint: topFrame ? `Failure originated in ${topFrame.function} at ${topFrame.file}:${topFrame.line}` : 'Could not locate origin frame'
      };
    }

    // JavaScript / V8 Trace
    const header = lines[0] || 'Error';
    const headerParts = header.includes(':') ? header.split(':') : ['Error', header];
    const frames = [];
    const v8Pattern = /at\s+(?:([^\s(]+)\s+\()?(.*?)(?::(\d+):(\d+))?\)?$/;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('at ')) continue;
      const m = line.match(v8Pattern);
      if (m) {
        frames.push({
          function: m[1] || '<anonymous>',
          file: m[2] || 'inline',
          line: m[3] ? parseInt(m[3], 10) : 0,
          col: m[4] ? parseInt(m[4], 10) : 0
        });
      }
    }

    const topFrame = frames[0];
    return {
      language: 'javascript',
      exception_type: headerParts[0].trim(),
      message: headerParts.slice(1).join(':').trim() || header,
      total_frames: frames.length,
      frames: frames,
      root_cause_hint: topFrame ? `Failure originated in ${topFrame.function} at ${topFrame.file}:${topFrame.line}` : 'Inline script execution'
    };
  }
};
