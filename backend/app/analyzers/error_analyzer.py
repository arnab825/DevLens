import re
from typing import Dict, Any, List

ERROR_RULES = [
    {
        "pattern": r"Cannot read propert(y|ies) of (undefined|null) \(reading '?(.*?)'?\)",
        "type": "TypeError",
        "category": "Null or Undefined Property Access",
        "summary_template": "Attempted to access property '{prop}' on an object that is undefined or null.",
        "causes": [
            "Data from an asynchronous API request has not arrived yet when the component rendered.",
            "The object structure is deeply nested and a parent key was omitted or null.",
            "Typo in the property name or incorrect API payload schema."
        ],
        "suggestions": [
            "Use optional chaining: `data?.{prop}` instead of direct property access.",
            "Add a default fallback: `(data || {}).{prop}` or specify default props.",
            "Check network response payload to verify the key name and hierarchy."
        ]
    },
    {
        "pattern": r"(.*?) is not a function",
        "type": "TypeError",
        "category": "Invalid Function Call",
        "summary_template": "Attempted to call '{prop}', but its current value is not callable.",
        "causes": [
            "The method or callback was not properly bound, exported, or passed as a prop.",
            "A variable name shadow or typo reassigned the function to undefined or a primitive.",
            "Importing a default export as a named export or vice-versa."
        ],
        "suggestions": [
            "Verify the import statement (e.g. `import { fn }` vs `import fn`).",
            "Add a type/callable guard: `typeof fn === 'function' && fn()`.",
            "Log the target variable before invocation to inspect its actual runtime type."
        ]
    },
    {
        "pattern": r"(.*?) is not defined",
        "type": "ReferenceError",
        "category": "Undeclared Identifier",
        "summary_template": "Variable or identifier '{prop}' was referenced before declaration or outside its scope.",
        "causes": [
            "Missing import statement or missing `const` / `let` declaration.",
            "Variable accessed outside the block or function scope in which it was declared.",
            "Typo in variable name."
        ],
        "suggestions": [
            "Check if the identifier requires an explicit `import` or `require`.",
            "Verify scope boundaries and ensure the variable is declared in accessible scope.",
            "Check for spelling mistakes in the identifier."
        ]
    },
    {
        "pattern": r"Failed to fetch|NetworkError|Load failed",
        "type": "NetworkError",
        "category": "Network or CORS Failure",
        "summary_template": "An asynchronous network request failed to complete.",
        "causes": [
            "Target server is offline or unreachable on the specified port.",
            "CORS policy blocked the cross-origin request due to missing Access-Control-Allow-Origin headers.",
            "Mixed content restriction (HTTPS page attempting to fetch HTTP resource)."
        ],
        "suggestions": [
            "Verify that the backend server is running and listening on the expected host/port.",
            "Check browser DevTools Console for 'Cross-Origin Request Blocked' messages.",
            "Ensure the server returns proper CORS preflight headers (`Access-Control-Allow-Origin`)."
        ]
    },
    {
        "pattern": r"Maximum call stack size exceeded",
        "type": "RangeError",
        "category": "Infinite Recursion / Render Loop",
        "summary_template": "Call stack limit exceeded, typically caused by uncontrolled recursion.",
        "causes": [
            "A recursive function without a valid terminating base case.",
            "In React: invoking state updater directly inside render body instead of an event handler or useEffect.",
            "Circular reference in JSON serialization or object traversal."
        ],
        "suggestions": [
            "Check recursive function calls for proper termination conditions.",
            "In React, ensure state dispatch is wrapped: `onClick={() => setState(...)}` instead of `onClick={setState(...)}`."
        ]
    }
]

def analyze_error(message: str, stack: str = "", source_file: str = "", line: int = 0) -> Dict[str, Any]:
    for rule in ERROR_RULES:
        match = re.search(rule["pattern"], message, re.IGNORECASE)
        if match:
            groups = match.groups()
            prop_name = groups[-1] if groups else "item"
            summary = rule["summary_template"].replace("{prop}", prop_name)
            suggestions = [s.replace("{prop}", prop_name) for s in rule["suggestions"]]
            return {
                "type": rule["type"],
                "category": rule["category"],
                "matched": True,
                "summary": summary,
                "possible_causes": rule["causes"],
                "suggested_checks": suggestions,
                "source_context": f"{source_file}:{line}" if source_file else "Unknown source"
            }
    
    # Generic Fallback Heuristic
    error_type = "JavaScriptError"
    if ":" in message:
        potential_type = message.split(":")[0].strip()
        if "Error" in potential_type:
            error_type = potential_type

    return {
        "type": error_type,
        "category": "Unclassified Runtime Error",
        "matched": False,
        "summary": f"Runtime error detected: {message.strip()}",
        "possible_causes": [
            "Unexpected runtime condition or unhandled edge case.",
            "Unhandled rejected promise or uncaught exception in event listener."
        ],
        "suggested_checks": [
            "Inspect the stack trace to locate the exact failing line and caller frame.",
            "Add a try/catch boundary or promise .catch() handler around the failing logic."
        ],
        "source_context": f"{source_file}:{line}" if source_file else "Unknown source"
    }
